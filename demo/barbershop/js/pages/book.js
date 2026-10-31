// js/pages/book.js
// Book page (PRD 7.4): five-step booking flow with live summary, fake but
// stable availability, history-aware steps, Netlify Forms submit, and the
// confirmation payoff. Built by Claude Code in Phase 2.

import { SHOP, SERVICES, SERVICE_CATEGORIES, BARBERS, HOURS, getService, getBarber, formatPrice } from '../data.js';
import { prefersReducedMotion, formatTime, formatDays } from '../main.js';

const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

const esc = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const STEPS = ['service', 'barber', 'time', 'details', 'confirm'];
const STEP_HINTS = {
  service: 'Pick a service to continue.',
  barber: 'Pick a barber, or first available, to continue.',
  time: 'Pick a day and a time to continue.',
  details: 'Fill in your name, phone, and email to continue.',
  confirm: '',
};
const ANY = 'any';
const DAYS_AHEAD = 14;
const SLOT_MINUTES = 30;

const state = {
  service: null, // service id
  addons: [], // addon ids
  barber: null, // barber id or ANY
  date: null, // 'YYYY-MM-DD'
  time: null, // 'HH:MM'
  assigned: null, // barber id actually assigned (for first available)
  details: { name: '', phone: '', email: '', notes: '' },
  step: 'service',
  booked: false,
};

/* ------------------------------------------------------------------------ */
/* Helpers: dates, durations, availability                                   */
/* ------------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

const fmtWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const fmtMonthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const fmtLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// Deterministic fake availability (PRD 7.4): stable across reloads
function isBooked(dateISO, barberId, time) {
  const key = `${dateISO}|${barberId}|${time}`;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < 35; // ~35% of slots taken
}

const totalMinutes = () =>
  (state.service ? getService(state.service).minutes : 0) +
  state.addons.reduce((sum, id) => sum + getService(id).minutes, 0);

const totalPrice = () =>
  (state.service ? getService(state.service).price : 0) +
  state.addons.reduce((sum, id) => sum + getService(id).price, 0);

function upcomingDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

// Every slot for a day, with who (if anyone) can take it
function slotsFor(dateISO) {
  const date = fromISO(dateISO);
  const dow = date.getDay();
  const hours = HOURS.find((h) => h.day === dow);
  if (!hours || !hours.open) return { status: 'closed', slots: [] };

  const barbers = state.barber && state.barber !== ANY ? [getBarber(state.barber)] : BARBERS;
  const working = barbers.filter((b) => b.days.includes(dow));
  if (!working.length) return { status: 'off', slots: [] };

  const now = new Date();
  const isToday = toISO(now) === dateISO;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const duration = Math.max(totalMinutes(), SLOT_MINUTES);
  const first = toMinutes(hours.open);
  const last = toMinutes(hours.close) - duration;

  const slots = [];
  for (let t = first; t <= last; t += SLOT_MINUTES) {
    const time = fromMinutes(t);
    const past = isToday && t <= nowMins;
    const free = working.find((b) => !isBooked(dateISO, b.id, time));
    slots.push({ time, past, barber: free ? free.id : null, available: !past && !!free });
  }
  return { status: slots.some((s) => s.available) ? 'open' : 'full', slots };
}

/* ------------------------------------------------------------------------ */
/* Step validity                                                             */
/* ------------------------------------------------------------------------ */

const VALIDATORS = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Enter your name.'),
  phone: (v) => (v.replace(/\D/g, '').length === 10 ? '' : 'Enter a 10-digit phone number.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter an email like you@example.com.'),
};

function isStepValid(step) {
  switch (step) {
    case 'service':
      return !!state.service;
    case 'barber':
      return !!state.barber;
    case 'time': {
      if (!state.date || !state.time) return false;
      const slot = slotsFor(state.date).slots.find((s) => s.time === state.time);
      return !!(slot && slot.available);
    }
    case 'details':
      return Object.keys(VALIDATORS).every((k) => !VALIDATORS[k](state.details[k]));
    default:
      return true;
  }
}

// Furthest step the user may be on: the first one that isn't complete
function furthestStep() {
  const i = STEPS.findIndex((s) => s !== 'confirm' && !isStepValid(s));
  return i === -1 ? STEPS.length - 1 : i;
}

/* ------------------------------------------------------------------------ */
/* Rendering: options                                                        */
/* ------------------------------------------------------------------------ */

