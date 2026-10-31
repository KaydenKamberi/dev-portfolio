// js/main.js
// Shared behavior for every page (PRD 5.2 + 5.3): nav, header state, reveals,
// counters, hours lists, sticker badges. Owner: Claude Code.
//
// Page scripts may import the helpers exported at the bottom, e.g.
//   import { prefersReducedMotion, formatTime } from '../main.js';

import { HOURS } from './data.js';

const root = document.documentElement;
root.classList.add('js');

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => motionQuery.matches;

/* ------------------------------------------------------------------------ */
/* Formatting helpers                                                        */
/* ------------------------------------------------------------------------ */

// '09:00' -> '9 AM', '19:30' -> '7:30 PM'
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

export function formatHours(entry) {
  return entry.open ? `${formatTime(entry.open)} – ${formatTime(entry.close)}` : 'Closed';
}

/* ------------------------------------------------------------------------ */
/* Working days: [2,3,4,5,6] -> "Tue–Sat", [0,2,4,5,6] -> "Tue, Thu–Sun"     */
/* ------------------------------------------------------------------------ */

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday-first, so Sunday ends a run

export function formatDays(days) {
  const runs = [];
  WEEK.forEach((day, i) => {
    if (!days.includes(day)) return;
    const last = runs[runs.length - 1];
    if (last && last.end === i - 1) {
      last.end = i;
      last.days.push(day);
    } else {
      runs.push({ end: i, days: [day] });
    }
  });
  return runs
    .map(({ days: d }) => {
      if (d.length >= 3) return `${DAY_ABBR[d[0]]}–${DAY_ABBR[d[d.length - 1]]}`;
      return d.map((x) => DAY_ABBR[x]).join(', ');
    })
    .join(', ');
}

/* ------------------------------------------------------------------------ */
/* Current page in nav                                                       */
/* ------------------------------------------------------------------------ */

function markCurrentPage() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(`[data-nav-link="${page}"]`).forEach((link) => {
    link.setAttribute('aria-current', 'page');
  });
}

/* ------------------------------------------------------------------------ */
/* Header: solid after 40px of scroll                                        */
/* ------------------------------------------------------------------------ */

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* ------------------------------------------------------------------------ */
/* Mobile nav                                                                */
/* ------------------------------------------------------------------------ */

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  const label = toggle.querySelector('.sr-only');
  const desktop = window.matchMedia('(min-width: 768px)');

  nav.querySelectorAll('.site-nav__list > li').forEach((li, i) => li.style.setProperty('--i', i));

  const focusables = () => [toggle, ...nav.querySelectorAll('a[href], button:not([disabled])')];

  const setOpen = (open, { returnFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    if (open) {
      const first = nav.querySelector('a[href]');
      // Wait a frame so the menu is visible before moving focus
      requestAnimationFrame(() => first && first.focus({ preventScroll: true }));
    } else if (returnFocus) {
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false, { returnFocus: true });
      return;
    }
    // Keep Tab inside the open menu (toggle + links)
    if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  desktop.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

/* ------------------------------------------------------------------------ */
/* Reveals, counters (IntersectionObserver)                                  */
/* ------------------------------------------------------------------------ */

const seen = new WeakSet();
let revealObserver;
const revealTargets = new Map();
let countObserver;

function revealNow(el) {
  el.classList.add('is-revealed');
}

function prepareReveal(el) {
  if (seen.has(el)) return;
  seen.add(el);
  const delay = Number(el.dataset.revealDelay);
  if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
  if (el.hasAttribute('data-reveal-stagger')) {
    const step = Number(el.dataset.revealStagger) || 90;
    [...el.children].forEach((child, i) => {
      child.style.setProperty('--reveal-delay', `${(delay || 0) + i * step}ms`);
    });
  }
  if (!revealObserver) {
    revealNow(el);
    return;
  }
  // A fully clip-path'd element never reports as intersecting, so arch
  // reveals are triggered by their parent instead.
  const target = el.dataset.reveal === 'arch' && el.parentElement ? el.parentElement : el;
  if (!revealTargets.has(target)) revealTargets.set(target, []);
  revealTargets.get(target).push(el);
  revealObserver.observe(target);
}

const numberFormats = new Map();
function formatCount(value, decimals) {
  if (!numberFormats.has(decimals)) {
    numberFormats.set(
      decimals,
      new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    );
  }
  return numberFormats.get(decimals).format(value);
}

function setCount(el, value) {
  const decimals = Number(el.dataset.countDecimals) || 0;
  const suffix = el.dataset.countSuffix || '';
  const prefix = el.dataset.countPrefix || '';
  el.textContent = `${prefix}${formatCount(value, decimals)}${suffix}`;
}

function runCount(el) {
  const target = Number(el.dataset.countTo) || 0;
  if (prefersReducedMotion()) {
    setCount(el, target);
    return;
  }
  const duration = Number(el.dataset.countDuration) || 1600;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    setCount(el, target * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else setCount(el, target);
  };
  requestAnimationFrame(tick);
}

function prepareCount(el) {
  if (seen.has(el)) return;
  seen.add(el);
  // Reserve the final width so the layout doesn't jiggle while counting
  setCount(el, Number(el.dataset.countTo) || 0);
  el.style.fontVariantNumeric = 'tabular-nums';
  if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  if (!countObserver || prefersReducedMotion()) return;
  setCount(el, 0);
  countObserver.observe(el);
}

function initObservers() {
  const canObserve = 'IntersectionObserver' in window;
  const animate = canObserve && !prefersReducedMotion();

  if (animate) {
    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (revealTargets.get(entry.target) || [entry.target]).forEach(revealNow);
          revealTargets.delete(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );
  }

  if (canObserve) {
    countObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.6 },
    );
  }
}

