# icons/

Folder je predviđen za favicon i ikone aplikacije.

Očekivana imena:

- `favicon.ico`
- `favicon-32.png`, `favicon-16.png`
- `apple-touch-icon.png` (180×180)
- `site.webmanifest`

Kad ih dodaš, poveži ih u `<head>` dokumenta `index.html`.

Sitne ikone u korisničkom interfejsu (volan, knjiga, zvučnik, kamera)
namerno su ostavljene kao inline SVG u HTML-u — nasleđuju boju teksta
preko `currentColor`, pa se same prilagođavaju temi. Kao zasebni fajlovi
to ne bi radilo.
