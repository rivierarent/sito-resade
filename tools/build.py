#!/usr/bin/env python3
"""
Genera le versioni in lingua e i dati strutturati del sito.

  python3 tools/build.py

- index.html (italiano) è il sorgente: si modifica solo quello.
- Crea en/index.html e de/index.html con i testi di assets/js/i18n.js già
  scritti nell'HTML, così Google e gli assistenti AI (ChatGPT, Perplexity,
  Claude, Gemini...) leggono ogni lingua senza eseguire JavaScript.
- Riscrive in tutte e tre le pagine il JSON-LD (schema.org): struttura
  ricettiva, appartamenti, FAQ, sito web.

Richiede: python3 con beautifulsoup4, node (per leggere i18n.js).
"""
import json
import os
import re
import subprocess
import sys

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.resade.it"

LANGS = {
    "it": {
        "path": "/",
        "locale": "it_IT",
        "title": "Residenza Adelaide – Appartamenti a Finale Ligure | Prenota diretto -10%",
        "description": "Residenza Adelaide: 27 appartamenti a Finale Ligure, a 5 minuti a piedi dal mare. Bike garage, noleggio e-bike e parcheggio. Prenota sul sito ufficiale e paghi il 10% in meno.",
        "og_title": "Residenza Adelaide – Finale Ligure | -10% prenotando diretto",
        "og_description": "Appartamenti a 5 minuti dal mare, bike garage e noleggio e-bike. Prenota sul sito ufficiale e risparmia il 10%.",
        "ld_description": "Residenza Adelaide è una struttura con 27 appartamenti vacanza nel centro di Finale Ligure (Liguria), a 400 metri dal mare. Monolocali, mansarde, bilocali e trilocali da 2 a 6 persone con cucina, aria condizionata e Wi-Fi; bike garage videosorvegliato, officina e noleggio bici ed e-bike. Prenotando sul sito ufficiale si paga il 10% in meno.",
        "skip_label": "Vai al contenuto",
    },
    "en": {
        "path": "/en/",
        "locale": "en_GB",
        "title": "Residenza Adelaide – Holiday Apartments in Finale Ligure | Book direct -10%",
        "description": "Residenza Adelaide: 27 holiday apartments in Finale Ligure, a 5-minute walk from the beach. Bike garage, e-bike rental and parking. Book on the official website and pay 10% less.",
        "og_title": "Residenza Adelaide – Finale Ligure | -10% when you book direct",
        "og_description": "Apartments 5 minutes from the sea, bike garage and e-bike rental. Book on the official website and save 10%.",
        "ld_description": "Residenza Adelaide has 27 holiday apartments in the centre of Finale Ligure (Liguria, Italy), 400 metres from the sea. Studios, attics, one- and two-bedroom apartments for 2 to 6 guests with kitchen, air conditioning and Wi-Fi; CCTV bike garage, workshop and bike and e-bike rental. Booking on the official website costs 10% less.",
    },
    "de": {
        "path": "/de/",
        "locale": "de_DE",
        "title": "Residenza Adelaide – Ferienwohnungen in Finale Ligure | Direkt buchen -10%",
        "description": "Residenza Adelaide: 27 Ferienwohnungen in Finale Ligure, 5 Gehminuten vom Strand. Bike-Garage, E-Bike-Verleih und Parkplatz. Auf der offiziellen Website buchen und 10% weniger zahlen.",
        "og_title": "Residenza Adelaide – Finale Ligure | -10% bei Direktbuchung",
        "og_description": "Apartments 5 Minuten vom Meer, Bike-Garage und E-Bike-Verleih. Auf der offiziellen Website buchen und 10% sparen.",
        "ld_description": "Die Residenza Adelaide bietet 27 Ferienwohnungen im Zentrum von Finale Ligure (Ligurien, Italien), 400 Meter vom Meer. Studios, Dachstudios, Zwei- und Dreizimmer-Apartments für 2 bis 6 Personen mit Küche, Klimaanlage und WLAN; videoüberwachte Bike-Garage, Werkstatt sowie Fahrrad- und E-Bike-Verleih. Bei Buchung auf der offiziellen Website zahlt man 10% weniger.",
    },
}

