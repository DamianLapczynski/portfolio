import type { Database, SqlValue } from "sql.js";
import type { CaseRow, PaymentRow } from "./data";
import { keyOf, nameKey } from "./text";

/* =====================================================================
   Model danych i reguły dopasowania. Cała logika jest w SQL-u (SQLite
   w przeglądarce przez sql.js); TypeScript tylko normalizuje tekst
   i zbiera wyniki.
   ===================================================================== */

export type Status = "nowa" | "zatwierdzona" | "do weryfikacji" | "odrzucona" | "brak dopasowania";

export interface PaymentView {
  id: number; data: string; kwota: number; nadawca: string; tytul: string;
  sprawa_id: string | null; regula: string | null; status: Status; dluznik: string | null;
}
export interface CaseView {
  id: string; dluznik: string; email: string; kwota: number; termin: string;
  wplacono: number; do_zaplaty: number; dni_po_terminie: number;
}
export interface LogEntry {
  id: number; czas: string; akcja: string; wplata_id: number;
  poprzednia_sprawa: string | null; nowa_sprawa: string | null;
  poprzedni_status: string; nowy_status: string; cofniete: number; kwota: number;
}
export interface Step { name: string; sql: string; changed: number }

export const SCHEMA = `
CREATE TABLE sprawy (
  id            TEXT PRIMARY KEY,
  klucz         TEXT NOT NULL,      -- numer sprawy bez znaków: WIN20260412
  dluznik       TEXT NOT NULL,
  dluznik_klucz TEXT NOT NULL,      -- nazwa bez formy prawnej, słowa posortowane
  email         TEXT,
  kwota         REAL NOT NULL,
  termin        TEXT NOT NULL
);
CREATE TABLE wplaty (
  id            INTEGER PRIMARY KEY,
  data          TEXT NOT NULL,
  kwota         REAL NOT NULL,
  nadawca       TEXT NOT NULL,
  nadawca_klucz TEXT NOT NULL,
  tytul         TEXT NOT NULL,
  tytul_klucz   TEXT NOT NULL,
  sprawa_id     TEXT REFERENCES sprawy(id),
  regula        TEXT,
  status        TEXT NOT NULL DEFAULT 'nowa'
);
CREATE TABLE dziennik (
  id                 INTEGER PRIMARY KEY,
  czas               TEXT NOT NULL,
  akcja              TEXT NOT NULL,
  wplata_id          INTEGER NOT NULL REFERENCES wplaty(id),
  poprzednia_sprawa  TEXT,
  nowa_sprawa        TEXT,
  poprzedni_status   TEXT NOT NULL,
  nowy_status        TEXT NOT NULL,
  cofniete           INTEGER NOT NULL DEFAULT 0
);
-- saldo liczone zawsze z zatwierdzonych wpłat, więc cofnięcie zmiany nie wymaga poprawiania kwot
CREATE VIEW saldo AS
SELECT s.*,
       COALESCE((SELECT SUM(w.kwota) FROM wplaty w WHERE w.sprawa_id = s.id AND w.status = 'zatwierdzona'), 0) AS wplacono,
       s.kwota - COALESCE((SELECT SUM(w.kwota) FROM wplaty w WHERE w.sprawa_id = s.id AND w.status = 'zatwierdzona'), 0) AS do_zaplaty
FROM sprawy s;
`;

/** Matching rules, run in order. Each only touches payments that are still unmatched. */
export const RULES: Step[] = [
  {
    name: "1. Numer sprawy w tytule przelewu → zatwierdź automatycznie",
    changed: 0,
    sql: `UPDATE wplaty
SET sprawa_id = (SELECT s.id FROM sprawy s WHERE instr(wplaty.tytul_klucz, s.klucz) > 0),
    regula    = 'numer sprawy w tytule',
    status    = 'zatwierdzona'
WHERE sprawa_id IS NULL
  AND (SELECT COUNT(*) FROM sprawy s WHERE instr(wplaty.tytul_klucz, s.klucz) > 0) = 1;`,
  },
  {
    name: "2. Nadawca = dłużnik i kwota = saldo → do weryfikacji",
    changed: 0,
    sql: `UPDATE wplaty
SET sprawa_id = (SELECT s.id FROM saldo s
                 WHERE s.dluznik_klucz = wplaty.nadawca_klucz AND ABS(s.do_zaplaty - wplaty.kwota) < 0.005),
    regula    = 'nadawca i kwota zgodne',
    status    = 'do weryfikacji'
WHERE sprawa_id IS NULL
  AND (SELECT COUNT(*) FROM saldo s
       WHERE s.dluznik_klucz = wplaty.nadawca_klucz AND ABS(s.do_zaplaty - wplaty.kwota) < 0.005) = 1;`,
  },
  {
    name: "3. Nadawca = dłużnik, inna kwota (wpłata częściowa?) → do weryfikacji",
    changed: 0,
    sql: `UPDATE wplaty
SET sprawa_id = (SELECT s.id FROM sprawy s WHERE s.dluznik_klucz = wplaty.nadawca_klucz),
    regula    = 'nadawca zgodny, inna kwota',
    status    = 'do weryfikacji'
WHERE sprawa_id IS NULL
  AND (SELECT COUNT(*) FROM sprawy s WHERE s.dluznik_klucz = wplaty.nadawca_klucz) = 1;`,
  },
  {
    name: "4. Reszta → brak dopasowania (do ręcznego przypisania)",
    changed: 0,
    sql: `UPDATE wplaty SET status = 'brak dopasowania' WHERE sprawa_id IS NULL AND status = 'nowa';`,
  },
];

