# Pokój Damiana: portfolio 3D

Interaktywne portfolio w formie pokoju ze stanowiskiem komputerowym. Każdy przedmiot to projekt albo cecha.
Po kliknięciu pojawia się opis i wymagania z oferty
(**Specjalista ds. automatyzacji procesów i AI, Hadyński Inkaso**), które dany przedmiot pokazuje.
Część przedmiotów prowadzi do projektów na GitHub Pages.

![Podgląd z Blendera](blender/preview.png)

## Jak to jest zbudowane

| Warstwa | Plik | Co robi |
|---|---|---|
| Modele i otoczenie | `blender/build_room.py` | Cała scena w Blenderze, z kodu (bpy). Eksport do `assets/models/room.glb` |
| Treści | `assets/js/content.js` | Teksty, linki i dopasowanie do oferty, **tu edytujesz opisy** |
| Scena w przeglądarce | `assets/js/app.js` | Three.js: wczytuje GLB, nocne światło (monitor, LED-y), bloom, jedna kamera, klikanie |
| Interfejs | `index.html`, `assets/css/style.css` | Ekran powitalny, panel z opisem, spis rzeczy |
| Biblioteki | `assets/vendor/` | Three.js r160 (lokalnie, bez CDN) |

### Przedmioty i ich `id`

`monitor`, `chair`, `anatomia` (link), `jarvis` (link), `priorytet` (link), `whiteboard`, `books`,
`magnifier`, `swim`, `globe`, `poster` (link), `plant`, `mug`, `phone` (kontakt).

## Zmiana tekstów i linków

Edytuj `assets/js/content.js` (pole `links` dla przycisków). Teksty na ekranie monitora, tablicy,
plakacie i grzbietach książek są rysowane w `assets/js/app.js` (obiekt `TEX`).

## Zmiana modeli (Blender)

```bash
pip install bpy           # albo użyj zainstalowanego Blendera
python blender/build_room.py            # eksport room.glb
python blender/build_room.py --render   # + podgląd Cycles do blender/preview.png
```

Z pełnym Blenderem: `blender -b -P blender/build_room.py -- --render`.
Nazwy obiektów `item_<id>` łączą model z opisem w `content.js`.

## Podgląd lokalny

Moduły ES nie działają z `file://`, więc potrzebny jest mały serwer:

```bash
python3 -m http.server 8000
```

Potem otwórz http://localhost:8000.

## Do uzupełnienia

- `content.js` → `phone`: Twój adres e-mail (teraz jest zaślepka).
- Linki do GitHub Pages (`Anatomia`, `Priorytet`) zakładają adres `damianlapczynski.github.io/<repo>/`. Sprawdź, czy działają.

## Publikacja (GitHub Pages)

Settings → Pages → Deploy from a branch → `main` / `(root)`.
Strona będzie pod `https://damianlapczynski.github.io/portfolio/`.
