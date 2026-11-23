/* =====================================================================
   TREŚCI POKOJU — tu edytujesz teksty, linki i dopasowanie do oferty.
   Każdy wpis odpowiada jednemu przedmiotowi w scenie 3D (po `id`,
   w Blenderze obiekt `item_<id>`). Kolejność = kolejność „Następny →”.

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

const PAGES = "https://damianlapczynski.github.io";
const EMAIL = "damianlapczynski01@gmail.com";
const PHONE = "604 995 915";

export const ITEMS = [
  {
    id: "chair",
    kind: "O mnie",
    label: "Kim jestem",
    title: "Cześć, jestem Damian",
    body: [
      "Studiuję fizjoterapię na DSW we Wrocławiu, prowadzę zajęcia pływania, a po godzinach buduję narzędzia z Claude Code. Za mną technikum informatyczne, ekonomia i rachunkowość oraz doświadczenie w sprzedaży, sporcie i edukacji.",
      "Ten pokój to moje portfolio. Każdy przedmiot to projekt albo cecha, która przyda się na stanowisku specjalisty ds. automatyzacji procesów i AI.",
      "Nie mam komercyjnego stażu w IT i nie będę udawał, że mam. Mam za to narzędzia, które zbudowałem sam i z których ludzie (w tym ja) korzystają codziennie. Rozejrzyj się.",
    ],
    match: ["Ambicja, samodzielność i chęć szybkiej nauki", "Doświadczenie komercyjne nie jest wymagane"],
  },
  {
    id: "monitor",
    kind: "Stanowisko",
    label: "Komputer",
    title: "Claude Code to moje codzienne narzędzie",
    body: [
      "Przy tym biurku powstaje wszystko, co tu widzisz. Claude i Claude Code to moje codzienne narzędzia: aplikacje webowe, skrypty w Pythonie, automatyzacje kalendarza i poczty, generowanie materiałów do nauki.",
      "Ten pokój też: każdy model zbudowałem skryptem w Blenderze (Python), a scenę w przeglądarce w Three.js. Całość jest wersjonowana w Git i opublikowana na GitHub Pages.",
      "Pracuję tak: precyzyjne polecenie, ocena planu, który zaproponuje AI, potem sprawdzenie wyniku na żywo. Dopiero wtedy publikacja.",
    ],
    match: ["Codzienna praca z Claude", "Claude Code (mile widziane)", "Pisanie precyzyjnych poleceń, ocena planu AI"],
  },
  {
    id: "inkaso",
    kind: "Demo dla Was",
    label: "Inkaso w pigułce",
    title: "Inkaso w pigułce: demo pod Waszą branżę",
    body: [
      "Zrobiłem małą aplikację, żeby pokazać, jak podszedłbym do typowego procesu w firmie windykacyjnej: wczytujesz wyciąg z banku, system dopasowuje wpłaty do spraw, człowiek weryfikuje wątpliwe przypadki, a zalegający dostają przypomnienie w tonie dopasowanym do opóźnienia.",
      "Automat księguje tylko to, co pewne (numer sprawy w tytule przelewu). Wpłata częściowa albo przelew bez numeru trafia do weryfikacji, a każdą decyzję, także automatyczną, da się cofnąć. Przypomnienia proszą o numer sprawy w tytule, żeby następnym razem dopasowanie zadziałało samo.",
      "Pod spodem: React i TypeScript, baza SQLite w przeglądarce z regułami dopasowania w SQL-u, 13 testów automatycznych, podgląd zdarzenia webhooka do CRM. Dane są fikcyjne, a jak naprawdę wygląda Wasz proces, chciałbym usłyszeć od ludzi, którzy go robią.",
    ],
    match: [
      "Szukanie luk w procesach i ich automatyzacja",
      "Biznesowe spojrzenie: szybsze odzyskanie należności",
      "Podstawy SQL (mile widziane)",
      "TypeScript / React (mile widziane)",
      "Webhooki (mile widziane)",
      "Zmiany da się cofnąć",
    ],
    links: [
      { label: "Otwórz demo", url: "inkaso/" },
      { label: "Kod źródłowy", url: "https://github.com/DamianLapczynski/portfolio/tree/main/projects/inkaso" },
    ],
  },
  {
    id: "anatomia",
    kind: "Projekt",
    label: "Anatomia 3D",
    title: "Anatomia 3D: atlas do nauki fizjoterapii",
    body: [
      "Interaktywny atlas anatomii 3D, który zbudowałem pod własne studia. Działa w przeglądarce na telefonie, iPadzie i komputerze, także offline. Ma 3300 struktur z polskimi i łacińskimi nazwami, bazę 180 mięśni (przyczepy, unerwienie, test siły), 17 stawów z 41 testami klinicznymi, 49 schorzeń z wizualizacją 3D i symulator uszkodzenia nerwu lub korzenia C5–S1.",
      "Pod spodem: logowanie kontem Google i synchronizacja postępu w bazie Firestore między urządzeniami, fiszki z algorytmem powtórek SM-2, tryb offline. Modele 3D przetwarzam własnym potokiem: Blender (Python), uproszczenie i kompresja siatek, wypalanie cieni.",
      "Każda publikacja przechodzi przez GitHub Actions. Skrypt walidacji sprawdza spójność bazy wiedzy z modelem i zatrzymuje wdrożenie, jeśli coś się nie zgadza.",
    ],
    match: [
      "Własne projekty zrobione z pomocą AI",
      "Ciekawość, jak działa aplikacja „pod spodem”: ekran, baza danych, połączenia",
      "Dokładność: testy przed publikacją",
      "Git i GitHub (mile widziane)",
    ],
    links: [{ label: "Otwórz Anatomię 3D", url: `${PAGES}/Anatomia/` }],
  },
  {
    id: "dashboard",
    kind: "Projekt",
    label: "Centrum Dowodzenia",
    title: "Centrum Dowodzenia (Desktop HQ)",
    body: [
      "Osobisty pulpit, który zbiera w jednym miejscu to, co zwykle jest rozrzucone po kilku aplikacjach: plan dnia z kalendarza, zadania, pocztę od ludzi, aktywne projekty i notatki z mojej bazy wiedzy w Obsidianie.",
      "Notatki widać jako „galaktykę” powiązań, a osobny moduł ocenia porządek w bazie. Całość obsługuje się z klawiatury, bez szukania po menu.",
      "Publiczne demo działa na fikcyjnych danych, bo prawdziwa wersja czyta mój kalendarz i pocztę.",
    ],
    match: [
      "Upraszczanie ludziom pracy, mniej kliknięć",
      "Połączenia aplikacji z innymi systemami",
      "Własne projekty zrobione z pomocą AI",
    ],
    links: [{ label: "Otwórz demo", url: `${PAGES}/desktop-hq-demo/` }],
  },
  {
    id: "automations",
    kind: "Automatyzacja",
    label: "Automatyzacje",
    title: "Automatyzacje, które działają beze mnie",
    body: [
      "Ten kalendarz to symbol zadań, które co dzień albo co tydzień same wykonują pracę, którą wcześniej robiłem ręcznie. Działają na Claude według harmonogramu i łączą się z Google Calendar, Gmailem i moją bazą notatek.",
      "Synchronizacja planu zajęć: odczytuje harmonogram uczelni, porównuje go z kalendarzem po unikalnym kluczu, dodaje, zmienia i usuwa zajęcia, a e-mail wysyła tylko wtedy, gdy coś się zmieniło. Ma bezpiecznik: jeśli plan wczyta się niekompletnie, niczego nie kasuje.",
      "Kalendarz → zadania: codziennie przenosi terminy do macierzy Eisenhowera w Obsidianie, a raz w miesiącu przebudowuje ją od zera. Przepływ jest jednokierunkowy, żeby automat nigdy nie nadpisał kalendarza. Do tego cotygodniowy raport godzin pracy z projekcją na koniec miesiąca.",
    ],
    match: [
      "Szukanie luk w procesach i ich automatyzacja",
      "Doświadczenie w automatyzacji procesów (mile widziane)",
      "Integracje z innymi systemami (Google, poczta)",
      "Najpierw sprawdzamy, potem zmieniamy",
    ],
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
    match: ["Własne projekty zrobione z pomocą AI", "Zmiany da się cofnąć", "Integracje przez API (mile widziane)"],
    links: [{ label: "Repozytorium na GitHubie", url: "https://github.com/DamianLapczynski/JARVIS" }],
  },
  {
    id: "priorytet",
    kind: "Projekt",
    label: "Moje sprawy",
    title: "Moje sprawy: aplikacja dla mojej dziewczyny",
    body: [
      "Aplikacja do ogarniania codziennego życia, którą zrobiłem dla mojej dziewczyny. Instaluje się na iPhonie jak natywna aplikacja (ikona na ekranie głównym, pełny ekran) i ma styl zrobiony pod nią: aksamitny fiolet, złote gwiazdy, motyle.",
      "To projekt z prawdziwą użytkowniczką, która na co dzień mówi mi, co działa, a co nie. Dobra szkoła tego, co opisujecie w ofercie: dopytać, o co naprawdę chodzi, i dopasować narzędzie do człowieka, a nie odwrotnie.",
    ],
    match: ["Własne projekty zrobione z pomocą AI", "Bezpośredni kontakt z ludźmi, którzy korzystają z aplikacji"],
    links: [{ label: "Otwórz aplikację", url: `${PAGES}/Priorytet/` }],
  },
  {
    id: "recorder",
    kind: "Projekt",
    label: "Rejestrator wykładów",
    title: "Rejestrator wykładów",
    body: [
      "System na moim komputerze, który zamienia nagranie wykładu w materiał do nauki: transkrypcję, konspekt, fiszki i raport. Skrypty w Pythonie i PowerShellu uruchamiają się automatycznie po zajęciach, a gotowe pliki trafiają do iCloud, więc uczę się z nich na iPadzie.",
      "To automatyzacja procesu, który zna każdy student: półtorej godziny nagrania, do którego nikt potem nie wraca. Teraz z każdego wykładu zostaje konkret, a ja nie muszę nic robić ręcznie.",
    ],
    match: ["Szukanie luk w procesach i ich automatyzacja", "Własne projekty zrobione z pomocą AI"],
  },
  {
    id: "instagram",
    kind: "Projekt",
    label: "@fizjio_anatomia",
    title: "@fizjio_anatomia: posty generowane z bazy",
    body: [
      "Hobbystyczne konto, na którym uczę się tworzenia treści i przy okazji powtarzam anatomię. Na razie 18 postów i 50 obserwujących, więc to nauka, a nie zasięgi.",
      "Ciekawsze jest to, jak posty powstają. Rolki i karuzele generuje skrypt prosto z bazy Anatomii 3D: renderuje mięsień w przeglądarce (Playwright), składa film (ffmpeg) i przygotowuje opis posta. Plan publikacji na 180 dni jest w pliku, a jedna komenda przygotowuje materiały na cały tydzień.",
    ],
    match: ["Szukanie, co da się zautomatyzować", "Własne projekty zrobione z pomocą AI"],
    links: [{ label: "Instagram", url: "https://www.instagram.com/fizjio_anatomia/" }],
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
    match: ["Biznesowe spojrzenie na procesy", "Przyjmowanie zgłoszeń od działów i dopytywanie", "Najpierw sprawdzamy, potem zmieniamy"],
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
    match: ["Łatwość w rozmowie z osobami nietechnicznymi", "Ogłaszanie zmian użytkownikom prostym językiem", "Bezpośredni kontakt z ludźmi"],
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
      "Moje projekty żyją na GitHubie: Anatomia 3D, Centrum Dowodzenia, JARVIS, Moje sprawy i ten pokój. Publikuję je przez GitHub Pages, a w Anatomii każde wdrożenie przechodzi przez GitHub Actions z walidacją danych.",
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
      "Informatyka, ekonomia, fizjoterapia, AI: szybko wchodzę w nowe dziedziny i łączę je ze sobą. Anatomia 3D powstała właśnie na styku dwóch z nich.",
    ],
    match: ["Ambicja, samodzielność i chęć szybkiej nauki"],
  },
  {
    id: "phone",
    kind: "Kontakt",
    label: "Kontakt",
    title: "Porozmawiajmy",
    body: [
      "Chętnie opowiem o projektach na żywo i pokażę, jak pracuję z Claude Code na prawdziwym przykładzie z Waszej firmy.",
      `Telefon: ${PHONE} · E-mail: ${EMAIL}`,
    ],
    match: [],
    links: [
      { label: "Zadzwoń", url: `tel:+48${PHONE.replace(/\s/g, "")}` },
      { label: "Napisz e-mail", url: `mailto:${EMAIL}` },
      { label: "GitHub", url: "https://github.com/DamianLapczynski" },
    ],
  },
];

/* =====================================================================
   SZYBKI PRZEGLĄD (wersja bez 3D, do druku / PDF)
   Link bezpośredni: …/portfolio/?szybko
   ===================================================================== */
