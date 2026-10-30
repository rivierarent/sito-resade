(function () {
  "use strict";

  var CFG = window.RESADE_CONFIG || {};
  var I18N = window.RESADE_I18N || {};
  var LANGS = ["it", "en", "de"];
  var lang = "it";
  var selectedOffer = null;
  var selectedPkg = null;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------- i18n ---------------- */

  // Italian lives in the HTML: snapshot it so we can switch back.
  $$("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    if (!(key in I18N.it)) I18N.it[key] = el.innerHTML;
  });

  function t(key, vars) {
    var s = (I18N[lang] && I18N[lang][key]) || I18N.it[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1) next = "it";
    lang = next;
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n"));
    });
    $$(".lang [data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    try { localStorage.setItem("resade-lang", lang); } catch (e) { /* ignore */ }
    updateNights();
    if (typeof updateCalc === "function") updateCalc();
    if (typeof renderOffers === "function") renderOffers();
    if (typeof applyParking === "function") applyParking();
  }

  function initialLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q && LANGS.indexOf(q) > -1) return q;
    try {
      var s = localStorage.getItem("resade-lang");
      if (s && LANGS.indexOf(s) > -1) return s;
    } catch (e) { /* ignore */ }
    var nav = (navigator.language || "it").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) > -1 ? nav : "en";
  }

  $$(".lang [data-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  /* ---------------- Config → DOM ---------------- */

  function waLink(text) {
    return "https://wa.me/" + CFG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  $$("[data-cfg]").forEach(function (el) {
    var v = CFG[el.getAttribute("data-cfg")];
    if (v) el.textContent = v;
  });
  $$("[data-cfg-link]").forEach(function (el) {
    var k = el.getAttribute("data-cfg-link");
    if (k === "email" && CFG.email) { el.href = "mailto:" + CFG.email; if (!el.querySelector("svg")) el.textContent = CFG.email; }
    if (k === "phone" && CFG.phone) { el.href = "tel:" + CFG.phone; if (!el.querySelector("svg")) el.textContent = CFG.phoneLabel || CFG.phone; }
    if (k === "whatsapp" && CFG.whatsapp) { el.href = waLink(); el.hidden = false; }
  });
  if (CFG.whatsapp) {
    $$("[data-wa-only]").forEach(function (el) { el.hidden = false; });
    $$('[data-send="whatsapp"]').forEach(function (el) { el.hidden = false; });
  }
  $$("[data-ota]").forEach(function (el) {
    var url = CFG.ota && CFG.ota[el.getAttribute("data-ota")];
    if (url) el.href = url; else el.remove();
  });
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- Dates helpers ---------------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(s) {
    if (!s) return null;
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmt(s, pattern) {
    var d = parseISO(s);
    if (!d) return "";
    return (pattern || "YYYY-MM-DD")
      .replace("YYYY", d.getFullYear())
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()));
  }
  function nightsBetween(a, b) {
    var da = parseISO(a), db = parseISO(b);
    if (!da || !db) return 0;
    return Math.round((db - da) / 86400000);
  }
  var today = toISO(new Date());

  // Keep check-out after check-in on any pair of date inputs.
  function linkDates(form) {
    var ci = form.elements.checkin, co = form.elements.checkout;
    if (!ci || !co) return;
    ci.min = today;
    co.min = toISO(addDays(new Date(), 1));
    ci.addEventListener("change", function () {
      if (!ci.value) return;
      var minOut = toISO(addDays(parseISO(ci.value), 1));
      co.min = minOut;
      if (!co.value || co.value <= ci.value) co.value = toISO(addDays(parseISO(ci.value), 7));
      updateNights();
    });
    co.addEventListener("change", updateNights);
  }

  /* ---------------- Booking widget (Kross Booking) ---------------- */

  var booking = $("#prenota");
  var nightsEl = booking && $(".booking__nights", booking);
  var bookErr = booking && $(".booking__error", booking);

  function updateNights() {
    if (!booking || !nightsEl) return;
    var n = nightsBetween(booking.elements.checkin.value, booking.elements.checkout.value);
    nightsEl.textContent = n > 0 ? (n === 1 ? t("js.nights1") : t("js.nightsN", { n: n })) : "";
    if (n > 0) showError(bookErr, "");
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  function validateStay(form) {
    var ci = form.elements.checkin.value, co = form.elements.checkout.value;
    if (!ci || !co) return t("js.errDates");
    if (ci < today) return t("js.errPast");
    if (co <= ci) return t("js.errOrder");
    return "";
  }

  function buildBookingUrl(data) {
    var b = CFG.booking || {};
    var p = b.params || {};
    var url;
    try { url = new URL(b.url, location.href); } catch (e) { return null; }
    var set = function (name, value) { if (name && value !== "" && value != null) url.searchParams.set(name, value); };
    set(p.checkin, fmt(data.checkin, b.dateFormat));
    set(p.checkout, fmt(data.checkout, b.dateFormat));
    set(p.adults, data.adults);
    set(p.children, data.children);
    set(p.lang, lang);
    set(p.promo, (selectedOffer && selectedOffer.code) || b.promoCode);
    return url.toString();
  }

  function requestText(data) {
    var lines = [t("js.reqIntro", { d: CFG.directDiscount || 10 }), ""];
    var add = function (label, v) { if (v) lines.push(label + ": " + v); };
    if (selectedOffer) add(t("js.reqOffer"), loc(selectedOffer.title) + (selectedPkg ? " – " + loc(selectedPkg.name) : "") + (selectedOffer.code ? " (" + selectedOffer.code + ")" : ""));
    add(t("js.reqName"), data.name);
    add(t("js.reqEmail"), data.email);
    add(t("js.reqPhone"), data.phone);
    add(t("js.reqIn"), data.checkin && fmt(data.checkin, "DD/MM/YYYY"));
    add(t("js.reqOut"), data.checkout && fmt(data.checkout, "DD/MM/YYYY"));
    add(t("js.reqAdults"), data.adults);
    add(t("js.reqChildren"), data.children);
    add(t("js.reqGuests"), data.guests);
    add(t("js.reqType"), data.type);
    if (data.message) { lines.push(""); lines.push(t("js.reqMsg") + ":"); lines.push(data.message); }
    return lines.join("\n");
  }

  function sendRequest(data, channel) {
    var body = requestText(data);
    if (channel === "whatsapp" && CFG.whatsapp) {
      window.open(waLink(body), "_blank", "noopener");
      return;
    }
    location.href = "mailto:" + (CFG.email || "") +
      "?subject=" + encodeURIComponent(t("js.mailSubject")) +
      "&body=" + encodeURIComponent(body);
  }

  function formData(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "checkbox") return;
      out[el.name] = el.value.trim();
    });
    return out;
  }

  if (booking) {
    linkDates(booking);
    booking.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = validateStay(booking);
      showError(bookErr, err);
      if (err) {
        (booking.elements.checkin.value ? booking.elements.checkout : booking.elements.checkin).focus();
        return;
      }
      var data = formData(booking);
      if (data.type) {
        var opt = booking.elements.type.selectedOptions[0];
        data.type = opt ? opt.textContent : data.type;
      }
      var b = CFG.booking || {};
      var url = b.url && buildBookingUrl(data);
      if (typeof window.gtag === "function") {
        window.gtag("event", "begin_checkout", { checkin: data.checkin, checkout: data.checkout });
      }
      if (url) {
        nightsEl.textContent = t("js.redirect");
        if (b.openInNewTab) window.open(url, "_blank", "noopener");
        else location.href = url;
      } else {
        sendRequest(data, CFG.whatsapp ? "whatsapp" : "email");
      }
    });
  }

  // "Check prices" buttons on apartment cards → preselect type, jump to widget.
  $$("[data-book]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!booking) return;
      booking.elements.type.value = btn.getAttribute("data-book");
      booking.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { booking.elements.checkin.focus({ preventScroll: true }); }, 500);
    });
  });

  /* ---------------- Guests filter ---------------- */

  var cards = $(".cards");
  $$("[data-guests]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      $$("[data-guests]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", String(on));
      var n = on ? +btn.getAttribute("data-guests") : 0;
      if (cards) cards.classList.toggle("is-filtered", n > 0);
      $$(".card[data-max]").forEach(function (c) {
        c.classList.toggle("is-fit", n > 0 && n <= +c.getAttribute("data-max"));
      });
      if (booking && n) {
        booking.elements.adults.value = String(Math.min(n, 6));
        booking.elements.children.value = "0";
      }
    });
  });

  /* ---------------- Savings calculator ---------------- */

  var range = $("#calc-range");
  function euro(v) { return "€ " + Math.round(v).toLocaleString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "it-IT"); }
  function updateCalc() {
    if (!range) return;
    var price = +range.value, pct = (CFG.directDiscount || 10) / 100;
    $("#calc-portal").textContent = euro(price);
    $("#calc-here").textContent = euro(price * (1 - pct));
    $("#calc-save").textContent = euro(price * pct);
  }
  if (range) range.addEventListener("input", updateCalc);

  /* ---------------- Free parking (until a date) ---------------- */

  var parkingFree = !!CFG.freeParkingUntil && CFG.freeParkingUntil >= today;
  function longDate(iso) {
    var d = parseISO(iso);
    try { return d.toLocaleDateString(lang === "en" ? "en-GB" : lang, { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return fmt(iso, "DD/MM/YYYY"); }
  }
  function applyParking() {
    if (!parkingFree) return;
    var vars = { date: longDate(CFG.freeParkingUntil) };
    $$("[data-free]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-free"), vars); });
    var banner = $("#parking-banner");
    if (banner) banner.hidden = false;
  }

  /* ---------------- Offers ---------------- */

  function loc(obj) { return obj ? (obj[lang] || obj.it || "") : ""; }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function offerActive(o) {
    return (!o.showFrom || o.showFrom <= today) && (!o.showUntil || o.showUntil >= today);
  }
  var offers = (CFG.offers || []).filter(offerActive);
  var featured = offers.filter(function (o) { return o.featured; })[0] || null;
  var featuredBox = $("#offer-featured"), offersGrid = $("#offers-grid"), eventbar = $("#eventbar");
  var offerChip = booking && $(".booking__offer", booking);

  function countdown(o) {
    var now = Date.now(), start = o.countdownTo && new Date(o.countdownTo).getTime(), end = o.eventEnd && new Date(o.eventEnd).getTime();
    if (!start) return null;
    if (now >= start) return (!end || now <= end) ? { live: true } : null;
    var diff = start - now;
    return { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60 };
  }

  function renderCountdown() {
    if (!featured) return;
    var c = countdown(featured);
    var box = $(".countdown", featuredBox);
    if (box) {
      box.innerHTML = !c ? "" : c.live
        ? '<span class="countdown__live">' + esc(t("off.live")) + "</span>"
        : [["d", "off.days"], ["h", "off.hours"], ["m", "off.mins"]].map(function (u) {
            return '<span class="countdown__unit"><strong>' + c[u[0]] + "</strong><small>" + esc(t(u[1])) + "</small></span>";
          }).join("");
    }
    if (eventbar) {
      $(".eventbar__text", eventbar).textContent = loc(featured.badge);
      $(".eventbar__count", eventbar).textContent = !c ? "" : c.live ? t("off.live") : t(c.d === 1 ? "off.in1" : "off.inN", { n: c.d });
    }
  }

  function renderOffers() {
    if (!offersGrid) return;
    if (featured && featuredBox) {
      featuredBox.hidden = false;
      featuredBox.innerHTML =
        '<div class="offer-featured__copy">' +
          '<span class="offer__badge offer__badge--light"><svg class="ic"><use href="#i-trophy"/></svg>' + esc(loc(featured.badge)) + "</span>" +
          "<h3>" + esc(loc(featured.title)) + "</h3>" +
          "<p>" + esc(loc(featured.text)) + "</p>" +
          (featured.perks ? '<ul class="offer__perks">' + (loc(featured.perks) || []).map(function (p) {
            return '<li><svg class="ic"><use href="#i-check"/></svg>' + esc(p) + "</li>";
          }).join("") + "</ul>" : "") +
        "</div>" +
        '<div class="offer-featured__side">' +
          '<p class="offer-featured__label">' + esc(t("off.startsIn")) + "</p>" +
          '<div class="countdown"></div>' +
          '<button class="btn btn--blue btn--block" type="button" data-offer="' + esc(featured.id) + '">' + esc(t("off.use")) + '<svg class="ic"><use href="#i-arrow"/></svg></button>' +
          (featured.code ? '<p class="offer__code">' + esc(t("off.code")) + " <strong>" + esc(featured.code) + "</strong></p>" : "") +
        "</div>" +
        (featured.packages ? '<div class="pkgs"><p class="pkgs__title">' + esc(t("off.packages")) + '</p><div class="pkgs__grid">' +
          featured.packages.map(function (k, i) {
            return '<div class="pkg"><span class="pkg__n">' + (i + 1) + "</span><h4>" + esc(loc(k.name)) + "</h4>" +
              '<p class="pkg__when">' + esc(loc(k.when)) + "</p><p>" + esc(loc(k.desc)) + "</p>" +
              '<div class="pkg__price"><small>' + esc(t("off.from")) + "</small><strong>" + esc(k.price) + "</strong><span>" + esc(loc(k.note)) + "</span></div>" +
              '<button class="btn btn--blue btn--sm btn--block" type="button" data-offer="' + esc(featured.id) + '" data-pkg="' + i + '">' + esc(t("off.choose")) + "</button></div>";
          }).join("") + "</div></div>" : "");
      if (eventbar) eventbar.hidden = false;
      renderCountdown();
    }
    offersGrid.innerHTML = offers.filter(function (o) { return !o.featured; }).map(function (o) {
      return '<article class="offer">' +
        '<div class="offer__top"><span class="offer__icon"><svg class="ic"><use href="#i-' + esc(o.icon || "tag") + '"/></svg></span>' +
        '<span class="offer__badge">' + esc(loc(o.badge)) + "</span></div>" +
        "<h3>" + esc(loc(o.title)) + "</h3>" +
        "<p>" + esc(loc(o.text)) + "</p>" +
        '<div class="offer__foot"><span class="offer__code">' + (o.code ? esc(t("off.code")) + " <strong>" + esc(o.code) + "</strong>" : "") + "</span>" +
        '<button class="btn btn--line btn--sm" type="button" data-offer="' + esc(o.id) + '">' + esc(t("off.useShort")) + "</button></div>" +
      "</article>";
    }).join("");
    if (selectedOffer && offerChip) $(".booking__offer-name", offerChip).textContent = loc(selectedOffer.title) + (selectedPkg ? " · " + loc(selectedPkg.name) : "");
  }

  function selectOffer(o, pkg) {
    selectedOffer = o;
    selectedPkg = (o && pkg) || null;
    if (!booking || !offerChip) return;
    offerChip.hidden = !o;
    if (!o) return;
    $(".booking__offer-name", offerChip).textContent = pkg ? loc(o.title) + " · " + loc(pkg.name) : loc(o.title);
    var ci = booking.elements.checkin, co = booking.elements.checkout;
    if (pkg) booking.elements.type.value = pkg.type || "";
    var stay = (pkg && pkg.stay) || o.stay;
    if (stay && stay.checkin >= today && (pkg || !ci.value)) {
      ci.value = stay.checkin;
      co.value = stay.checkout;
      co.min = toISO(addDays(parseISO(ci.value), 1));
      updateNights();
    }
    booking.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(function () { (ci.value ? booking.querySelector(".booking__submit") : ci).focus({ preventScroll: true }); }, 500);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-offer]");
    if (!btn) return;
    var id = btn.getAttribute("data-offer");
    var o = offers.filter(function (x) { return x.id === id; })[0] || null;
    var pi = btn.getAttribute("data-pkg");
    selectOffer(o, o && o.packages && pi !== null ? o.packages[+pi] : null);
  });
  if (offerChip) $(".booking__offer-x", offerChip).addEventListener("click", function () { selectOffer(null); });
  if (!offers.length) { var sec = $("#offerte"); if (sec) sec.hidden = true; $$('a[href="#offerte"]').forEach(function (a) { a.hidden = true; }); }
  if (featured) setInterval(renderCountdown, 30000);

  /* ---------------- Contact form ---------------- */

  var contact = $("#contact-form");
  if (contact) {
    linkDates(contact);
    var cErr = $(".form__error", contact);
    contact.addEventListener("submit", function (e) {
      e.preventDefault();
      var channel = (e.submitter && e.submitter.getAttribute("data-send")) || "email";
      var el = contact.elements;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim());
      var ok = el.name.value.trim() && emailOk && el.message.value.trim() && el.privacy.checked;
      if (!ok) { showError(cErr, t("js.errForm")); return; }
      if (el.checkin.value && el.checkout.value && el.checkout.value <= el.checkin.value) {
        showError(cErr, t("js.errOrder")); return;
      }
      showError(cErr, "");
      sendRequest(formData(contact), channel);
      if (channel === "email") {
        cErr.hidden = false;
        cErr.style.color = "var(--ok)";
        cErr.textContent = t("js.sent");
      }
    });
  }

  /* ---------------- UI: header, nav, reveal, images ---------------- */

  var header = $(".header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $(".burger"), nav = $("#nav");
  function closeNav() { nav.classList.remove("is-open"); header.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); }
  burger.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  // Load photos from assets/img/ only if present; gradients otherwise.
  $$("[data-img]").forEach(function (el) {
    var src = el.getAttribute("data-img");
    var img = new Image();
    img.onload = function () {
      el.style.backgroundImage = "url('" + src + "')";
      el.classList.add("is-loaded");
    };
    img.src = src;
  });

  if ("IntersectionObserver" in window) {
    var links = {};
    $$("a", nav).forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (a && en.isIntersecting) {
          $$("a", nav).forEach(function (x) { x.classList.remove("is-active"); });
          a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });

    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); rev.unobserve(en.target); }
      });
    }, { threshold: .12 });
    $$("[data-reveal]").forEach(function (el) {
      el.classList.add("reveal");
      rev.observe(el);
    });
  }

  setLang(initialLang());
})();