function rows<T>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out: T[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as T);
  stmt.free();
  return out;
}

function now(): string {
  return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function initSchema(db: Database, cases: CaseRow[]): void {
  db.run(SCHEMA);
  const stmt = db.prepare("INSERT INTO sprawy VALUES (?, ?, ?, ?, ?, ?, ?)");
  cases.forEach((c) => stmt.run([c.id, keyOf(c.id), c.dluznik, nameKey(c.dluznik), c.email, c.kwota, c.termin]));
  stmt.free();
}

export function importPayments(db: Database, list: PaymentRow[]): number {
  const stmt = db.prepare("INSERT INTO wplaty (data, kwota, nadawca, nadawca_klucz, tytul, tytul_klucz) VALUES (?, ?, ?, ?, ?, ?)");
  list.forEach((p) => stmt.run([p.data, p.kwota, p.nadawca, nameKey(p.nadawca), p.tytul, keyOf(p.tytul)]));
  stmt.free();
  return list.length;
}

/** Runs all rules; auto-approved payments get a journal entry so they can be undone like manual ones. */
export function runMatching(db: Database): Step[] {
  const before = new Set(rows<{ id: number }>(db, "SELECT id FROM wplaty WHERE status = 'zatwierdzona'").map((r) => r.id));
  const steps = RULES.map((r) => {
    db.run(r.sql);
    return { ...r, changed: db.getRowsModified() };
  });
  rows<{ id: number; sprawa_id: string }>(db, "SELECT id, sprawa_id FROM wplaty WHERE status = 'zatwierdzona'")
    .filter((r) => !before.has(r.id))
    .forEach((r) => journal(db, "auto: numer sprawy w tytule", r.id, null, r.sprawa_id, "do weryfikacji", "zatwierdzona"));
  return steps;
}

function journal(db: Database, akcja: string, wplataId: number, prevCase: string | null, newCase: string | null, prev: string, next: string) {
  db.run(
    "INSERT INTO dziennik (czas, akcja, wplata_id, poprzednia_sprawa, nowa_sprawa, poprzedni_status, nowy_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [now(), akcja, wplataId, prevCase, newCase, prev, next]
  );
}

/** Human decision on a payment: approve / reject / assign to a case manually. */
export function decide(db: Database, wplataId: number, next: Status, caseId?: string | null): void {
  const [p] = rows<{ status: string; sprawa_id: string | null }>(db, "SELECT status, sprawa_id FROM wplaty WHERE id = ?", [wplataId]);
  if (!p) return;
  const newCase = caseId !== undefined ? caseId : p.sprawa_id;
  db.run("UPDATE wplaty SET status = ?, sprawa_id = ?, regula = COALESCE(?, regula) WHERE id = ?",
    [next, newCase, caseId !== undefined ? "przypisano ręcznie" : null, wplataId]);
  const label = next === "zatwierdzona" ? (caseId !== undefined ? "przypisano ręcznie" : "zatwierdzono") : "odrzucono";
  journal(db, label, wplataId, p.sprawa_id, newCase, p.status, next);
}

/** Undo one journal entry: restores the payment's previous status and case. */
export function undo(db: Database, logId: number): void {
  const [e] = rows<LogEntry>(db, "SELECT * FROM dziennik WHERE id = ? AND cofniete = 0", [logId]);
  if (!e) return;
  const prevCase = e.akcja.startsWith("auto") ? e.nowa_sprawa : e.poprzednia_sprawa;
  db.run("UPDATE wplaty SET status = ?, sprawa_id = ?, regula = CASE WHEN ? IS NULL THEN NULL ELSE regula END WHERE id = ?",
    [e.poprzedni_status, prevCase, prevCase, e.wplata_id]);
  db.run("UPDATE dziennik SET cofniete = 1 WHERE id = ?", [logId]);
}

export const payments = (db: Database) =>
  rows<PaymentView>(db, `SELECT w.id, w.data, w.kwota, w.nadawca, w.tytul, w.sprawa_id, w.regula, w.status, s.dluznik
                         FROM wplaty w LEFT JOIN sprawy s ON s.id = w.sprawa_id ORDER BY w.data, w.id`);

export const cases = (db: Database, today: string) =>
  rows<CaseView>(db, `SELECT id, dluznik, email, kwota, termin, wplacono, ROUND(do_zaplaty, 2) AS do_zaplaty,
                             CAST(julianday(?) - julianday(termin) AS INTEGER) AS dni_po_terminie
                      FROM saldo ORDER BY termin`, [today]);

export const overdue = (db: Database, today: string) =>
  cases(db, today).filter((c) => c.do_zaplaty > 0.005 && c.dni_po_terminie > 0);

export const journalEntries = (db: Database) =>
  rows<LogEntry>(db, `SELECT d.*, w.kwota FROM dziennik d JOIN wplaty w ON w.id = d.wplata_id ORDER BY d.id DESC`);

export function stats(db: Database) {
  const [s] = rows<Record<string, number>>(db, `
    SELECT COUNT(*)                                                    AS wszystkie,
           SUM(status = 'zatwierdzona' AND regula = 'numer sprawy w tytule') AS automatycznie,
           SUM(status = 'zatwierdzona')                                AS zatwierdzone,
           SUM(status = 'do weryfikacji')                              AS do_weryfikacji,
           SUM(status = 'brak dopasowania')                            AS bez_dopasowania,
           COALESCE(SUM(CASE WHEN status = 'zatwierdzona' THEN kwota END), 0) AS zaksiegowano,
           SUM(instr(tytul_klucz, 'WIN') = 0)                          AS bez_numeru
    FROM wplaty`);
  return s;
}
