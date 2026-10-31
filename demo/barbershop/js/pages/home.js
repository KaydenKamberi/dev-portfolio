// js/pages/home.js
// Home page (PRD 7.1): data-rendered sections, before/after slider,
// reviews marquee, golden-hour scroll warmth. Owner: Claude Code.

import { SHOP, SERVICES, BARBERS, REVIEWS, GALLERY, formatPrice, getBarber } from '../data.js';
import { prefersReducedMotion } from '../main.js';

const $ = (sel, scope = document) => scope.querySelector(sel);

const esc = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ------------------------------------------------------------------------ */
/* Story stats (from SHOP.stats)                                             */
/* ------------------------------------------------------------------------ */

function renderStats() {
  const list = $('[data-home-stats]');
  if (!list) return;
  const { years, cuts, barbers, rating } = SHOP.stats;
  const stats = [
    { value: years, label: 'years in El Cajon' },
    { value: cuts, label: 'cuts and counting', suffix: '+' },
    { value: barbers, label: 'barbers, four chairs' },
    { value: rating, label: 'average rating', decimals: 1, star: true },
  ];
  list.innerHTML = stats
    .map(
      (s) => `
      <div class="story__stat">
        <dt>${esc(s.label)}</dt>
        <dd><span data-count-to="${s.value}"${s.suffix ? ` data-count-suffix="${s.suffix}"` : ''}${
          s.decimals ? ` data-count-decimals="${s.decimals}"` : ''
        }>${s.value.toLocaleString('en-US', { minimumFractionDigits: s.decimals || 0 })}${s.suffix || ''}</span>${
          s.star ? '<span class="story__stat-star" aria-hidden="true">★</span>' : ''
        }</dd>
      </div>`,
    )
    .join('');
}

/* ------------------------------------------------------------------------ */
/* Services teaser (featured services)                                       */
/* ------------------------------------------------------------------------ */

function renderServices() {
  const list = $('[data-home-services]');
  if (!list) return;
  list.innerHTML = SERVICES.filter((s) => s.featured)
    .map(
      (s) => `
      <li class="svc">
        <div class="svc__media">
          <img src="assets/img/service-${esc(s.id)}.webp" alt="" width="800" height="600" loading="lazy" decoding="async">
        </div>
        <span class="svc__price"><span class="sr-only">Price: </span>${esc(formatPrice(s.price, s.addon))}</span>
        <div class="svc__body">
          <h3 class="svc__name"><a href="services.html">${esc(s.name)}</a></h3>
          <span class="chip">${s.minutes} min</span>
          <p class="svc__desc">${esc(s.description)}</p>
          <span class="svc__more" aria-hidden="true">See details</span>
        </div>
      </li>`,
    )
    .join('');
}

/* ------------------------------------------------------------------------ */
/* Team teaser                                                               */
/* ------------------------------------------------------------------------ */

function renderTeam() {
  const list = $('[data-home-team]');
  if (!list) return;
  list.innerHTML = BARBERS.map(
    (b) => `
      <li>
        <a class="crew" href="barbers.html">
          <div class="arch crew__arch">
            <img src="${esc(b.image)}" alt="Portrait of ${esc(b.name)}" width="800" height="1000" loading="lazy" decoding="async">
          </div>
          <h3 class="crew__name">${esc(b.name)}</h3>
          <p class="crew__role">${esc(b.role)} · ${b.years} years</p>
        </a>
      </li>`,
  ).join('');
}

/* ------------------------------------------------------------------------ */
/* Reviews marquee                                                           */
/* ------------------------------------------------------------------------ */

function reviewCard(r, clone) {
  const barber = r.barber ? getBarber(r.barber) : null;
  return `
    <figure class="card review-card"${clone ? ' data-clone aria-hidden="true"' : ''}>
      <span class="stars" role="img" aria-label="5 out of 5 stars"></span>
      <blockquote><p>${esc(r.text)}</p></blockquote>
      <figcaption>${esc(r.name)}${
        barber ? ` <span class="review-card__with">with ${esc(barber.firstName)}</span>` : ''
      }</figcaption>
    </figure>`;
}