const CHECK =
  '<span class="option__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>';

function renderServices() {
  const wrap = $('[data-service-options]');
  wrap.innerHTML = SERVICE_CATEGORIES.filter((c) => c.id !== 'addons')
    .map((cat) => {
      const items = SERVICES.filter((s) => s.category === cat.id && !s.addon);
      return `
        <div class="option-group" role="group" aria-labelledby="cat-${cat.id}">
          <h3 class="option-group__title" id="cat-${cat.id}">${esc(cat.label)}</h3>
          <div class="option-grid">
            ${items
              .map(
                (s) => `
              <label class="option">
                <input class="option__input" type="radio" name="service" value="${esc(s.id)}">
                <span class="option__body">
                  <span class="option__name">${esc(s.name)}</span>
                  <span class="option__desc">${esc(s.description)}</span>
                  <span class="option__meta">${s.minutes} min</span>
                </span>
                <span class="option__price">${esc(formatPrice(s.price))}</span>
                ${CHECK}
              </label>`,
              )
              .join('')}
          </div>
        </div>`;
    })
    .join('');

  $('[data-addon-options]').innerHTML = SERVICES.filter((s) => s.addon)
    .map(
      (s) => `
      <label class="option option--compact">
        <input class="option__input" type="checkbox" name="addons" value="${esc(s.id)}">
        <span class="option__body">
          <span class="option__name">${esc(s.name)}</span>
          <span class="option__meta">${s.minutes} min</span>
        </span>
        <span class="option__price option__price--small">${esc(formatPrice(s.price, true))}</span>
        ${CHECK}
      </label>`,
    )
    .join('');
}

function renderBarbers() {
  const anyCard = `
    <label class="option option--barber">
      <input class="option__input" type="radio" name="barber" value="${ANY}">
      <span class="option__avatar option__avatar--any" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>
      </span>
      <span class="option__body">
        <span class="option__name">First available</span>
        <span class="option__desc">We'll match you with whoever's free.</span>
      </span>
      ${CHECK}
    </label>`;
  $('[data-barber-options]').innerHTML =
    anyCard +
    BARBERS.map(
      (b) => `
      <label class="option option--barber">
        <input class="option__input" type="radio" name="barber" value="${esc(b.id)}">
        <img class="option__avatar" src="${esc(b.image)}" alt="" width="800" height="1000" loading="lazy" decoding="async">
        <span class="option__body">
          <span class="option__name">${esc(b.name)}</span>
          <span class="option__desc">${esc(b.specialties.join(', '))}</span>
          <span class="option__meta">Works ${esc(formatDays(b.days))}</span>
        </span>
        ${CHECK}
      </label>`,
    ).join('');
}

function renderDays() {
  const strip = $('[data-day-options]');
  strip.innerHTML = upcomingDays()
    .map((d) => {
      const iso = toISO(d);
      const { status } = slotsFor(iso);
      const disabled = status !== 'open';
      const tag = { closed: 'Closed', off: 'Off', full: 'Full' }[status] || '';
      const isToday = iso === toISO(new Date());
      return `
        <label class="day${disabled ? ' is-disabled' : ''}">
          <input class="option__input" type="radio" name="date" value="${iso}"${disabled ? ' disabled' : ''}${state.date === iso ? ' checked' : ''}>
          <span class="day__name">${isToday ? 'Today' : fmtWeekday.format(d)}</span>
          <span class="day__date">${fmtMonthDay.format(d)}</span>
          <span class="day__tag">${tag ? esc(tag) : '&nbsp;'}</span>
          <span class="sr-only">${tag ? `, ${tag.toLowerCase()}` : ''}</span>
        </label>`;
    })
    .join('');
}

function renderTimes() {
  const grid = $('[data-time-options]');
  const note = $('[data-time-note]');
  const legend = $('[data-time-legend]');
  if (!state.date) {
    grid.innerHTML = '';
    legend.textContent = 'Time';
    note.textContent = 'Pick a day to see open times.';
    return;
  }
  legend.textContent = `Times on ${fmtLong.format(fromISO(state.date))}`;
  const { slots } = slotsFor(state.date);
  grid.innerHTML = slots
    .map((s) => {
      const label = formatTime(s.time);
      const why = s.past ? 'past' : !s.barber ? 'booked' : '';
      return `
        <label class="slot${s.available ? '' : ' is-disabled'}">
          <input class="option__input" type="radio" name="time" value="${s.time}"${s.available ? '' : ' disabled'}${state.time === s.time ? ' checked' : ''}>
          <span class="slot__time">${label}</span>
          ${why ? `<span class="sr-only">, ${why}</span>` : ''}
        </label>`;
    })
    .join('');
  updateTimeNote();
}

