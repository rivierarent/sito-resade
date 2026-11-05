#!/usr/bin/env node
/*
 * Genera liguria-news/index.html dal template tools/liguria-news.src.html.
 *
 *   node tools/prerender-news.js
 *
 * La pagina costruisce i contenuti con JavaScript: qui la apriamo in un
 * browser (Playwright/Chromium), aspettiamo che sia pronta e salviamo l'HTML
 * risultante. Così eventi, luoghi e ristoranti sono già nel file e li leggono
 * anche Google e gli assistenti AI che non eseguono JavaScript. Lo script
 * della pagina resta incluso e, nel browser del visitatore, ridisegna tutto
 * con i dati aggiornati (eventi del giorno, lingua scelta, ecc.).
 *
 * Modifica sempre il template, poi rilancia questo script.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(__dirname, "liguria-news.src.html");
const OUT = path.join(ROOT, "liguria-news", "index.html");
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = url === "/liguria-news/" ? SRC : path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: "it-IT", viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${port}/liguria-news/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const html = await page.evaluate(() => "<!doctype html>\n" + document.documentElement.outerHTML);
  fs.writeFileSync(OUT, html + "\n");
  const chars = await page.evaluate(() => document.body.innerText.length);
  await browser.close();
  server.close();
  if (errors.length) { console.error("Errori nella pagina:", errors); process.exit(1); }
  console.log(`liguria-news/index.html scritto (${Math.round(html.length / 1024)} KB, ${chars} caratteri di testo)`);
});
