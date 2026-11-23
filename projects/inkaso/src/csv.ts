import type { PaymentRow } from "./data";

export interface ParseResult { rows: PaymentRow[]; errors: string[] }

/** Parses "data;kwota;nadawca;tytul" (semicolon or comma separated, Polish decimal comma allowed). */
export function parseStatement(text: string): ParseResult {
  const rows: PaymentRow[] = [];
  const errors: string[] = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { rows, errors: ["Plik jest pusty."] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const start = /data/i.test(lines[0]) ? 1 : 0;
  lines.slice(start).forEach((line, i) => {
    const [data, kwota, nadawca, ...rest] = line.split(sep);
    const amount = Number(String(kwota ?? "").replace(/\s/g, "").replace(",", "."));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? "") || !Number.isFinite(amount) || !nadawca) {
      errors.push(`Wiersz ${i + start + 1}: nie rozpoznano formatu („${line.slice(0, 40)}…”).`);
      return;
    }
    rows.push({ data, kwota: Math.round(amount * 100) / 100, nadawca: nadawca.trim(), tytul: rest.join(sep).trim() });
  });
  return { rows, errors };
}