function renderReviews() {
  const rating = $('[data-shop-rating]');
  if (rating) rating.textContent = SHOP.stats.rating.toFixed(1);

  const marquee = $('[data-marquee]');
  if (!marquee) return;
  const half = Math.ceil(REVIEWS.length / 2);
  const rows = [REVIEWS.slice(0, half), REVIEWS.slice(half)];

  marquee.querySelectorAll('[data-marquee-row]').forEach((row, i) => {
    const items = rows[i] || [];
    // Two copies make the loop seamless; the copy is hidden from screen readers
    row.innerHTML = items.map((r) => reviewCard(r, false)).join('') + items.map((r) => reviewCard(r, true)).join('');
  });

  // Constant, slow speed regardless of screen width (~32px per second)
  const setSpeed = () => {
    marquee.querySelectorAll('[data-marquee-row]').forEach((row) => {
      const distance = row.scrollWidth / 2;
      row.style.setProperty('--marquee-dur', `${Math.max(30, distance / 32)}s`);
    });
  };
  setSpeed();
  window.addEventListener('resize', debounce(setSpeed, 200));

  const toggle = $('[data-marquee-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const paused = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Play reviews' : 'Pause reviews';
      marquee.classList.toggle('is-paused', paused);
    });
  }
}

/* ------------------------------------------------------------------------ */
/* Before & after slider                                                     */
/* ------------------------------------------------------------------------ */

