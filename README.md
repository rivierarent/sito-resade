# Residenza Adelaide – sito (versione moderna / giovane)

Sorgenti statiche della versione "Moderna / giovane" (blu e bianco, con offerte e Speciale Mondiali),
importate il 30/10/2026 dall'anteprima pubblicata su https://resade-anteprima.vercel.app/ (dominio finale: https://www.resade.it/).

- `index.html` – home (testi IT/EN/DE gestiti da `assets/js/i18n.js`, lingua via `?lang=en|de`)
- `privacy.html` – informativa privacy
- `liguria-news/` – pagina "Liguria News" (guida a eventi, cosa fare e dove mangiare in Liguria e Costa Azzurra), con le sue foto in `liguria-news/foto/`
- `assets/css/style.css` – stili
- `assets/js/config.js` – dati configurabili (contatti, appartamenti, offerte, link booking)
- `assets/js/main.js` – logica della pagina
- `assets/img/logo.svg`, `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml`

Foto in `assets/img/` riprese dal sito WordPress precedente (resade.it/wp-content/uploads), ridimensionate per il web.

## Lingue, SEO e assistenti AI

- `index.html` (italiano) è l'unico sorgente della home. Le versioni `en/index.html` e `de/index.html` **si generano**, non si modificano a mano:

  ```bash
  python3 tools/build.py
  ```

  Lo script scrive i testi di `assets/js/i18n.js` direttamente nell'HTML (così Google e gli assistenti AI li leggono senza JavaScript) e rigenera il JSON-LD schema.org (struttura, appartamenti, FAQ) in tutte e tre le pagine. Va rilanciato dopo ogni modifica a `index.html`, `i18n.js` o `config.js`.
- `liguria-news/index.html` si genera dal template `tools/liguria-news.src.html`: modificare il template e lanciare `node tools/prerender-news.js` (serve Playwright).
- `robots.txt` ammette esplicitamente i crawler AI; `llms.txt` riassume i dati chiave per gli assistenti AI; `sitemap.xml` elenca le pagine con le alternative di lingua.
- `vercel.json`: rimandi 301 dai vecchi indirizzi WordPress e da `?lang=` alle nuove pagine; `404.html` è la pagina per gli indirizzi inesistenti.
