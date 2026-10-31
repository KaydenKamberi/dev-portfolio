// js/pages/barbers.js
// Barbers page (PRD 7.3): flip cards, filterable gallery, before/after lightbox.
// Built by Claude Code in Phase 2.

import { BARBERS, GALLERY, getBarber } from '../data.js';
import { prefersReducedMotion, formatDays } from '../main.js';

const $ = (sel, scope = document) => scope.querySelector(sel);

const esc = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ------------------------------------------------------------------------ */
/* Barber cards                                                              */
/* ------------------------------------------------------------------------ */

function renderBarbers() {
  const list = $('[data-barbers]');
  if (!list) return;
  list.innerHTML = BARBERS.map(
    (b) => `
    <li class="barber" data-barber="${esc(b.id)}">
      <div class="barber__inner">
        <div class="barber__face barber__front" id="barber-${esc(b.id)}-front">
          <div class="arch barber__arch">
            <img src="${esc(b.image)}" alt="Portrait of ${esc(b.name)}" width="800" height="1000" loading="lazy" decoding="async">
          </div>
          <div class="barber__body">
            <h2 class="barber__name">${esc(b.name)}</h2>
            <p class="barber__role">${esc(b.role)} · ${b.years} years behind the chair</p>
            <ul class="barber__chips" role="list" aria-label="Specialties">
              ${b.specialties.map((s) => `<li class="chip">${esc(s)}</li>`).join('')}
            </ul>
            <button class="btn btn--ghost barber__flip" type="button" aria-expanded="false" aria-controls="barber-${esc(b.id)}-back" data-flip>More about ${esc(b.firstName)}</button>
          </div>
        </div>
        <div class="barber__face barber__back" id="barber-${esc(b.id)}-back" inert>
          <h3 class="barber__back-title" tabindex="-1">About ${esc(b.firstName)}</h3>
          <p class="barber__bio">${esc(b.bio)}</p>
          <blockquote class="barber__quote"><p>“${esc(b.quote)}”</p></blockquote>
          <dl class="barber__facts">
            <div><dt>Works</dt><dd>${esc(formatDays(b.days))}</dd></div>
            <div><dt>Instagram</dt><dd><a href="#">${esc(b.instagram)}</a></dd></div>
          </dl>
          <div class="barber__actions">
            <a class="btn btn--primary" href="book.html?barber=${esc(b.id)}">Book with ${esc(b.firstName)}</a>
            <button class="btn btn--ghost btn--sm" type="button" data-flip-back>Back to ${esc(b.firstName)}</button>
          </div>
        </div>
      </div>
    </li>`,
  ).join('');

  const setFlipped = (card, flipped) => {
    const front = $('.barber__front', card);
    const back = $('.barber__back', card);
    const toggle = $('[data-flip]', card);
    card.classList.toggle('is-flipped', flipped);
    toggle.setAttribute('aria-expanded', String(flipped));
    // Only the visible face is reachable by keyboard and screen readers
    front.inert = flipped;
    back.inert = !flipped;
    if (flipped) $('.barber__back-title', card).focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  };

  list.addEventListener('click', (e) => {
    const card = e.target.closest('.barber');
    if (!card) return;
    if (e.target.closest('[data-flip]')) setFlipped(card, true);
    else if (e.target.closest('[data-flip-back]')) setFlipped(card, false);
  });

  // Escape on the back of a card flips it back
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const card = e.target.closest('.barber.is-flipped');
    if (card) setFlipped(card, false);
  });
}

/* ------------------------------------------------------------------------ */
/* Gallery + filters                                                         */
/* ------------------------------------------------------------------------ */

const ZOOM_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 8v6M8 11h6"/></svg>';

let activeFilter = 'all';
const visibleItems = () => GALLERY.filter((g) => activeFilter === 'all' || g.barber === activeFilter);

function renderGallery() {
  const grid = $('[data-gallery]');
  const filters = $('[data-gallery-filters]');
  const status = $('[data-gallery-status]');
  if (!grid) return;

  grid.innerHTML = GALLERY.map((g) => {
    const barber = getBarber(g.barber);
    return `
      <li data-gallery-item="${esc(g.id)}" data-barber="${esc(g.barber)}">
        <button class="work__item" type="button" data-open="${esc(g.id)}" aria-haspopup="dialog">
          <span class="work__media">
            <img src="${esc(g.after)}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
            <span class="work__zoom">${ZOOM_ICON}</span>
          </span>
          <span class="work__style">${esc(g.style)}</span>
          <span class="work__by">by ${esc(barber.firstName)}<span class="sr-only">. View before and after</span></span>
        </button>
      </li>`;
  }).join('');

  if (filters) {
    const options = [{ id: 'all', label: 'All' }, ...BARBERS.map((b) => ({ id: b.id, label: b.firstName }))];
    filters.innerHTML = options
      .map((o) => `<button class="chip" type="button" aria-pressed="${o.id === 'all'}" data-filter="${esc(o.id)}">${esc(o.label)}</button>`)
      .join('');

    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn || btn.dataset.filter === activeFilter) return;
      activeFilter = btn.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      applyFilter(grid);
      const count = visibleItems().length;
      if (status) status.textContent = `Showing ${count} ${count === 1 ? 'cut' : 'cuts'}${activeFilter === 'all' ? '' : ` by ${btn.textContent}`}.`;
    });
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn) openLightbox(btn.dataset.open, btn);
  });
}