/* ------------------------------------------------------------------------ */
/* Hours lists                                                               */
/* ------------------------------------------------------------------------ */

// Monday first, like a shop window sign
const HOURS_ORDER = [1, 2, 3, 4, 5, 6, 0];

function fillHoursList(list) {
  if (seen.has(list)) return;
  seen.add(list);
  const today = new Date().getDay();
  list.textContent = '';
  HOURS_ORDER.map((d) => HOURS.find((h) => h.day === d)).forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'hours-list__item';
    if (!entry.open) li.classList.add('is-closed');
    if (entry.day === today) li.classList.add('is-today');

    const day = document.createElement('span');
    day.className = 'hours-list__day';
    day.textContent = entry.label;
    if (entry.day === today) {
      const badge = document.createElement('span');
      badge.className = 'hours-list__badge';
      badge.textContent = '(today)';
      day.append(' ', badge);
    }

    const time = document.createElement('span');
    time.className = 'hours-list__time';
    time.textContent = formatHours(entry);

    li.append(day, time);
    list.append(li);
  });
}

/* ------------------------------------------------------------------------ */
/* Sticker badges: wrap text around a circle                                 */
/* ------------------------------------------------------------------------ */

let stickerId = 0;
const SVG_NS = 'http://www.w3.org/2000/svg';

function enhanceSticker(sticker) {
  if (seen.has(sticker)) return;
  seen.add(sticker);
  const textEl = sticker.querySelector('.sticker__text');
  if (!textEl) return;
  const text = textEl.textContent.trim();
  const id = `sticker-path-${++stickerId}`;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'sticker__ring');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('id', id);
  path.setAttribute('fill', 'none');
  path.setAttribute('d', 'M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0');

  const textNode = document.createElementNS(SVG_NS, 'text');
  const textPath = document.createElementNS(SVG_NS, 'textPath');
  textPath.setAttribute('href', `#${id}`);
  textPath.setAttribute('textLength', String(Math.round(2 * Math.PI * 46) - 4));
  textPath.setAttribute('lengthAdjust', 'spacing');
  textPath.textContent = text;
  textNode.append(textPath);
  svg.append(path, textNode);

  // Screen readers get the words without the decorative separators
  textEl.textContent = text.split('✦').map((t) => t.trim()).filter(Boolean).join(', ');
  textEl.classList.add('sr-only');
  sticker.prepend(svg);
  sticker.classList.add('is-enhanced');
}

/* ------------------------------------------------------------------------ */
/* Scan (initial + anything page scripts render later)                       */
/* ------------------------------------------------------------------------ */

function scan(scope) {
  if (!(scope instanceof Element || scope instanceof Document)) return;
  const pick = (sel) => {
    const found = [...scope.querySelectorAll(sel)];
    if (scope instanceof Element && scope.matches(sel)) found.unshift(scope);
    return found;
  };
  pick('[data-reveal], [data-reveal-stagger]').forEach(prepareReveal);
  pick('[data-count-to]').forEach(prepareCount);
  pick('[data-hours-list]').forEach(fillHoursList);
  pick('.sticker').forEach(enhanceSticker);
}

function watchForNewContent() {
  if (!('MutationObserver' in window)) return;
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => m.addedNodes.forEach((node) => node.nodeType === 1 && scan(node)));
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

/* ------------------------------------------------------------------------ */
/* Boot                                                                      */
/* ------------------------------------------------------------------------ */

markCurrentPage();
initHeader();
initNav();
initObservers();
scan(document);
watchForNewContent();

// If motion preference flips to "reduce" mid-visit, show everything
motionQuery.addEventListener('change', (e) => {
  if (e.matches) document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(revealNow);
});
