import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { CASES, SAMPLE_CSV, TODAY } from "./data";
import { parseStatement } from "./csv";
import {
  RULES, SCHEMA, cases as listCases, decide, importPayments, initSchema, journalEntries, overdue,
  payments as listPayments, runMatching, stats as getStats, undo, type PaymentView, type Step,
} from "./db";
import { reminder } from "./reminder";
import { pln } from "./text";

const STATUS_LABEL: Record<string, string> = {
  zatwierdzona: "Zaksięgowana",
  "do weryfikacji": "Do weryfikacji",
  "brak dopasowania": "Brak dopasowania",
  odrzucona: "Odrzucona",
  nowa: "Nowa",
};

export default function App() {
  const sqlRef = useRef<Awaited<ReturnType<typeof initSqlJs>> | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [tick, setTick] = useState(0);
  const [stage, setStage] = useState<"empty" | "imported" | "matched">("empty");
  const [steps, setSteps] = useState<Step[]>(RULES);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const refresh = () => setTick((t) => t + 1);

  const reset = useCallback(async () => {
    sqlRef.current ??= await initSqlJs({ locateFile: () => wasmUrl });
    const d = new sqlRef.current.Database();
    initSchema(d, CASES);
    setDb(d); setStage("empty"); setSteps(RULES); setErrors([]); refresh();
  }, []);
  useEffect(() => { reset(); }, [reset]);

  const load = (text: string) => {
    if (!db) return;
    const { rows, errors } = parseStatement(text);
    setErrors(errors);
    if (!rows.length) return;
    importPayments(db, rows);
    setStage("imported"); refresh();
  };
  const onFile = async (f?: File) => f && load(await f.text());
  const match = () => { if (!db) return; setSteps(runMatching(db)); setStage("matched"); refresh(); };
  const act = (fn: () => void) => { fn(); refresh(); };

  const data = useMemo(() => {
    if (!db) return null;
    return {
      payments: listPayments(db),
      cases: listCases(db, TODAY),
      overdue: overdue(db, TODAY),
      log: journalEntries(db),
      stats: getStats(db),
    };
  }, [db, tick]);

  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1600); } catch { /* clipboard blocked */ }
  };

  if (!db || !data) return <main className="wrap"><p className="muted">Ładowanie bazy SQL…</p></main>;
  const s = data.stats;
  const webhooks = data.log.filter((e) => e.nowy_status === "zatwierdzona" && !e.cofniete).slice(0, 4);

  return (
    <main className="wrap">
      <header className="top">
        <a className="back" href="../">← Wróć do pokoju</a>
        <p className="eyebrow">Demo · dane fikcyjne</p>
        <h1>Rozliczanie wpłat</h1>
        <p className="lead">
          Codzienna praca każdej firmy, która wystawia faktury, w czterech krokach: wczytaj wyciąg z banku, dopasuj wpłaty do spraw,
          zweryfikuj wątpliwe, wyślij przypomnienia zalegającym. Automat robi to, co pewne, a człowiek decyduje o reszcie.
        </p>
        <p className="tech">React · TypeScript · SQLite w przeglądarce (sql.js) · 13 testów (Vitest)</p>
      </header>

      {/* 1. Import */}
      <section className="card">
        <div className="card__head"><span className="num">1</span><h2>Wyciąg z banku</h2></div>
        {stage === "empty" ? (
          <>
            <p className="muted">Plik CSV w formacie <code>data;kwota;nadawca;tytul</code>, taki jak eksport z bankowości internetowej.</p>
            <div className="row">
              <button className="btn btn--primary" onClick={() => load(SAMPLE_CSV)}>Wczytaj przykładowy wyciąg</button>
              <label className="btn">Wgraj własny CSV<input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} /></label>
              <a className="btn btn--ghost" download="wyciag-przyklad.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}>Pobierz przykład</a>
            </div>
          </>
        ) : (
          <div className="row between">
            <p><strong>{s.wszystkie}</strong> wpłat wczytanych, {CASES.length} spraw w bazie.</p>
            <div className="row">
              {stage === "imported" && <button className="btn btn--primary" onClick={match}>Dopasuj wpłaty</button>}
              <button className="btn btn--ghost" onClick={reset}>Zacznij od nowa</button>
            </div>
          </div>
        )}
        {errors.length > 0 && <ul className="errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      </section>

      {stage === "matched" && (
        <>
          {/* 2. Result */}
          <section className="card">
            <div className="card__head"><span className="num">2</span><h2>Wynik dopasowania</h2></div>
            <div className="kpis">
              <Kpi label="Zaksięgowane automatycznie" value={s.automatycznie} tone="ok" />
              <Kpi label="Do weryfikacji" value={s.do_weryfikacji} tone="warn" />
              <Kpi label="Bez dopasowania" value={s.bez_dopasowania} tone="bad" />
              <Kpi label="Zaksięgowano łącznie" value={pln(s.zaksiegowano)} />
            </div>
            <div className="insight">
              <strong>Co z tego wynika:</strong> {s.bez_numeru} z {s.wszystkie} przelewów w ogóle nie ma numeru sprawy w tytule.
              Razem z literówkami w numerze to one wymagają pracy człowieka. Dlatego przypomnienia w kroku 4 proszą wprost o wpisanie numeru sprawy.
              Każdy taki przelew to później jedno kliknięcie mniej w księgowości.
            </div>
          </section>

          {/* 3. Review */}
          <section className="card">
            <div className="card__head"><span className="num">3</span><h2>Weryfikacja</h2></div>
            <div className="table">
              <div className="tr th"><span>Data</span><span>Kwota</span><span>Nadawca i tytuł</span><span>Sprawa</span><span>Status</span><span /></div>
              {data.payments.map((p) => (
                <PaymentRow key={p.id} p={p} db={db} cases={data.cases.map((c) => c.id)} act={act}
                  over={p.status === "zatwierdzona" ? -(data.cases.find((c) => c.id === p.sprawa_id)?.do_zaplaty ?? 0) : 0} />
              ))}
            </div>
          </section>

          {/* 4. Reminders */}
          <section className="card">
            <div className="card__head"><span className="num">4</span><h2>Przypomnienia dla zalegających ({data.overdue.length})</h2></div>
            <p className="muted">Ton zależy od opóźnienia. Wysyłka jest wyłączona w demo; w firmie szłaby przez pocztę albo system CRM.</p>
            <div className="reminders">
              {data.overdue.map((c) => {
                const r = reminder(c);
                return (
                  <details key={c.id} className="rem">
                    <summary>
                      <span className={`tier tier--${r.tier}`}>{r.tier}</span>
                      <span className="rem__who">{c.dluznik}</span>
                      <span className="rem__meta">{c.id} · {pln(c.do_zaplaty)} · {c.dni_po_terminie} dni</span>
                    </summary>
                    <div className="rem__body">
                      <p className="rem__subj">Do: {c.email}<br />Temat: {r.subject}</p>
                      <pre>{r.body}</pre>
                      <button className="btn btn--small" onClick={() => copy(c.id, `${r.subject}\n\n${r.body}`)}>{copied === c.id ? "Skopiowano ✓" : "Kopiuj treść"}</button>
                    </div>
                  </details>
                );
              })}
              {data.overdue.length === 0 && <p className="muted">Brak zaległości. Wszystko spłacone.</p>}
            </div>
          </section>

          <div className="grid2">
            {/* Journal */}
            <section className="card">
              <div className="card__head"><h2>Dziennik zmian</h2></div>
              <p className="muted">Każdą decyzję, także automatyczną, da się cofnąć. Saldo liczy się na nowo z zatwierdzonych wpłat.</p>
              <ul className="log">
                {data.log.map((e) => (
                  <li key={e.id} className={e.cofniete ? "is-undone" : ""}>
                    <span className="log__time">{e.czas}</span>
                    <span className="log__what">{e.akcja}: wpłata {pln(e.kwota)} → {e.nowy_status}{e.cofniete ? " (cofnięte)" : ""}</span>
                    {!e.cofniete && <button className="link" onClick={() => act(() => undo(db, e.id))}>Cofnij</button>}
                  </li>
                ))}
              </ul>
            </section>

            {/* Webhook */}
            <section className="card">
              <div className="card__head"><h2>Webhook do CRM (podgląd)</h2></div>
              <p className="muted">Po zaksięgowaniu wpłaty system wysłałby takie zdarzenie do CRM, żeby opiekun sprawy od razu je zobaczył.</p>
              <pre className="code">{JSON.stringify(webhooks.map((e) => ({
                event: "wplata.zaksiegowana", sprawa: e.nowa_sprawa ?? null, kwota: e.kwota, zrodlo: e.akcja,
              })), null, 2)}</pre>
            </section>
          </div>

          {/* SQL */}
          <section className="card">
            <details>
              <summary className="sqlsum"><h2>Jak to działa: SQL</h2><span className="muted">reguły uruchamiane po kolei na bazie SQLite</span></summary>
              {steps.map((st) => (
                <div key={st.name} className="rule">
                  <p><strong>{st.name}</strong> <span className="badge">{st.changed} wierszy</span></p>
                  <pre className="code">{st.sql}</pre>
                </div>
              ))}
              <p><strong>Schemat bazy</strong></p>
              <pre className="code">{SCHEMA.trim()}</pre>
            </details>
          </section>
        </>
      )}

      <footer className="foot muted">
        Projekt pokazowy Damiana Łapczyńskiego. Wszystkie dane są fikcyjne. ·{" "}
        <a href="https://github.com/DamianLapczynski/portfolio/tree/main/projects/inkaso">Kod źródłowy</a>
      </footer>
    </main>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "bad" }) {
  return <div className={`kpi ${tone ? `kpi--${tone}` : ""}`}><span className="kpi__v">{value}</span><span className="kpi__l">{label}</span></div>;
}

