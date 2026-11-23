import { describe, it, expect, beforeEach } from "vitest";
import initSqlJs, { type Database } from "sql.js";
import { CASES, SAMPLE_CSV, TODAY } from "./data";
import { parseStatement } from "./csv";
import { initSchema, importPayments, runMatching, payments, decide, undo, overdue, stats, journalEntries } from "./db";
import { keyOf, nameKey } from "./text";
import { reminder, tierOf } from "./reminder";

let db: Database;
beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  initSchema(db, CASES);
  importPayments(db, parseStatement(SAMPLE_CSV).rows);
  runMatching(db);
});

const byTitle = (t: string) => payments(db).find((p) => p.tytul === t)!;

describe("normalizacja", () => {
  it("numer sprawy w różnych zapisach", () => {
    expect(keyOf("win 2026 0415")).toBe(keyOf("WIN/2026/0415"));
  });
  it("nazwa: kolejność słów, polskie znaki i forma prawna", () => {
    expect(nameKey("KOWALSKI JAN")).toBe(nameKey("Jan Kowalski"));
    expect(nameKey("OGRODY ZIELONY ZAKATEK SPOLKA JAWNA")).toBe(nameKey("Ogrody Zielony Zakątek Sp. j."));
    expect(nameKey("PIEKARNIA ZLOTY KLOS SP Z O O")).toBe(nameKey("Piekarnia Złoty Kłos Sp. z o.o."));
  });
});

describe("CSV", () => {
  it("czyta przykładowy wyciąg bez błędów", () => {
    const r = parseStatement(SAMPLE_CSV);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(13);
    expect(r.rows[3].kwota).toBe(340.25);
  });
  it("zgłasza błędny wiersz zamiast go zgadywać", () => {
    expect(parseStatement("data;kwota;nadawca;tytul\nwczoraj;abc;X;Y").errors).toHaveLength(1);
  });
});

describe("dopasowanie", () => {
  it("rozkłada wpłaty na reguły zgodnie z oczekiwaniem", () => {
    const s = stats(db);
    expect(s.wszystkie).toBe(13);
    expect(s.automatycznie).toBe(5);
    expect(s.do_weryfikacji).toBe(5);
    expect(s.bez_dopasowania).toBe(3);
  });
  it("numer sprawy zapisany małymi literami ze spacjami", () => {
    expect(byTitle("win 2026 0415")).toMatchObject({ sprawa_id: "WIN/2026/0415", status: "zatwierdzona" });
  });
  it("nieistniejąca sprawa nie jest dopasowana", () => {
    expect(byTitle("WIN/2026/0999").status).toBe("brak dopasowania");
  });
  it("wpłata częściowa trafia do weryfikacji, nie jest księgowana automatycznie", () => {
    expect(byTitle("rata 1 sprawa 0423")).toMatchObject({ sprawa_id: "WIN/2026/0423", status: "do weryfikacji" });
  });
});

describe("decyzje i cofanie", () => {
  it("zatwierdzenie zmniejsza saldo, cofnięcie przywraca", () => {
    const p = byTitle("splata zadluzenia");
    const due = () => overdue(db, TODAY).find((c) => c.id === "WIN/2026/0419")?.do_zaplaty ?? 0;
    expect(due()).toBe(3400);
    decide(db, p.id, "zatwierdzona");
    expect(due()).toBe(0);
    undo(db, journalEntries(db)[0].id);
    expect(due()).toBe(3400);
    expect(byTitle("splata zadluzenia").status).toBe("do weryfikacji");
  });
  it("ręczne przypisanie i jego cofnięcie", () => {
    const p = byTitle("za Restauracja Pod Lipa");
    decide(db, p.id, "zatwierdzona", "WIN/2026/0455");
    expect(byTitle("za Restauracja Pod Lipa").sprawa_id).toBe("WIN/2026/0455");
    undo(db, journalEntries(db)[0].id);
    expect(byTitle("za Restauracja Pod Lipa")).toMatchObject({ sprawa_id: null, status: "brak dopasowania" });
  });
  it("cofnięcie automatycznego zatwierdzenia zostawia propozycję do weryfikacji", () => {
    const auto = journalEntries(db).find((e) => e.akcja.startsWith("auto"))!;
    undo(db, auto.id);
    const p = payments(db).find((x) => x.id === auto.wplata_id)!;
    expect(p.status).toBe("do weryfikacji");
    expect(p.sprawa_id).not.toBeNull();
  });
});

describe("przypomnienia", () => {
  it("przeterminowane sprawy po automatycznym dopasowaniu", () => {
    expect(overdue(db, TODAY).map((c) => c.id)).toEqual([
      "WIN/2026/0440", "WIN/2026/0455", "WIN/2026/0419", "WIN/2026/0447", "WIN/2026/0423", "WIN/2026/0459",
    ]);
  });
  it("ton zależy od opóźnienia i zawsze prosi o numer sprawy w tytule", () => {
    expect([tierOf(5), tierOf(30), tierOf(90)]).toEqual(["przypomnienie", "wezwanie", "ostateczne"]);
    const c = overdue(db, TODAY)[0];
    expect(reminder(c).body).toContain(`Tytuł przelewu: ${c.id}`);
  });
});
