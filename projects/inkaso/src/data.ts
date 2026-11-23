/** Fictional demo data. Any resemblance to real people or companies is accidental. */

export const TODAY = "2026-11-23";

export interface CaseRow { id: string; dluznik: string; email: string; kwota: number; termin: string }
export interface PaymentRow { data: string; kwota: number; nadawca: string; tytul: string }

export const CASES: CaseRow[] = [
  { id: "WIN/2026/0412", dluznik: "Piekarnia Złoty Kłos Sp. z o.o.", email: "biuro@zlotyklos.example", kwota: 4820, termin: "2026-10-15" },
  { id: "WIN/2026/0415", dluznik: "Jan Kowalski", email: "j.kowalski@example.com", kwota: 1250, termin: "2026-11-02" },
  { id: "WIN/2026/0419", dluznik: "Auto-Serwis Marek Nowak", email: "serwis@example.com", kwota: 3400, termin: "2026-09-30" },
  { id: "WIN/2026/0423", dluznik: "Anna Wiśniewska", email: "anna.w@example.com", kwota: 680.5, termin: "2026-11-10" },
  { id: "WIN/2026/0431", dluznik: "Studio Urody Lilia s.c.", email: "kontakt@lilia.example", kwota: 2100, termin: "2026-10-01" },
  { id: "WIN/2026/0436", dluznik: "Tomasz Zieliński", email: "t.zielinski@example.com", kwota: 950, termin: "2026-11-20" },
  { id: "WIN/2026/0440", dluznik: "Hurtownia Budmat Sp. z o.o.", email: "ksiegowosc@budmat.example", kwota: 12300, termin: "2026-08-31" },
  { id: "WIN/2026/0444", dluznik: "Katarzyna Lewandowska", email: "k.lewandowska@example.com", kwota: 430, termin: "2026-12-05" },
  { id: "WIN/2026/0447", dluznik: "Ogrody Zielony Zakątek Sp. j.", email: "biuro@zakatek.example", kwota: 5600, termin: "2026-10-20" },
  { id: "WIN/2026/0452", dluznik: "Piotr Wójcik", email: "p.wojcik@example.com", kwota: 1780, termin: "2026-11-05" },
  { id: "WIN/2026/0455", dluznik: "Restauracja Pod Lipą Sp. z o.o.", email: "rachunki@podlipa.example", kwota: 7250, termin: "2026-09-15" },
  { id: "WIN/2026/0459", dluznik: "Marta Kamińska", email: "marta.k@example.com", kwota: 315, termin: "2026-11-18" },
];

/** Bank statement export, the format most Polish banks offer: data;kwota;nadawca;tytuł */
export const SAMPLE_CSV = `data;kwota;nadawca;tytul
2026-11-18;4820,00;PIEKARNIA ZLOTY KLOS SP Z O O;Zaplata WIN/2026/0412 faktura 88/2026
2026-11-18;1250,00;KOWALSKI JAN;win 2026 0415
2026-11-19;3400,00;AUTO-SERWIS MAREK NOWAK;splata zadluzenia
2026-11-19;340,25;WISNIEWSKA ANNA;rata 1 sprawa 0423
2026-11-20;2100,00;STUDIO URODY LILIA S.C.;WIN/2026/0431
2026-11-20;189,99;JAN NOWAK;zwrot za zamowienie 5521
2026-11-20;6000,00;HURTOWNIA BUDMAT SP. Z O.O.;WIN/2026/440 czesc 1
2026-11-21;5600,00;OGRODY ZIELONY ZAKATEK SPOLKA JAWNA;faktura 2026/10/77
2026-11-21;1780,00;WOJCIK PIOTR;WIN/2026/0452
2026-11-22;1000,00;ZIELINSKI TOMASZ;WIN/2026/0436
2026-11-22;315,00;MARTA KAMINSKA;oplata
2026-11-22;250,00;FIRMA XYZ;WIN/2026/0999
2026-11-23;7250,00;ANNA KOWALSKA;za Restauracja Pod Lipa`;
