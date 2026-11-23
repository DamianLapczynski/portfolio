/* =====================================================================
   TREŚCI POKOJU — tu edytujesz teksty, linki i dopasowanie do oferty.
   Każdy wpis odpowiada jednemu przedmiotowi w scenie 3D (po `id`).

   kind   – etykieta nad tytułem ("Projekt", "O mnie", ...)
   label  – krótka nazwa w dymku po najechaniu
   body   – akapity tekstu
   match  – wymagania z oferty, które ten przedmiot pokazuje
   links  – przyciski (url: GitHub Pages, repozytorium, mail…)
   ===================================================================== */

export const OFFER = {
  role: "Specjalista ds. automatyzacji procesów i AI",
  company: "Hadyński Inkaso",
};

export const ITEMS = [
  {
    id: "chair",
    kind: "O mnie",
    label: "Kim jestem",
    title: "Cześć, jestem Damian",
    body: [
      "Studiuję fizjoterapię na DSW we Wrocławiu, prowadzę zajęcia pływania, a po godzinach buduję narzędzia z Claude Code. Wcześniej ekonomia i rachunkowość, doświadczenie w sprzedaży, sporcie i edukacji.",
      "Ten pokój to moje portfolio. Każdy przedmiot to projekt albo cecha, która przyda się na stanowisku specjalisty ds. automatyzacji procesów i AI.",
      "Nie mam komercyjnego stażu w IT i nie będę udawał, że mam. Mam za to rzeczy, które zbudowałem sam i które rozwiązują prawdziwe problemy. Rozejrzyj się.",
    ],
    match: ["Ambicja, samodzielność i chęć szybkiej nauki", "Doświadczenie komercyjne nie jest wymagane"],
  },
  {
    id: "monitor",
    kind: "Stanowisko",
    label: "Komputer",
    title: "Claude Code to moje codzienne narzędzie",
    body: [
      "Przy tym biurku powstaje wszystko, co tu widzisz. Claude i Claude Code to moje codzienne narzędzia pracy: od aplikacji webowych, przez automatyzacje, po tę stronę.",
      "Ten pokój zbudowałem z Claude Code. Każdy model powstał z kodu w Three.js, bez gotowych plików 3D. Całość jest wersjonowana w Git i opublikowana na GitHub Pages.",
      "Pracuję tak: precyzyjne polecenie, potem ocena planu, który zaproponuje AI, potem sprawdzenie wyniku w przeglądarce. Dopiero wtedy publikacja.",
    ],
    match: [
      "Codzienna praca z Claude",
      "Claude Code (mile widziane)",
      "Pisanie precyzyjnych poleceń, ocena planu AI",
    ],
  },
  {
    id: "anatomia",
    kind: "Projekt",
    label: "Anatomia 3D",
    title: "Anatomia 3D",
    body: [
      "Interaktywna aplikacja do nauki anatomii w 3D, zrobiona pod moje własne studia. Uczę się funkcjonalnie, przez ruch i skojarzenia zamiast wkuwania. Tego samego chciałem od narzędzia, więc je zbudowałem.",
      "Aplikacja ma logowanie użytkowników przez Firebase, więc musiałem zrozumieć, co dzieje się pod spodem: ekran, baza danych, uwierzytelnianie i połączenie z usługą zewnętrzną.",
      "Tak właśnie pracuję: widzę problem, który sam mam, i buduję narzędzie, które go rozwiązuje.",
    ],
    match: ["Własne projekty zrobione z pomocą AI", "Ciekawość, jak działa aplikacja „pod spodem”"],
    links: [{ label: "Otwórz Anatomię 3D", url: "https://damianlapczynski.github.io/Anatomia/" }],
  },
  {
    id: "jarvis",
    kind: "Projekt",
    label: "JARVIS",
    title: "JARVIS: osobisty asystent",
    body: [
      "Szkielet osobistego asystenta w Pythonie, w stylu eleganckiego kamerdynera. Ma kanały (terminal, głos, bot na Telegramie, dashboard), rejestr narzędzi z pluginami i miejsce na integrację z Google.",
      "Najważniejsze jest bezpieczeństwo zapisane w kodzie, a nie w prompcie. Każde narzędzie ma poziom uprawnień: odczyt, zapis odwracalny albo zapis wymagający potwierdzenia. Domyślnie działa tryb próbny (dry-run), a zmiany da się cofnąć.",
      "To dokładnie zasada z Waszej oferty: AI nie wierzy się na słowo, a każdą zmianę da się wycofać. Projekt ma testy (pytest) i komendę „jarvis doctor”, która sprawdza konfigurację.",
    ],
    match: [
      "Własne projekty zrobione z pomocą AI",
      "Zmiany da się cofnąć",
      "Integracje przez API (mile widziane)",
    ],
    links: [{ label: "Repozytorium na GitHubie", url: "https://github.com/DamianLapczynski/JARVIS" }],
  },
  {
    id: "priorytet",
    kind: "Projekt",
    label: "Moje sprawy",
    title: "Moje sprawy (Priorytet)",
    body: [
      "Aplikacja webowa do porządkowania spraw i priorytetów. Instaluje się na telefonie jak natywna aplikacja: ikona na ekranie głównym, tryb pełnoekranowy.",
      "Powstała, bo potrzebowałem jednego miejsca, w którym od razu widać, co jest najważniejsze. Mniej kliknięć i szybsza decyzja: tego samego szukacie w procesach firmy.",
    ],
    match: ["Własne projekty zrobione z pomocą AI", "Upraszczanie ludziom pracy, mniej kliknięć"],
    links: [{ label: "Otwórz aplikację", url: "https://damianlapczynski.github.io/Priorytet/" }],
  },
  {
    id: "whiteboard",
    kind: "Sposób myślenia",
    label: "Tablica procesów",
    title: "Jak patrzę na procesy",
    body: [
      "Każde usprawnienie zaczynam tak samo: rozmawiam z osobą, która ma problem, i dopytuję, o co naprawdę chodzi. Potem mierzę, jak jest teraz, robię najmniejszą zmianę, która coś daje, testuję ją i publikuję z wpisem w changelogu.",
      "Mam za sobą ekonomię i rachunkowość, więc proces czytam też przez pieniądze: ile kosztuje czas ludzi, gdzie ucieka konwersja, co przyspieszy odzyskanie należności.",
    ],
    match: [
      "Biznesowe spojrzenie na procesy",
      "Przyjmowanie zgłoszeń od działów i dopytywanie",
      "Najpierw sprawdzamy, potem zmieniamy",
    ],
  },
  {
    id: "books",
    kind: "Doświadczenie",
    label: "Ekonomia i sprzedaż",
    title: "Ekonomia, rachunkowość, sprzedaż",
    body: [
      "Zanim trafiłem na fizjoterapię, studiowałem ekonomię i rachunkowość i pracowałem w sprzedaży. Rozumiem język firmy, która zarządza należnościami: płynność, koszt obsługi sprawy, terminy.",
      "Sprzedaż nauczyła mnie, że każdy zbędny krok w procesie to utracony klient. Automatyzacja ma sens wtedy, gdy przekłada się na wynik, a nie wtedy, gdy jest efektowna.",
    ],
    match: ["Biznesowe spojrzenie na procesy", "Sprzedaż i konwersja (mile widziane)"],
  },
  {
    id: "magnifier",
    kind: "Cecha",
    label: "Dokładność",
    title: "Najpierw badanie, potem terapia",
    body: [
      "Fizjoterapia nauczyła mnie zasady, którą macie w ofercie: najpierw sprawdzamy, potem zmieniamy. Nie zaczyna się terapii bez badania i nie kończy jej bez ponownego testu.",
      "Tak samo traktuję wynik AI. Czytam plan, sprawdzam go w kodzie, danych albo logach i dopiero wtedy akceptuję. AI jest szybkie, ale odpowiedzialność za wynik jest moja.",
    ],
    match: ["Dokładność i sprawdzanie wyników zamiast wierzenia AI na słowo", "Szukanie przyczyn błędów, testy przed publikacją"],
  },
  {
    id: "swim",
    kind: "O mnie",
    label: "Trener pływania",
    title: "Tłumaczę trudne rzeczy prosto",
    body: [
      "Prowadzę zajęcia pływania. Codziennie tłumaczę złożoną technikę ludziom, którzy nie mają o niej pojęcia, i to tak, żeby od razu mogli ją wykonać.",
      "To ta sama umiejętność, której potrzeba w rozmowie z działem zgłaszającym problem albo przy ogłaszaniu zmian w aplikacji: bez żargonu, konkretnie i cierpliwie.",
    ],
    match: [
      "Łatwość w rozmowie z osobami nietechnicznymi",
      "Ogłaszanie zmian użytkownikom prostym językiem",
      "Bezpośredni kontakt z ludźmi",
    ],
  },
  {
    id: "globe",
    kind: "Cecha",
    label: "Języki",
    title: "Nowości w AI czytam u źródła",
    body: [
      "Znam polski (C2), angielski (C1) i trochę hiszpańskiego (A1). Dzięki angielskiemu czytam dokumentację, changelogi i zapowiedzi narzędzi AI, zanim trafią do polskich artykułów.",
      "Śledzenie tego, co dzieje się w AI za granicą, i testowanie, co da się wdrożyć u siebie, to dla mnie przyjemność, a nie obowiązek.",
    ],
    match: ["Śledzenie nowości w AI", "Wdrażanie AI wcześniej niż konkurencja"],
  },
  {
    id: "poster",
    kind: "Warsztat",
    label: "Git i GitHub",
    title: "Git, GitHub i historia zmian",
    body: [
      "Moje projekty żyją na GitHubie: Anatomia, JARVIS, Priorytet i ten pokój. Każda zmiana to commit, który da się przejrzeć i cofnąć.",
      "Historia zmian jest po to, żeby po publikacji dało się odpowiedzieć na pytanie „co się zmieniło i dlaczego”, a w razie problemu szybko wrócić do działającej wersji.",
    ],
    match: ["Git i GitHub (mile widziane)", "Każda publikacja kończy się wpisem w changelogu"],
    links: [{ label: "Mój GitHub", url: "https://github.com/DamianLapczynski" }],
  },
  {
    id: "plant",
    kind: "Cecha",
    label: "Rozwój",
    title: "Rośnie, bo ktoś ją podlewa",
    body: [
      "Studiuję zaocznie, prowadzę zajęcia, a po godzinach buduję projekty. Nikt mi ich nie zadaje: uczę się, bo chcę.",
      "Ekonomia, fizjoterapia, AI: szybko wchodzę w nowe dziedziny i łączę je ze sobą. Anatomia 3D powstała właśnie na styku dwóch z nich.",
    ],
    match: ["Ambicja, samodzielność i chęć szybkiej nauki"],
  },
  {
    id: "mug",
    kind: "Szczegół",
    label: "Kawa",
    title: "Kawa bez limitu",
    body: [
      "W ofercie wypatrzyłem kawę bez limitu. Uczciwie: to nie jest główny powód, dla którego aplikuję. Ale nie jest też bez znaczenia.",
      "Drobiazg, ale coś o mnie mówi: czytam rzeczy do końca, łącznie z benefitami.",
    ],
    match: [],
  },
  {
    id: "phone",
    kind: "Kontakt",
    label: "Kontakt",
    title: "Porozmawiajmy",
    body: [
      "Chętnie opowiem o projektach na żywo i pokażę, jak pracuję z Claude Code na prawdziwym przykładzie z Waszej firmy.",
    ],
    match: [],
    // UZUPEŁNIJ: wpisz swój adres e-mail
    links: [
      { label: "Napisz e-mail", url: "mailto:twoj.email@example.com" },
      { label: "GitHub", url: "https://github.com/DamianLapczynski" },
    ],
  },
];