function updateTimeNote() {
  const note = $('[data-time-note]');
  if (!state.date) return;
  if (!state.time) {
    note.textContent = 'Crossed-out times are already booked.';
  } else if (state.barber === ANY && state.assigned) {
    note.textContent = `You'll be with ${getBarber(state.assigned).firstName}.`;
  } else {
    note.textContent = '';
  }
}

/* ------------------------------------------------------------------------ */
/* Summary (desktop card + mobile bar)                                       */
/* ------------------------------------------------------------------------ */

function describe() {
  const service = state.service ? getService(state.service) : null;
  const barber =
    state.barber === ANY
      ? state.assigned
        ? `First available (${getBarber(state.assigned).firstName})`
        : 'First available'
      : state.barber
        ? getBarber(state.barber).name
        : null;
  const when = state.date && state.time ? `${fmtLong.format(fromISO(state.date))} at ${formatTime(state.time)}` : null;
  return {
    service: service ? service.name : null,
    addons: state.addons.map((id) => getService(id).name).join(', '),
    barber,
    when,
    price: formatPrice(totalPrice()),
    time: totalMinutes() ? formatDuration(totalMinutes()) : '',
  };
}

const lastSummary = {};
function updateSummary() {
  const d = describe();
  const values = {
    service: d.service || 'Not picked yet',
    addons: d.addons || 'None',
    barber: d.barber || 'Not picked yet',
    when: d.when || 'Not picked yet',
    price: d.price,
    time: d.time,
  };
  Object.entries(values).forEach(([key, value]) => {
    const el = $(`[data-sum="${key}"]`);
    if (!el) return;
    el.textContent = value;
    el.classList.toggle('is-empty', /Not picked|None/.test(value));
    if (lastSummary[key] !== undefined && lastSummary[key] !== value) {
      const row = el.closest('[data-sum-row]');
      if (row) flash(row);
    }
    lastSummary[key] = value;
  });
  $('[data-total-price]').textContent = d.price;
  $('[data-total-time]').textContent = d.time ? `· ${d.time}` : '';
}

function flash(el) {
  el.classList.remove('is-updated');
  void el.offsetWidth; // restart the animation
  el.classList.add('is-updated');
}

/* ------------------------------------------------------------------------ */
/* Review (confirm step + confirmation screen)                               */
/* ------------------------------------------------------------------------ */

function reviewRows({ editable }) {
  const d = describe();
  const rows = [
    ['service', 'Service', d.service + (d.addons ? ` + ${d.addons}` : '')],
    ['barber', 'Barber', d.barber],
    ['time', 'When', d.when],
    ['details', 'Contact', `${state.details.name}, ${state.details.phone}, ${state.details.email}`],
  ];
  if (state.details.notes.trim()) rows.push(['details', 'Notes', state.details.notes.trim()]);
  rows.push([null, 'Total', `${d.price} · ${d.time}`]);
  return rows
    .map(
      ([step, label, value]) => `
      <div class="review__row${step ? '' : ' review__row--total'}">
        <dt>${esc(label)}</dt>
        <dd>${esc(value || '')}</dd>
        ${
          editable && step
            ? `<button class="review__edit" type="button" data-goto="${step}">Edit<span class="sr-only"> ${esc(label.toLowerCase())}</span></button>`
            : ''
        }
      </div>`,
    )
    .join('');
}

/* ------------------------------------------------------------------------ */
/* Navigation between steps                                                  */
/* ------------------------------------------------------------------------ */

const stepEl = (name) => $(`[data-step="${name}"]`);

function updateChrome() {
  const index = STEPS.indexOf(state.step);
  $$('[data-progress-step]').forEach((li, i) => {
    li.classList.toggle('is-done', i < index);
    li.classList.toggle('is-current', i === index);
    if (i === index) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  });
  $('[data-progress-fill]').style.transform = `scaleX(${index / (STEPS.length - 1)})`;

  const next = $('[data-next]');
  const valid = isStepValid(state.step);
  next.disabled = !valid;
  next.textContent = state.step === 'confirm' ? 'Confirm booking' : 'Continue';
  $('[data-next-hint]').textContent = valid ? '' : STEP_HINTS[state.step];
  $('[data-back]').hidden = index === 0;
}

