/** Text normalisation used before matching (done in TS, compared in SQL). */

export function stripDiacritics(s: string): string {
  return s.replace(/ł/g, "l").replace(/Ł/g, "L").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "win 2026 0412" and "WIN/2026/0412" → "WIN20260412" */
export function keyOf(s: string): string {
  return stripDiacritics(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const LEGAL_FORMS = new Set(["sp", "z", "o", "oo", "zoo", "spolka", "sa", "s", "a", "c", "sc", "j", "sj", "jawna", "ograniczona", "odpowiedzialnoscia", "akcyjna", "cywilna"]);

/**
 * Debtor / sender name → order-independent key without legal forms.
 * "KOWALSKI JAN" == "Jan Kowalski", "OGRODY ZIELONY ZAKATEK SPOLKA JAWNA" == "Ogrody Zielony Zakątek Sp. j."
 */
export function nameKey(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !LEGAL_FORMS.has(w))
    .sort()
    .join(" ");
}

export const pln = (n: number) =>
  n.toLocaleString("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2 });