APARTMENTS = [
    # (chiave i18n del nome, immagine, ospiti min, max, camere)
    ("apt.studio", "monolocale.jpg", 2, 4, 1),
    ("apt.attic", "mansarda.jpg", 2, 4, 1),
    ("apt.two", "bilocale.jpg", 2, 4, 2),
    ("apt.three", "trilocale.jpg", 4, 6, 3),
]
APT_NAMES = {
    "it": ["Monolocale", "Mansarda con terrazzino", "Bilocale", "Trilocale"],
    "en": ["Studio apartment", "Attic with terrace", "One-bedroom apartment", "Two-bedroom apartment"],
    "de": ["Studio", "Dachstudio mit Terrasse", "Zweizimmer-Apartment", "Dreizimmer-Apartment"],
}
AMENITIES = {
    "it": ["Wi-Fi gratuito", "Aria condizionata", "Cucina in ogni appartamento", "Ascensore", "Accessibile",
           "Bike garage videosorvegliato", "Officina bici", "Noleggio bici ed e-bike", "Parcheggio"],
    "en": ["Free Wi-Fi", "Air conditioning", "Kitchen in every apartment", "Lift", "Accessible",
           "CCTV bike garage", "Bike workshop", "Bike and e-bike rental", "Parking"],
    "de": ["Gratis WLAN", "Klimaanlage", "Küche in jedem Apartment", "Aufzug", "Barrierefrei",
           "Videoüberwachte Bike-Garage", "Fahrradwerkstatt", "Fahrrad- und E-Bike-Verleih", "Parkplatz"],
}


def load_i18n():
    js = ("global.window={};require(%s);process.stdout.write(JSON.stringify(window.RESADE_I18N))"
          % json.dumps(os.path.join(ROOT, "assets/js/i18n.js")))
    return json.loads(subprocess.check_output(["node", "-e", js]))


def load_config():
    js = ("global.window={};require(%s);process.stdout.write(JSON.stringify(window.RESADE_CONFIG))"
          % json.dumps(os.path.join(ROOT, "assets/js/config.js")))
    return json.loads(subprocess.check_output(["node", "-e", js]))


def text(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()


def json_ld(soup, lang, cfg):
    L = LANGS[lang]
    url = SITE + L["path"]
    faq = []
    for d in soup.select("#faq details"):
        q, a = d.find("summary"), d.find("p")
        if q and a:
            faq.append({"@type": "Question", "name": text(q),
                        "acceptedAnswer": {"@type": "Answer", "text": text(a)}})
    same_as = [u for u in (cfg.get("ota") or {}).values() if u]
    same_as += [u for u in (cfg.get("social") or {}).values() if u]
    graph = [
        {
            "@type": "WebSite",
            "@id": SITE + "/#website",
            "url": SITE + "/",
            "name": "Residenza Adelaide",
            "inLanguage": ["it", "en", "de"],
            "publisher": {"@id": SITE + "/#lodging"},
        },
        {
            "@type": "LodgingBusiness",
            "@id": SITE + "/#lodging",
            "name": "Residenza Adelaide",
            "alternateName": "Resade",
            "url": url,
            "description": L["ld_description"],
            "logo": SITE + "/assets/img/logo.svg",
            "image": [SITE + "/assets/img/" + f for f in
                      ("og-cover.jpg", "hero.jpg", "monolocale.jpg", "mansarda.jpg", "bilocale.jpg", "trilocale.jpg")],
            "email": cfg.get("email"),
            "telephone": cfg.get("phoneLabel"),
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Via Domenico Brunenghi 87",
                "postalCode": "17024",
                "addressLocality": "Finale Ligure",
                "addressRegion": "SV",
                "addressCountry": "IT",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": 44.17037, "longitude": 8.33847},
            "hasMap": "https://www.google.com/maps/search/?api=1&query=Residenza+Adelaide+Via+Domenico+Brunenghi+87+Finale+Ligure",
            "sameAs": same_as,
            "numberOfRooms": 27,
            "checkinTime": "16:00",
            "priceRange": "€€",
            "currenciesAccepted": "EUR",
            "availableLanguage": ["it", "en", "de"],
            "amenityFeature": [{"@type": "LocationFeatureSpecification", "name": n, "value": True}
                               for n in AMENITIES[lang]],
            "containsPlace": [
                {
                    "@type": "Accommodation",
                    "name": APT_NAMES[lang][i],
                    "image": SITE + "/assets/img/" + img,
                    "occupancy": {"@type": "QuantitativeValue", "minValue": lo, "maxValue": hi},
                    "numberOfRooms": rooms,
                }
                for i, (_, img, lo, hi, rooms) in enumerate(APARTMENTS)
            ],
            "identifier": [{"@type": "PropertyValue", "propertyID": "CIN / CITRA", "value": cfg.get("cin")}],
        },
        {
            "@type": "WebPage",
            "@id": url + "#webpage",
            "url": url,
            "name": L["title"],
            "description": L["description"],
            "inLanguage": lang,
            "isPartOf": {"@id": SITE + "/#website"},
            "about": {"@id": SITE + "/#lodging"},
            "primaryImageOfPage": SITE + "/assets/img/og-cover.jpg",
        },
    ]
    if faq:
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "inLanguage": lang, "mainEntity": faq})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)