let transitioning = Promise.resolve();

function showStep(name, { direction = 1, focus = true } = {}) {
  const from = state.step;
  const outgoing = stepEl(from);
  const incoming = stepEl(name);
  state.step = name;

  if (name === 'time') {
    renderDays();
    autoPickDay();
    renderTimes();
  }
  if (name === 'confirm') $('[data-review]').innerHTML = reviewRows({ editable: true });
  updateChrome();

  const reveal = () => {
    $$('[data-step]').forEach((el) => (el.hidden = el !== incoming));
    if (focus) {
      const title = $('.book-step__title', incoming);
      title.focus({ preventScroll: true });
      const top = $('[data-flow]').getBoundingClientRect().top;
      if (top < 0) $('[data-flow]').scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  if (from === name || prefersReducedMotion() || !Element.prototype.animate) {
    reveal();
    return;
  }

  // Outgoing slides/fades away, incoming slides in from the other side
  transitioning = transitioning.then(() =>
    outgoing
      .animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-40 * direction}px)` }], {
        duration: 200,
        easing: 'ease-in',
      })
      .finished.catch(() => {})
      .then(() => {
        reveal();
        return incoming.animate(
          [
            { opacity: 0, transform: `translateX(${40 * direction}px)` },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        ).finished.catch(() => {});
      }),
  );
}

function stepUrl(name) {
  const url = new URL(window.location.href);
  url.searchParams.set('step', name);
  return url.pathname.split('/').pop() + url.search;
}

// How many step entries we've pushed (so Back never leaves the page)
const depth = () => (history.state && history.state.depth) || 0;

function goTo(name, { push = true } = {}) {
  if (name === state.step) return;
  const direction = STEPS.indexOf(name) > STEPS.indexOf(state.step) ? 1 : -1;
  if (push) history.pushState({ step: name, depth: depth() + 1 }, '', stepUrl(name));
  showStep(name, { direction });
}

function next() {
  if (!isStepValid(state.step)) return;
  if (state.step === 'confirm') {
    submitBooking();
    return;
  }
  goTo(STEPS[STEPS.indexOf(state.step) + 1]);
}

function back() {
  const index = STEPS.indexOf(state.step);
  if (index <= 0) return;
  if (depth() > 0) {
    history.back(); // popstate shows the previous step
  } else {
    const prev = STEPS[index - 1];
    history.replaceState({ step: prev, depth: 0 }, '', stepUrl(prev));
    showStep(prev, { direction: -1 });
  }
}

/* ------------------------------------------------------------------------ */
/* Selection handling                                                        */
/* ------------------------------------------------------------------------ */

function autoPickDay() {
  if (state.date && slotsFor(state.date).status === 'open') return;
  const firstOpen = upcomingDays().map(toISO).find((iso) => slotsFor(iso).status === 'open');
  state.date = firstOpen || null;
  state.time = null;
  state.assigned = null;
  renderDays();
}

// After service/barber changes, drop a date or time that no longer works
function revalidateTime() {
  if (!state.date) return;
  const { status, slots } = slotsFor(state.date);
  if (status !== 'open') {
    state.date = null;
    state.time = null;
    state.assigned = null;
    return;
  }
  const slot = slots.find((s) => s.time === state.time);
  if (!slot || !slot.available) {
    state.time = null;
    state.assigned = null;
  } else {
    state.assigned = slot.barber;
  }
}

function onChange(e) {
  const t = e.target;
  if (t.name === 'service') {
    state.service = t.value;
    revalidateTime();
  } else if (t.name === 'addons') {
    state.addons = $$('input[name="addons"]:checked').map((i) => i.value);
    revalidateTime();
  } else if (t.name === 'barber') {
    state.barber = t.value;
    revalidateTime();
  } else if (t.name === 'date') {
    state.date = t.value;
    state.time = null;
    state.assigned = null;
    renderTimes();
  } else if (t.name === 'time') {
    state.time = t.value;
    const slot = slotsFor(state.date).slots.find((s) => s.time === t.value);
    state.assigned = slot ? slot.barber : null;
    updateTimeNote();
  }
  updateSummary();
  updateChrome();
  saveDraft();
}

/* ------------------------------------------------------------------------ */
/* Details: validation + phone formatting                                    */
/* ------------------------------------------------------------------------ */

function formatPhone(digits) {
  const d = digits.slice(0, 10);
  if (d.length === 0) return '';
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function showError(field, message) {
  const wrap = $(`[data-field="${field}"]`);
  const input = $('input, textarea', wrap);
  const error = $('[data-error]', wrap);
  wrap.classList.toggle('has-error', !!message);
  input.setAttribute('aria-invalid', String(!!message));
  error.textContent = message;
}

function initDetails() {
  const touched = new Set();
  const phone = $('#f-phone');
  let lastDigits = '';

  phone.addEventListener('input', (e) => {
    let digits = phone.value.replace(/\D/g, '');
    // Keep a leading US country code from autofill out of the 10 digits
    if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
    // Backspacing over a ")" or "-" should remove the digit before it
    if (e.inputType === 'deleteContentBackward' && digits === lastDigits) digits = digits.slice(0, -1);
    lastDigits = digits.slice(0, 10);
    phone.value = formatPhone(digits);
  });

  ['name', 'phone', 'email', 'notes'].forEach((field) => {
    const input = $(`[data-field="${field}"] .field__input`);
    const sync = () => {
      state.details[field] = input.value;
      if (VALIDATORS[field] && touched.has(field)) showError(field, VALIDATORS[field](input.value));
      updateChrome();
      saveDraft();
    };
    input.addEventListener('input', sync);
    input.addEventListener('blur', () => {
      if (!VALIDATORS[field]) return;
      if (input.value.trim() || touched.has(field)) {
        touched.add(field);
        showError(field, VALIDATORS[field](input.value));
      }
    });
  });
}

/* ------------------------------------------------------------------------ */
/* Mobile summary sheet                                                      */
/* ------------------------------------------------------------------------ */

function initSummaryToggle() {
  const toggle = $('[data-summary-toggle]');
  const summary = $('[data-summary]');
  const close = $('[data-summary-close]');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    summary.classList.toggle('is-open', open);
    if (open) close.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  close.addEventListener('click', () => {
    setOpen(false);
    toggle.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && summary.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });
}

/* ------------------------------------------------------------------------ */
/* Submit + confirmation                                                     */
/* ------------------------------------------------------------------------ */

function submitBooking() {
  // Demo only: no booking is sent anywhere, the confirmation is shown locally.
  showConfirmation();
}

function showConfirmation() {
  state.booked = true;
  clearDraft();
  history.replaceState({ step: 'done' }, '', stepUrl('done'));

  const first = state.details.name.trim().split(/\s+/)[0];
  $('[data-confirm-title]').textContent = `You're booked, ${first}.`;
  $('[data-confirm-summary]').innerHTML = reviewRows({ editable: false });

  $('[data-flow]').hidden = true;
  const conf = $('[data-confirmation]');
  conf.hidden = false;
  conf.scrollIntoView({ block: 'start', behavior: 'auto' });
  window.scrollBy(0, -120);
  $('[data-confirm-title]').focus({ preventScroll: true });

  if (!prefersReducedMotion()) {
    conf.classList.add('is-animating');
    burst($('[data-burst]'));
  }
}

// A short burst of palm leaves and stars, then gone
function burst(host) {
  const pieces = 22;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < pieces; i++) {
    const el = document.createElement('span');
    const leaf = i % 3 !== 0;
    el.className = `burst__piece ${leaf ? 'burst__piece--leaf' : 'burst__piece--star'}`;
    const angle = (i / pieces) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 90 + Math.random() * 80;
    el.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--y', `${Math.sin(angle) * dist}px`);
    el.style.setProperty('--r', `${Math.round((Math.random() - 0.5) * 540)}deg`);
    el.style.setProperty('--s', (0.7 + Math.random() * 0.6).toFixed(2));
    el.style.setProperty('--d', `${Math.round(650 + Math.random() * 120)}ms`);
    frag.append(el);
  }
  host.append(frag);
  setTimeout(() => (host.textContent = ''), 2200);
}