// Fade/scale out the leavers, then FLIP the stayers into their new spots and
// fade/scale in the newcomers.
let filterRun = 0;
function applyFilter(grid) {
  const run = ++filterRun;
  const items = [...grid.children];
  const show = (li) => activeFilter === 'all' || li.dataset.barber === activeFilter;

  if (prefersReducedMotion() || !Element.prototype.animate) {
    items.forEach((li) => (li.hidden = !show(li)));
    return;
  }

  const leaving = items.filter((li) => !li.hidden && !show(li));
  const staying = items.filter((li) => !li.hidden && show(li));
  const entering = items.filter((li) => li.hidden && show(li));

  const outAnims = leaving.map((li) =>
    li.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.9)' }], {
      duration: 180,
      easing: 'ease-in',
      fill: 'forwards',
    }),
  );

  Promise.all(outAnims.map((a) => a.finished.catch(() => {}))).then(() => {
    if (run !== filterRun) return;
    const first = new Map(staying.map((li) => [li, li.getBoundingClientRect()]));
    leaving.forEach((li) => {
      li.hidden = true;
      li.getAnimations().forEach((a) => a.cancel());
    });
    entering.forEach((li) => (li.hidden = false));

    staying.forEach((li) => {
      const a = first.get(li);
      const b = li.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (!dx && !dy) return;
      li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: 450,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    });

    entering.forEach((li, i) => {
      li.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }], {
        duration: 420,
        delay: 80 + i * 50,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      });
    });
  });
}

/* ------------------------------------------------------------------------ */
/* Lightbox                                                                  */
/* ------------------------------------------------------------------------ */

const lightbox = $('[data-lightbox]');
let currentId = null;
let opener = null;

function fillLightbox(id) {
  const g = GALLERY.find((x) => x.id === id);
  if (!g) return;
  currentId = id;
  const barber = getBarber(g.barber);
  const list = visibleItems();
  const index = list.findIndex((x) => x.id === id);
  $('[data-lightbox-title]', lightbox).textContent = g.style;
  $('[data-lightbox-by]', lightbox).textContent = `by ${barber.name}`;
  const before = $('[data-lightbox-before]', lightbox);
  const after = $('[data-lightbox-after]', lightbox);
  before.src = g.before;
  before.alt = `${g.style}, before`;
  after.src = g.after;
  after.alt = `${g.style}, after`;
  $('[data-lightbox-count]', lightbox).textContent = `${index + 1} of ${list.length}`;
  const single = list.length < 2;
  $('[data-lightbox-prev]', lightbox).disabled = single;
  $('[data-lightbox-next]', lightbox).disabled = single;
}

function step(delta) {
  const list = visibleItems();
  const i = list.findIndex((x) => x.id === currentId);
  const next = list[(i + delta + list.length) % list.length];
  if (next) fillLightbox(next.id);
}

function openLightbox(id, from) {
  if (!lightbox || typeof lightbox.showModal !== 'function') return;
  opener = from;
  fillLightbox(id);
  lightbox.showModal();
  $('[data-lightbox-close]', lightbox).focus();
}

function initLightbox() {
  if (!lightbox) return;
  $('[data-lightbox-close]', lightbox).addEventListener('click', () => lightbox.close());
  $('[data-lightbox-prev]', lightbox).addEventListener('click', () => step(-1));
  $('[data-lightbox-next]', lightbox).addEventListener('click', () => step(1));
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    }
  });
  // Click on the backdrop closes
  // (the dialog's own padding also targets the dialog, so test the bounds)
  lightbox.addEventListener('click', (e) => {
    if (e.target !== lightbox) return;
    const r = lightbox.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) lightbox.close();
  });
  // Escape closes natively; always hand focus back to the photo that opened it
  lightbox.addEventListener('close', () => {
    if (opener) opener.focus({ preventScroll: true });
  });
}

renderBarbers();
renderGallery();
initLightbox();
