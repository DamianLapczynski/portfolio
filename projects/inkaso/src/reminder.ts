import type { CaseView } from "./db";
import { pln } from "./text";

export const ACCOUNT = "00 1234 5678 9012 3456 7890 0000"; // fikcyjny numer konta

export type Tier = "przypomnienie" | "wezwanie" | "ostateczne";

export function tierOf(days: number): Tier {
  if (days <= 14) return "przypomnienie";
  if (days <= 45) return "wezwanie";
  return "ostateczne";
}

const SUBJECT: Record<Tier, string> = {
  przypomnienie: "Przypomnienie o płatności",
  wezwanie: "Wezwanie do zapłaty",
  ostateczne: "Ostateczne wezwanie do zapłaty",
};

/** Plain-language reminder. Asks for the case number in the transfer title, which is what makes rule 1 work next time. */
export function reminder(c: CaseView): { subject: string; body: string; tier: Tier } {
  const tier = tierOf(c.dni_po_terminie);
  const partial = c.wplacono > 0
    ? `Dziękujemy za dotychczasową wpłatę ${pln(c.wplacono)}. Do zapłaty zostało ${pln(c.do_zaplaty)}.`
    : `Do zapłaty pozostaje ${pln(c.do_zaplaty)}.`;
  const opening: Record<Tier, string> = {
    przypomnienie: `uprzejmie przypominamy, że termin płatności w sprawie ${c.id} minął ${c.dni_po_terminie} dni temu. Być może przelew po prostu umknął w natłoku spraw.`,
    wezwanie: `termin płatności w sprawie ${c.id} minął ${c.dni_po_terminie} dni temu i do dziś nie odnotowaliśmy pełnej wpłaty.`,
    ostateczne: `mimo wcześniejszych wiadomości płatność w sprawie ${c.id} jest opóźniona o ${c.dni_po_terminie} dni. Zależy nam na polubownym rozwiązaniu, zanim sprawa przejdzie do kolejnego etapu.`,
  };
  const body = [
    "Dzień dobry,",
    "",
    opening[tier],
    partial,
    "",
    `Numer konta: ${ACCOUNT}`,
    `Tytuł przelewu: ${c.id}  ← prosimy wpisać dokładnie ten numer, wtedy wpłata zaksięguje się automatycznie.`,
    "",
    tier === "przypomnienie"
      ? "Jeśli płatność została już wykonana, prosimy potraktować tę wiadomość jako nieaktualną."
      : "Jeśli jednorazowa wpłata jest teraz trudna, odpisz na tę wiadomość. Możemy ustalić spłatę w ratach.",
    "",
    "Pozdrawiamy,",
    "Dział obsługi należności",
  ].join("\n");
  return { subject: `${SUBJECT[tier]}: sprawa ${c.id}`, body, tier };
}