function initBeforeAfter() {
  const root = $('[data-ba]');
  if (!root) return;
  const frame = $('[data-ba-frame]', root);
  const range = $('[data-ba-range]', root);
  const caption = $('[data-ba-caption]', root);
  const picker = $('[data-ba-picker]');

  let pos = Number(range.value) || 50;
  let rafId = 0;
  let interacted = false;

  const paint = () => {
    rafId = 0;
    frame.style.setProperty('--pos', pos.toFixed(2));
    frame.classList.toggle('is-near-start', pos < 14);
    frame.classList.toggle('is-near-end', pos > 86);
  };

  const setPos = (value, { syncInput = true } = {}) => {
    pos = Math.min(100, Math.max(0, value));
    if (syncInput) {
      range.value = String(Math.round(pos));
    }
    range.setAttribute('aria-valuetext', `${Math.round(pos)}% before, ${100 - Math.round(pos)}% after`);
    if (!rafId) rafId = requestAnimationFrame(paint);
  };

  // Keyboard + assistive tech: the native range input
  range.addEventListener('input', () => {
    interacted = true;
    setPos(Number(range.value), { syncInput: false });
  });
  range.addEventListener('focus', () => frame.classList.toggle('is-focused', range.matches(':focus-visible')));
  range.addEventListener('blur', () => frame.classList.remove('is-focused'));

  // Mouse + touch: drag anywhere on the photo
  let dragging = false;
  let rect = null;
  const fromEvent = (e) => ((e.clientX - rect.left) / rect.width) * 100;

  frame.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    interacted = true;
    dragging = true;
    rect = frame.getBoundingClientRect();
    frame.setPointerCapture(e.pointerId);
    frame.classList.add('is-dragging');
    setPos(fromEvent(e));
    // Keep keyboard users' place, but don't steal scroll on touch
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      range.focus({ preventScroll: true });
    }
  });

  frame.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setPos(fromEvent(e));
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    frame.classList.remove('is-dragging');
    range.dispatchEvent(new Event('change', { bubbles: true }));
  };
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);
  frame.addEventListener('lostpointercapture', endDrag);

  setPos(pos);

  // One gentle "demo wiggle" the first time it scrolls into view
  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setTimeout(() => !interacted && wiggle(), 350);
      },
      { threshold: 0.6 },
    );
    io.observe(frame);
  }

  function wiggle() {
    const start = performance.now();
    const duration = 1500;
    const base = pos;
    // Damped sine: out to ~+14, back past to ~-9, settle
    const step = (now) => {
      if (interacted) return;
      const t = Math.min(1, (now - start) / duration);
      const offset = Math.sin(t * Math.PI * 2) * 14 * (1 - t) ** 1.4;
      setPos(base + offset);
      if (t < 1) requestAnimationFrame(step);
      else setPos(base);
    };
    requestAnimationFrame(step);
  }

  // Picker: switch between GALLERY pairs with a crossfade
  if (!picker) return;
  picker.innerHTML = GALLERY.map((g, i) => {
    const barber = getBarber(g.barber);
    return `
      <button class="ba-pick" type="button" aria-pressed="${i === 0}" data-ba-index="${i}">
        <img class="ba-pick__thumb" src="${esc(g.after)}" alt="" width="56" height="56" loading="lazy" decoding="async">
        <span class="ba-pick__text">
          <span class="ba-pick__style">${esc(g.style)}</span>
          <span class="ba-pick__by">by ${esc(barber ? barber.firstName : '')}</span>
        </span>
      </button>`;
  }).join('');

  let current = 0;
  const setCaption = (g) => {
    const barber = getBarber(g.barber);
    caption.innerHTML = `
      <span class="ba__style">${esc(g.style)}</span>
      <span class="ba__by">by ${esc(barber.firstName)}</span>
      <a class="btn btn--light btn--sm ba__book" href="book.html?barber=${esc(barber.id)}">Book with ${esc(barber.firstName)}</a>`;
  };
  setCaption(GALLERY[0]);

  const show = (index) => {
    if (index === current) return;
    current = index;
    const g = GALLERY[index];
    picker.querySelectorAll('[data-ba-index]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(Number(btn.dataset.baIndex) === index));
    });

    const stage = document.createElement('div');
    stage.className = 'ba__stage';
    stage.setAttribute('data-ba-stage', '');
    stage.innerHTML = `
      <img class="ba__img ba__img--after" src="${esc(g.after)}" alt="After: ${esc(g.style.toLowerCase())}" width="1000" height="1000" decoding="async">
      <div class="ba__before">
        <img class="ba__img ba__img--before" src="${esc(g.before)}" alt="Before" width="1000" height="1000" decoding="async">
      </div>`;

    const old = [...frame.querySelectorAll('[data-ba-stage]')];
    old[old.length - 1].after(stage);

    const reveal = () => {
      if (stage.classList.contains('is-visible')) return;
      stage.classList.add('is-visible');
      const cleanup = () => old.forEach((s) => s.remove());
      if (prefersReducedMotion()) cleanup();
      else setTimeout(cleanup, 950);
    };
    // Wait (briefly) for both photos so the crossfade isn't to a blank frame
    const imgs = [...stage.querySelectorAll('img')];
    Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))).then(reveal);
    setTimeout(reveal, 600);

    setCaption(g);
  };

  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ba-index]');
    if (btn) show(Number(btn.dataset.baIndex));
  });

  // Arrow keys move between cuts inside the picker
  picker.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    const buttons = [...picker.querySelectorAll('[data-ba-index]')];
    const i = buttons.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const next = buttons[(i + keys[e.key] + buttons.length) % buttons.length];
    next.focus();
    next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

/* ------------------------------------------------------------------------ */
/* Golden-hour warmth: overlay opacity 0 → 0.08 as you scroll down           */
/* ------------------------------------------------------------------------ */

function initGoldenHour() {
  const overlay = $('[data-golden-hour]');
  if (!overlay) return;
  const MAX = 0.08;
  let ticking = false;
  let last = -1;

  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const value = Math.round(progress * MAX * 1000) / 1000;
    if (value !== last) {
      overlay.style.opacity = String(value);
      last = value;
    }
  };

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}

/* ------------------------------------------------------------------------ */

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

renderStats();
renderServices();
renderTeam();
renderReviews();
initBeforeAfter();
initGoldenHour();