// .ics download, built on the client
function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function downloadIcs() {
  const d = describe();
  const start = state.date.replace(/-/g, '') + 'T' + state.time.replace(':', '') + '00';
  const endMins = toMinutes(state.time) + totalMinutes();
  const end = state.date.replace(/-/g, '') + 'T' + fromMinutes(endMins).replace(':', '') + '00';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const barber = state.barber === ANY ? getBarber(state.assigned) : getBarber(state.barber);
  const { street, city, state: st, zip } = SHOP.address;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Palm & Blade//Demo booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@palmandblade.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsEscape(`${d.service} with ${barber.firstName} at ${SHOP.name}`)}`,
    `LOCATION:${icsEscape(`${street}, ${city}, ${st} ${zip}`)}`,
    `DESCRIPTION:${icsEscape(`${d.service}${d.addons ? ` + ${d.addons}` : ''}. ${d.price}, ${d.time}. Demo site: no real appointment was made.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'palm-and-blade-appointment.ics';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------------ */
/* Draft persistence (survives a reload mid-flow; per tab only)              */
/* ------------------------------------------------------------------------ */

const DRAFT_KEY = 'pb-booking-draft';

function saveDraft() {
  try {
    const { service, addons, barber, date, time, details } = state;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ service, addons, barber, date, time, details }));
  } catch {
    /* storage unavailable: the flow still works, it just won't survive a reload */
  }
}

