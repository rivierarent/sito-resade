/*
 * ============================================================
 *  CONFIGURAZIONE SITO – Residenza Adelaide (resade.it)
 *  Modifica SOLO questo file per aggiornare contatti, link di
 *  prenotazione Kross Booking, sconto diretto e OTA.
 * ============================================================
 */
window.RESADE_CONFIG = {
  name: "Residenza Adelaide",
  address: "Via Domenico Brunenghi 87, 17024 Finale Ligure (SV)",
  mapsQuery: "Residenza Adelaide, Via Brunenghi 87, Finale Ligure",

  // Contatti (verificare prima della pubblicazione)
  email: "info@resade.it",
  phone: "+3901968111",          // formato internazionale senza spazi
  phoneLabel: "+39 019 68111",
  whatsapp: "",                  // es. "393331234567" (senza + e spazi). Vuoto = nascosto

  // Codice identificativo nazionale (CIN) / CITRA – obbligatorio per legge
  cin: "IT009029B44GJT4UPZ · CITRA 009029-CAV-0009",

  /*
   * ---------------- KROSS BOOKING ----------------
   * Incolla qui l'URL del tuo Booking Engine Kross Booking
   * (Kross Booking → Impostazioni → Booking Engine → "Link al booking engine").
   * I parametri date/ospiti vengono aggiunti automaticamente usando i nomi
   * indicati in `params`: adattali se il tuo link usa nomi diversi.
   * Se `url` è vuoto il sito invia una richiesta di disponibilità via e-mail
   * (o WhatsApp) con date e ospiti già compilati: nessuna prenotazione persa.
   */
  booking: {
    url: "https://residenzaadelaide.kross.travel/", // booking engine Kross ufficiale
    params: {
      checkin: "checkin",        // formato data: dateFormat
      checkout: "checkout",
      adults: "adults",
      children: "children",
      lang: "lang",
      promo: "promo"
    },
    dateFormat: "YYYY-MM-DD",    // oppure "DD/MM/YYYY"
    promoCode: "DIRETTO10",      // codice sconto configurato su Kross Booking
    openInNewTab: false
  },

  // Sconto per prenotazione diretta (%)
  directDiscount: 10,

  // Link alle OTA (per recensioni / fiducia). Vuoto = nascosto
  ota: {
    booking: "https://www.booking.com/hotel/it/residenza-adelaide.html",
    tripadvisor: "https://www.tripadvisor.com/Hotel_Review-g194761-d1488235-Reviews-Residenza_Adelaide-Finale_Ligure_Italian_Riviera_Liguria.html"
  },

  social: {
    facebook: "",
    instagram: ""
  },

  // Orari ufficio check-in
  officeHours: "16:00 – 18:00",

  // Parcheggio gratuito (fino a esaurimento posti) fino a questa data inclusa.
  // Dopo la data il sito torna da solo a "parcheggio su prenotazione".
  // Vuoto = parcheggio gratuito non attivo.
  freeParkingUntil: "2027-06-30",

  /*
   * ---------------- OFFERTE ----------------
   * Ogni offerta compare sul sito da `showFrom` a `showUntil` (AAAA-MM-GG)
   * e sparisce da sola quando scade. Vuoto = sempre visibile.
   * `code`  : codice promo da creare anche su Kross Booking (viene passato
   *           al booking engine al posto di DIRETTO10 quando il cliente
   *           sceglie l'offerta).
   * `stay`  : date suggerite che vengono precompilate nel modulo (opzionale).
   * `featured: true` = offerta in evidenza con conto alla rovescia
   *           (`countdownTo` = inizio evento, `eventEnd` = fine evento).
   * Sconti e condizioni sono PROPOSTE: verificateli prima di pubblicare.
   */
  offers: [
    {
      id: "mondiali-enduro-2026",
      featured: true,
      code: "MONDIALI26",
      icon: "bike",
      showFrom: "2026-09-15",
      showUntil: "2026-10-18",
      countdownTo: "2026-10-15T18:00:00",
      eventEnd: "2026-10-18T23:59:00",
      stay: { checkin: "2026-10-15", checkout: "2026-10-19" },
      badge: { it: "Mondiali Enduro · 15–18 ottobre", en: "Enduro Worlds · 15–18 October", de: "Enduro-WM · 15.–18. Oktober" },
      title: { it: "Speciale Mondiali di Enduro a Finale Ligure", en: "Enduro World Championships special in Finale Ligure", de: "Enduro-WM-Special in Finale Ligure" },
      text: {
        it: "I Campionati del Mondo UCI di Mountain Bike Enduro ed E-Enduro arrivano a Finale. Dormi in centro, a due passi da cerimonia, sfilata delle squadre ed eventi in città.",
        en: "The UCI Mountain Bike Enduro and E-Enduro World Championships come to Finale. Stay in the centre, steps from the opening ceremony, team parade and events in town.",
        de: "Die UCI Mountainbike Enduro- und E-Enduro-Weltmeisterschaften kommen nach Finale. Wohnen Sie im Zentrum, nur Schritte von Eröffnung, Teamparade und Events entfernt."
      },
      perks: {
        it: ["Circa il 10% in meno che sui portali", "Parcheggio gratis (fino a esaurimento posti)", "Bike garage sorvegliato e officina gratis", "E-bike a noleggio per seguire le gare"],
        en: ["About 10% less than on booking sites", "Free parking (while spaces last)", "Free supervised bike garage and workshop", "E-bike rental to follow the races"],
        de: ["Ca. 10% günstiger als auf Buchungsportalen", "Gratis Parkplatz (solange verfügbar)", "Gratis überwachte Bike-Garage und Werkstatt", "E-Bike-Verleih, um die Rennen zu verfolgen"]
      },
      // Pacchetti (stessi del volantino e di Instagram). Prezzi dalle tariffe Kross del 10/10.
      packages: [
        { type: "monolocale", stay: { checkin: "2026-10-16", checkout: "2026-10-18" }, price: "€ 152",
          name: { it: "Weekend Mondiali", en: "Worlds Weekend", de: "WM-Wochenende" },
          when: { it: "16–18 ott · 2 notti", en: "16–18 Oct · 2 nights", de: "16.–18. Okt · 2 Nächte" },
          desc: { it: "Monolocale per 2 persone", en: "Studio for 2 people", de: "Studio für 2 Personen" },
          note: { it: "Su Booking € 169", en: "On Booking €169", de: "Auf Booking 169 €" } },
        { type: "mansarda", stay: { checkin: "2026-10-15", checkout: "2026-10-18" }, price: "€ 271",
          name: { it: "Rider Pack", en: "Rider Pack", de: "Rider Pack" },
          when: { it: "15–18 ott · 3 notti", en: "15–18 Oct · 3 nights", de: "15.–18. Okt · 3 Nächte" },
          desc: { it: "Mansarda con terrazzino + 1 giorno di e-bike", en: "Attic with terrace + 1 e-bike day", de: "Dachstudio mit Terrasse + 1 E-Bike-Tag" },
          note: { it: "Tutti i giorni dell'evento", en: "All event days", de: "Alle Eventtage" } },
        { type: "bilocale", stay: { checkin: "2026-10-15", checkout: "2026-10-18" }, price: "€ 300",
          name: { it: "Bilocale per 4", en: "Apartment for 4", de: "Apartment für 4" },
          when: { it: "3 notti", en: "3 nights", de: "3 Nächte" },
          desc: { it: "Fino a 4 persone", en: "Up to 4 people", de: "Bis zu 4 Personen" },
          note: { it: "≈ € 25 a persona a notte", en: "≈ €25 per person per night", de: "≈ 25 € pro Person/Nacht" } },
        { type: "", stay: { checkin: "2026-10-15", checkout: "2026-10-18" }, price: "€ 328",
          name: { it: "Casa del Borgo", en: "Casa del Borgo", de: "Casa del Borgo" },
          when: { it: "3 notti · Finalborgo", en: "3 nights · Finalborgo", de: "3 Nächte · Finalborgo" },
          desc: { it: "Team e gruppi fino a 8 persone", en: "Teams & groups up to 8", de: "Teams & Gruppen bis 8" },
          note: { it: "≈ € 41 a persona", en: "≈ €41 per person", de: "≈ 41 € pro Person" } }
      ]
    },
    {
      id: "prenota-prima",
      code: "PRIMA15",
      icon: "calendar",
      showFrom: "", showUntil: "2027-03-31",
      badge: { it: "Estate 2027", en: "Summer 2027", de: "Sommer 2027" },
      title: { it: "Prenota prima: −15%", en: "Early booking: 15% off", de: "Frühbucher: −15%" },
      text: {
        it: "Prenota l'estate entro il 31 marzo e hai il 15% di sconto invece del 10%.",
        en: "Book your summer by 31 March and get 15% off instead of 10%.",
        de: "Buchen Sie Ihren Sommer bis 31. März und erhalten Sie 15% statt 10% Rabatt."
      }
    },
    {
      id: "7-per-6",
      code: "SETTE6",
      icon: "moon",
      showFrom: "", showUntil: "",
      badge: { it: "Tutto l'anno", en: "All year", de: "Ganzjährig" },
      title: { it: "7 notti, ne paghi 6", en: "7 nights, pay for 6", de: "7 Nächte, 6 bezahlen" },
      text: {
        it: "Una settimana intera al mare con una notte in regalo. Escluso agosto.",
        en: "A whole week by the sea with one night free. August excluded.",
        de: "Eine ganze Woche am Meer, eine Nacht gratis. Außer August."
      }
    },
    {
      id: "inverno",
      code: "INVERNO32",
      icon: "sun",
      showFrom: "", showUntil: "",
      badge: { it: "Novembre – marzo", en: "November – March", de: "November – März" },
      title: { it: "Inverno al mare: 3 notti al prezzo di 2", en: "Winter by the sea: 3 nights for 2", de: "Winter am Meer: 3 Nächte zum Preis von 2" },
      text: {
        it: "Sole, sentieri e mare anche d'inverno. Escluse feste di Natale, Capodanno e Pasqua.",
        en: "Sun, trails and sea in winter too. Christmas, New Year and Easter excluded.",
        de: "Sonne, Trails und Meer auch im Winter. Außer Weihnachten, Silvester und Ostern."
      }
    },
    {
      id: "bike-week",
      code: "BIKEWEEK",
      icon: "bike",
      showFrom: "", showUntil: "",
      badge: { it: "Primavera e autunno", en: "Spring & autumn", de: "Frühling & Herbst" },
      title: { it: "Bike Week: e-bike gratis per un giorno", en: "Bike Week: free e-bike for a day", de: "Bike Week: E-Bike einen Tag gratis" },
      text: {
        it: "Con almeno 5 notti tra marzo-giugno o settembre-novembre, un giorno di e-bike è offerto da noi.",
        en: "Stay 5+ nights in March–June or September–November and get one e-bike day on us.",
        de: "Ab 5 Nächten von März–Juni oder September–November schenken wir Ihnen einen E-Bike-Tag."
      }
    },
    {
      id: "ultimo-minuto",
      code: "LAST15",
      icon: "clock",
      showFrom: "", showUntil: "",
      badge: { it: "Ultimo minuto", en: "Last minute", de: "Last Minute" },
      title: { it: "Parti tra pochi giorni? −15%", en: "Leaving in a few days? 15% off", de: "Kurzfristig? −15%" },
      text: {
        it: "Arrivo entro 7 giorni: 15% di sconto sugli appartamenti ancora liberi.",
        en: "Arriving within 7 days: 15% off the apartments still available.",
        de: "Anreise innerhalb von 7 Tagen: 15% Rabatt auf freie Apartments."
      }
    },
    {
      id: "torna-da-noi",
      code: "TORNA",
      icon: "heart",
      showFrom: "", showUntil: "",
      badge: { it: "Ex ospiti", en: "Returning guests", de: "Stammgäste" },
      title: { it: "Torna da noi: −5% in più", en: "Come back: extra 5% off", de: "Wiederkommen: 5% extra" },
      text: {
        it: "Sei già stato nostro ospite? Hai il 5% in più oltre allo sconto diretto. Indica il nome della prenotazione precedente.",
        en: "Stayed with us before? Get an extra 5% on top of the direct discount. Tell us the name of your previous booking.",
        de: "Schon bei uns gewesen? 5% extra zusätzlich zum Direktrabatt. Nennen Sie den Namen Ihrer früheren Buchung."
      }
    }
  ]
};