export const QUICK = {
  contact: { phone: PHONE, email: EMAIL, github: "https://github.com/DamianLapczynski" },
  summary:
    "Student fizjoterapii (DSW Wrocław) i trener pływania, z technikum informatycznym, ekonomią i rachunkowością za sobą. Na co dzień buduję z Claude Code aplikacje i automatyzacje, których sam używam: atlas anatomii 3D z bazą danych i logowaniem, osobisty pulpit, zadania synchronizujące kalendarz i pocztę. Bez komercyjnego stażu w IT, z projektami, które działają i można je kliknąć.",
  fit: [
    ["Własne projekty zrobione z pomocą AI", "Anatomia 3D, Centrum Dowodzenia, Inkaso w pigułce, JARVIS, Moje sprawy, ten pokój 3D: wszystkie z linkami."],
    ["Codzienna praca z Claude / Claude Code", "Każdy projekt powyżej powstał z Claude Code; automatyzacje działają na Claude według harmonogramu."],
    ["Biznesowe spojrzenie na procesy", "Ekonomia, rachunkowość i sprzedaż. Demo inkaso pokazuje, gdzie w obsłudze wpłat ucieka czas i jak to skrócić."],
    ["Ciekawość, jak działa aplikacja „pod spodem”", "Firestore, logowanie Google, tryb offline i potok modeli 3D w Anatomii; SQLite i reguły SQL w demo inkaso."],
    ["Dokładność, sprawdzanie wyników AI", "Walidacja danych w GitHub Actions przed publikacją, 13 testów w demo, w JARVIS-ie tryb próbny i cofanie zmian."],
    ["Łatwość w rozmowie z osobami nietechnicznymi", "Uczę pływania: codziennie tłumaczę trudną technikę prostym językiem."],
    ["Mile widziane: SQL, TypeScript/React, Git, API, webhooki, automatyzacja", "Demo inkaso (SQL, TS, React, podgląd webhooka), GitHub i GitHub Actions, integracje z Google Calendar i Gmailem."],
  ],
  about: [
    ["Studia", "Fizjoterapia, Uniwersytet DSW, Wrocław (niestacjonarne)"],
    ["Wcześniej", "Technikum informatyczne; ekonomia i rachunkowość"],
    ["Praca", "Instruktor i trener pływania; doświadczenie w sprzedaży i edukacji"],
    ["Narzędzia", "Claude Code, Python, JavaScript/TypeScript, React, SQL (SQLite), Firebase, Git/GitHub, Blender, Excel/Sheets"],
    ["Języki", "polski C2, angielski C1, hiszpański A1"],
  ],
  projects: ["inkaso", "anatomia", "dashboard", "automations", "jarvis", "priorytet", "recorder", "instagram"],
};