def set_meta(soup, lang):
    L = LANGS[lang]
    url = SITE + L["path"]
    soup.html["lang"] = lang
    soup.title.string = L["title"]
    soup.find("meta", attrs={"name": "description"})["content"] = L["description"]
    soup.find("link", rel="canonical")["href"] = url
    for prop, val in (("og:title", L["og_title"]), ("og:description", L["og_description"]),
                      ("og:url", url), ("og:locale", L["locale"])):
        soup.find("meta", property=prop)["content"] = val
    # og:locale:alternate
    for m in soup.find_all("meta", property="og:locale:alternate"):
        m.decompose()
    anchor = soup.find("meta", property="og:locale")
    for other in LANGS:
        if other != lang:
            tag = soup.new_tag("meta", property="og:locale:alternate", content=LANGS[other]["locale"])
            anchor.insert_after(tag)
            anchor.insert_after("\n  ")


ARIA = {
    "en": {"Bilocale": "One-bedroom apartment", "Chiama": "Call", "In breve": "At a glance", "Mansarda": "Attic",
           "Menu principale": "Main menu", "Monolocale": "Studio apartment", "Mountain bike a Finale Ligure": "Mountain biking in Finale Ligure",
           "Prenotazione": "Booking", "Quanti siete?": "How many guests?", "Rimuovi offerta": "Remove offer", "Trilocale": "Two-bedroom apartment"},
    "de": {"Bilocale": "Zweizimmer-Apartment", "Chiama": "Anrufen", "In breve": "Auf einen Blick", "Mansarda": "Dachstudio",
           "Menu principale": "Hauptmenü", "Monolocale": "Studio", "Mountain bike a Finale Ligure": "Mountainbiken in Finale Ligure",
           "Prenotazione": "Buchung", "Quanti siete?": "Wie viele Personen?", "Rimuovi offerta": "Angebot entfernen", "Trilocale": "Dreizimmer-Apartment"},
}


def translate(soup, lang, dic, missing):
    for el in soup.select("[aria-label]"):
        el["aria-label"] = ARIA[lang].get(el["aria-label"], el["aria-label"])
    for el in soup.select("[data-i18n]"):
        key = el["data-i18n"]
        if key in dic:
            el.clear()
            frag = BeautifulSoup(dic[key], "html.parser")
            for node in list(frag.contents):
                el.append(node)
        else:
            missing.add(key)
    for a in soup.select(".lang [data-lang]"):
        if a["data-lang"] == lang:
            a["aria-current"] = "true"
        elif a.has_attr("aria-current"):
            del a["aria-current"]
    # brand link / aria labels in the language of the page
    brand = soup.select_one(".header .brand")
    if brand and lang != "it":
        brand["href"] = LANGS[lang]["path"]


def write(soup, path):
    html = str(soup)
    if not html.lstrip().lower().startswith("<!doctype"):
        html = "<!doctype html>\n" + html
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(html)


def main():
    i18n = load_i18n()
    cfg = load_config()
    src_path = os.path.join(ROOT, "index.html")
    src = open(src_path).read()

    # Italiano: aggiorna solo il blocco JSON-LD dentro il sorgente
    soup = BeautifulSoup(src, "html.parser")
    ld = json_ld(soup, "it", cfg)
    src = re.sub(r'(<script type="application/ld\+json" id="ld-json">).*?(</script>)',
                 lambda m: m.group(1) + "\n" + ld + "\n  " + m.group(2), src, count=1, flags=re.S)
    open(src_path, "w").write(src)

    for lang in ("en", "de"):
        soup = BeautifulSoup(src, "html.parser")
        missing = set()
        translate(soup, lang, i18n[lang], missing)
        set_meta(soup, lang)
        soup.find("script", id="ld-json").string = "\n" + json_ld(soup, lang, cfg) + "\n  "
        write(soup, os.path.join(ROOT, lang, "index.html"))
        print("%s/index.html scritto%s" % (lang, ("; testi senza traduzione: " + ", ".join(sorted(missing))) if missing else ""))
    print("index.html: JSON-LD aggiornato")


if __name__ == "__main__":
    sys.exit(main())