function PaymentRow({ p, db, cases, act, over }: { p: PaymentView; db: Database; cases: string[]; act: (fn: () => void) => void; over: number }) {
  const [pick, setPick] = useState("");
  return (
    <div className={`tr st--${p.status.replace(" ", "-")}`}>
      <span className="mono">{p.data.slice(5)}</span>
      <span className="mono right">{pln(p.kwota)}</span>
      <span className="who"><strong>{p.nadawca}</strong><small>{p.tytul || "(bez tytułu)"}</small></span>
      <span>{p.sprawa_id ? <><span className="mono">{p.sprawa_id}</span><small>{p.regula}</small>{over > 0.005 && <small className="over">nadpłata {pln(over)}: do zwrotu</small>}</> : <small className="muted">—</small>}</span>
      <span><span className={`chip chip--${p.status.replace(" ", "-")}`}>{STATUS_LABEL[p.status]}</span></span>
      <span className="actions">
        {p.status === "do weryfikacji" && (
          <>
            <button className="btn btn--small btn--primary" onClick={() => act(() => decide(db, p.id, "zatwierdzona"))}>Zatwierdź</button>
            <button className="btn btn--small" onClick={() => act(() => decide(db, p.id, "odrzucona"))}>Odrzuć</button>
          </>
        )}
        {p.status === "brak dopasowania" && (
          <>
            <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Wybierz sprawę">
              <option value="">Przypisz do…</option>
              {cases.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn--small" disabled={!pick} onClick={() => act(() => decide(db, p.id, "zatwierdzona", pick))}>OK</button>
          </>
        )}
      </span>
    </div>
  );
}