function loadDraft() {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    if (!d) return;
    if (d.service && getService(d.service) && !getService(d.service).addon) state.service = d.service;
    if (Array.isArray(d.addons)) state.addons = d.addons.filter((id) => getService(id)?.addon);
    if (d.barber && (d.barber === ANY || getBarber(d.barber))) state.barber = d.barber;
    if (typeof d.date === 'string') state.date = d.date;
    if (typeof d.time === 'string') state.time = d.time;
    if (d.details) Object.keys(state.details).forEach((k) => (state.details[k] = String(d.details[k] || '')));
  } catch {
    /* ignore a corrupt or blocked draft */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}

/* ------------------------------------------------------------------------ */
/* Boot                                                                      */
/* ------------------------------------------------------------------------ */

function preselect() {
  const params = new URLSearchParams(window.location.search);
  const sid = params.get('service');
  const s = sid && getService(sid);
  if (s && s.addon) state.addons = [...new Set([...state.addons, s.id])];
  else if (s) state.service = s.id;

  const bid = params.get('barber');
  if (bid && (getBarber(bid) || bid === ANY)) state.barber = bid;

  $$('input[name="service"]').forEach((i) => (i.checked = i.value === state.service));
  $$('input[name="addons"]').forEach((i) => (i.checked = state.addons.includes(i.value)));
  $$('input[name="barber"]').forEach((i) => (i.checked = i.value === state.barber));
  Object.entries(state.details).forEach(([k, v]) => {
    const input = $(`[data-field="${k}"] .field__input`);
    if (input) input.value = v;
  });
  revalidateTime();
}

function stepFromUrl() {
  const requested = new URLSearchParams(window.location.search).get('step');
  const i = STEPS.indexOf(requested);
  // Never land past the first incomplete step (e.g. after a reload)
  return STEPS[Math.max(0, Math.min(i === -1 ? 0 : i, furthestStep()))];
}

function init() {
  const flow = $('[data-flow]');
  if (!flow) return;
  flow.hidden = false;

  renderServices();
  renderBarbers();
  loadDraft();
  preselect();

  const form = $('[data-booking-form]');
  form.addEventListener('change', onChange);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    next();
  });
  $('[data-back]').addEventListener('click', back);
  $('[data-review]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-goto]');
    if (btn) goTo(btn.dataset.goto);
  });
  $('[data-ics]').addEventListener('click', downloadIcs);

  initDetails();
  initSummaryToggle();

  // Browser back/forward moves between steps instead of leaving the page
  window.addEventListener('popstate', () => {
    if (state.booked) return;
    const target = stepFromUrl();
    showStep(target, { direction: STEPS.indexOf(target) < STEPS.indexOf(state.step) ? -1 : 1 });
  });

  const initial = stepFromUrl();
  history.replaceState({ step: initial, depth: 0 }, '', stepUrl(initial));
  state.step = initial;
  showStep(initial, { focus: false });
  $$('[data-step]').forEach((el) => (el.hidden = el !== stepEl(initial)));
  updateSummary();
  updateChrome();
}

init();
