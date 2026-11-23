import { ITEMS, OFFER, QUICK } from "./content.js";

/* Szybki przegląd: jedna strona bez 3D, do druku albo PDF. Niezależny od Three.js. */
const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const abs = (url) => new URL(url, location.href).href;
const host = (url) => abs(url).replace(/^https?:\/\//, "").replace(/\/$/, "");

const el = document.getElementById("quick");

function render() {
  const c = QUICK.contact;
  el.innerHTML = `
  <div class="quick__inner">
    <div class="quick__bar no-print">
      <button type="button" class="quick__btn" data-close>← Wróć do pokoju 3D</button>
      <button type="button" class="quick__btn quick__btn--primary" data-print>Zapisz jako PDF</button>
    </div>
    <header class="quick__head">
      <p class="quick__kicker">Portfolio · ${esc(OFFER.company)}</p>
      <h1>Damian Łapczyński</h1>
      <p class="quick__role">Kandydat na stanowisko <strong>${esc(OFFER.role)}</strong></p>
      <p class="quick__contact">
        <a href="tel:+48${c.phone.replace(/\s/g, "")}">${esc(c.phone)}</a> ·
        <a href="mailto:${esc(c.email)}">${esc(c.email)}</a> ·
        <a href="${esc(c.github)}">${esc(host(c.github))}</a>
      </p>
    </header>

    <section><h2>W skrócie</h2><p>${esc(QUICK.summary)}</p></section>

    <section>
      <h2>Dlaczego pasuję do oferty</h2>
      <table class="quick__fit">
        <thead><tr><th>Wymaganie z oferty</th><th>Dowód</th></tr></thead>
        <tbody>${QUICK.fit.map(([r, p]) => `<tr><td>${esc(r)}</td><td>${esc(p)}</td></tr>`).join("")}</tbody>
      </table>
    </section>

    <section>
      <h2>Projekty</h2>
      <div class="quick__projects">
        ${QUICK.projects.map((id) => ITEM[id]).filter(Boolean).map((it) => `
          <article class="quick__proj">
            <p class="quick__kind">${esc(it.kind)}</p>
            <h3>${esc(it.title)}</h3>
            <p>${esc(it.body[0])}</p>
            ${(it.links || []).filter((l) => !l.url.startsWith("mailto")).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} <span class="print-only">(${esc(host(l.url))})</span></a>`).join(" · ")}
          </article>`).join("")}
      </div>
    </section>

    <section>
      <h2>O mnie</h2>
      <dl class="quick__about">${QUICK.about.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    </section>

    <p class="quick__foot">Interaktywna wersja 3D: <a href="${esc(abs("./"))}">${esc(host("./"))}</a></p>
  </div>`;
}

export function openQuick() {
  if (!el.innerHTML) render();
  el.hidden = false;
  document.body.classList.add("quick-open");
  document.getElementById("intro")?.classList.add("is-gone");
  el.scrollTop = 0;
  if (!/[?&]szybko\b/.test(location.search)) history.replaceState(null, "", "?szybko");
}
export function closeQuick() {
  el.hidden = true;
  document.body.classList.remove("quick-open");
  history.replaceState(null, "", location.pathname);
  // back to the room: if it is still loading, show the intro again
  if (document.getElementById("enter")?.disabled === false) document.body.classList.add("is-ready");
  else document.getElementById("intro")?.classList.remove("is-gone");
}

el.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeQuick();
  if (e.target.closest("[data-print]")) print();
});
document.querySelectorAll("[data-quick]").forEach((b) => b.addEventListener("click", openQuick));
addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) closeQuick(); });
window.__openQuick = openQuick;

if (/[?&]szybko\b/.test(location.search) || location.hash === "#szybko") openQuick();
