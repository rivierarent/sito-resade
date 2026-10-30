# Residenza Adelaide – sito (versione moderna / giovane)

Sorgenti statiche della versione "Moderna / giovane" (blu e bianco, con offerte e Speciale Mondiali),
importate il 30/10/2026 dall'anteprima pubblicata su https://resade-anteprima.vercel.app/ (dominio finale: https://www.resade.it/).

- `index.html` – home (testi IT/EN/DE gestiti da `assets/js/i18n.js`, lingua via `?lang=en|de`)
- `privacy.html` – informativa privacy
- `assets/css/style.css` – stili
- `assets/js/config.js` – dati configurabili (contatti, appartamenti, offerte, link booking)
- `assets/js/main.js` – logica della pagina
- `assets/img/logo.svg`, `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml`

Immagini mancanti: le seguenti foto sono referenziate nel codice ma non presenti nemmeno sull'anteprima online (404),
vanno aggiunte in `assets/img/`:
`hero.jpg`, `monolocale.jpg`, `mansarda.jpg`, `bilocale.jpg`, `trilocale.jpg`, `bike.jpg`, `spiaggia.jpg`,
`finalborgo.jpg`, `varigotti.jpg`, `outdoor.jpg`, `og-cover.jpg` (anteprima social).
