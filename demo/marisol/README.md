# Marisol — Coastal Kitchen & Bar

A four-page marketing site for a fictional Baja-inspired seafood restaurant with
three San Diego locations. Built as a portfolio demonstration piece.

Static HTML and CSS with about 170 lines of JavaScript. No build step, no
bundler, no npm, no dependencies to install.

---

## Running it

Open `index.html` directly in a browser, or serve the folder:

```
python3 -m http.server 8000
```

### Deploying to GitHub Pages

Settings → Pages → Deploy from a branch → pick the branch, folder `/ (root)`.
Nothing else to configure. A `.nojekyll` file is included so Pages serves the
files verbatim instead of running them through Jekyll.

---

## Structure

```
index.html          Home — tile hero, intro, signature dishes, locations strip
menu.html           Full menu, seven sections
locations.html      Three locations, hours, table request form
about.html          Origin story and chef bio
assets/
  css/custom.css    Design tokens, base, components, page styles, print
  js/main.js        Mobile nav toggle; form validation and fake-submit
  images/           Empty — see "Images" below
.nojekyll           Tells GitHub Pages to skip Jekyll processing
```

The header and footer markup is byte-identical across all four pages, apart
from `aria-current="page"` on the active nav link. If you change one, change all
four.

---

## Design system

Everything lives as custom properties at the top of `assets/css/custom.css`.
Tailwind is loaded from its CDN in each page's `<head>` and configured inline to
read those same custom properties, so colour has a single source of truth.

### Palette

Warm, sunlit and soft. Cream ground, deep Pacific teal for large flat blocks,
one coral for action.

| Token | Hex | Role |
|---|---|---|
| `--shell` | `#FDF6EE` | Warm cream — the page ground, everywhere |
| `--sea` | `#0B6E7F` | Deep Pacific teal — large flat colour blocks |
| `--surf` | `#7FD1CC` | Pale turquoise — washes, hovers, secondary type on teal |
| `--coral` | `#FF6A4D` | Sunset coral — fills only |
| `--deep` | `#08333D` | Darkest teal — footer |
| `--ink` | `#16292F` | Body text |

Three further tokens exist because the six above cannot cover every job at an
accessible contrast:

| Token | Hex | Why it exists |
|---|---|---|
| `--coral-ink` | `#D03818` | Same hue as `--coral` (10°) but dark enough to be text or a thin line on cream. `#FF6A4D` on `#FDF6EE` is **2.64:1** and fails even the 3:1 floor for non-text. |
| `--line` | `#E4D6C6` | A warm hairline for rules and borders. |
| `--muted` | `#55686D` | Secondary body text on cream, 5.46:1. |

`--surf` on `--sea` is 3.35:1, so it is only ever used at display sizes — the
hero's "Coastal Kitchen & Bar" line and nothing smaller.

There is no pure white and no pure black anywhere on screen.

### Type

**Fraunces** for display at 600 and 900, with optical sizing on and
`font-variation-settings: "SOFT" 40, "WONK" 1`. **DM Sans** at 400 and 500 for
everything else. Both from Google Fonts.

Five sizes and no others:

```
hero    Fraunces 900   clamp(3.5rem, 9vw, 7rem)      line-height 0.95, tracking -0.03em
h2      Fraunces 900   clamp(2.25rem, 5vw, 3.75rem)  line-height 1
h3      Fraunces 600   1.5rem
body    DM Sans 400    1.125rem                      line-height 1.65
small   DM Sans 500    0.875rem
```

The older `--step-*` names are kept as aliases onto those five, so no rule can
quietly invent an in-between size. Sentence case on headings; no all-caps.

### Shape

Softness carries the design more than the palette does.

- **Arched photographs.** Every image on the site is masked with
  `border-radius: 50% 50% 14px 14px / 30% 30% 14px 14px`.
- **Pill buttons.** `border-radius: 999px`, 200ms both ways. Primary is a coral
  fill; secondary is a coral-ink outline that fills coral on hover.
- **Wave dividers.** An inline scalloped SVG, 26px tall, `preserveAspectRatio:
  none`, filled to match the section it is leaving. `.wave-flip` turns it over
  for a cream-to-teal boundary.
- **Blocks** get `14px`. **No box-shadow anywhere** except the header once it
  sticks.
- The header sits on cream with no rule, and gains a soft shadow and backdrop
  blur only after the page has scrolled past 100px.

### Motion

Deliberately sparse. One `IntersectionObserver` adds `.in-view` and never
removes it.

- Section headings, the hero block (on load rather than scroll), menu section
  groups staggered 60ms and capped at six, and location cards staggered 80ms.
- Nothing else: not nav, footer, buttons, body copy or individual menu rows.
- Nav links grow a coral underline from the left. The menu page's section tabs
  have an underline that slides between them, driven by scroll position.
- The hero photograph scales 1.0 to 1.04 over 20 seconds, barely perceptibly.

`.reveal` only hides anything once the script has run, so a blocked or failed
script leaves every page fully visible rather than blank. Under
`prefers-reduced-motion: reduce` every transition and animation is flattened and
all revealed content is shown immediately.

## Images

Real photography lives in `assets/images/`, named `<role>-<subject>.jpg` — all
lowercase, no spaces, so nothing needs URL encoding and nothing breaks on a
case-sensitive server.

```
hero.jpg                 480x640     37.6 KB
location-la-jolla.jpg    800x1000   128.7 KB
location-north-park.jpg  800x1000   157.5 KB
location-coronado.jpg    800x1000   129.1 KB
about-origin.jpg         738x414     33.3 KB
about-wood-fire.jpg      515x388     38.2 KB
about-owner.jpg          389x280      6.6 KB   not referenced — see below
dish-ceviche-verde.jpg   148x148      7.5 KB
dish-baja-fish-taco.jpg  554x554     39.0 KB
dish-branzino.jpg        452x678     90.4 KB
dish-camarones.jpg       452x678     61.1 KB
```

Total 729 KB, down from 8.0 MB of unoptimised source. The three location files
arrived as landscape PNGs and were converted to JPEG and cropped to 4:5
portrait; everything else was already smaller than its target, so it was left
at native size rather than upscaled.

Every `<img>` carries explicit `width` and `height` matching the file on disk,
so nothing reflows while loading, plus `decoding="async"` and `loading="lazy"`
on everything except the hero.

### Two images need attention

- **`about-owner.jpg` is not used anywhere.** It carries a visible Shutterstock
  watermark (`shutterstock.com · 2183015259`), so it is an unlicensed comp.
  Wiring it in would publish a watermarked stock image. Drop a licensed copy in
  at the same path and add the figure back to the chef section in `about.html`.
- **`location-north-park.jpg`** loses the leading M of the painted MARISOL
  awning under the arch mask. The sign runs off the top-left of the source
  frame, so no crop of this file keeps the whole word: it needs a frame with
  more headroom above the awning.

### Replacing a photo

Drop the new file in at the same path, then update the `width` and `height`
attributes to the new dimensions. Images are cropped with `object-fit: cover`,
so a different aspect ratio still fills its slot — but the arch mask cuts into
the top third, so keep faces and signage out of the top-left and top-right
corners.

## The reservation form is non-functional by design

The form on `locations.html` validates in the browser and then swaps itself for a
confirmation panel. **It does not submit anywhere.** There is no endpoint, no
email handler and no network request — nothing typed into it leaves the browser,
and the confirmation panel says so in plain language.

This is deliberate, not an oversight. Wiring it to a real service (Formspree,
Netlify Forms, or your own backend) is a next step: point the `<form>` at an
action URL, remove the `event.preventDefault()` in `assets/js/main.js`, and keep
the existing validation as a first pass.

---

## Accessibility

Checked in Chromium rather than assumed:

- Colour contrast passes AA across header, main content and footer on all four
  pages, measured against actually painted backdrops. Two places deviate from
  the redesign spec to achieve this; both are noted in the palette table above.
- Every focusable element has a visible focus ring of at least 3:1 against
  whatever it sits on. The ring flips from chile to white inside cobalt and ink
  fields.
- All interactive targets are at least 24×24 CSS pixels.
- One `h1` per page, no skipped heading levels, one `main`/`header`/`footer`
  landmark per page, labelled navigation.
- Every image has descriptive alt text and explicit dimensions.
- The current page is signalled by a coral underline as well as colour, plus
  `aria-current="page"`.
- A skip link is the first tab stop.
- `prefers-reduced-motion` flattens every transition and disables smooth scroll.
- No horizontal scrolling from 320px upward, and none at 200% text-only zoom.
- Form errors are announced by moving focus to a summary that links to each
  offending field; each field also carries an inline message and `aria-invalid`.

## Browser support

Modern evergreen browsers. The layout uses CSS grid, custom properties,
`clamp()`, `aspect-ratio`, `object-fit`, `IntersectionObserver` and
`backdrop-filter`. The Tailwind config is guarded on
`window.tailwind`, so if the CDN is blocked or unreachable the page falls back to
`custom.css` cleanly rather than throwing.

## Printing

`custom.css` includes a print block. The menu prints to about three pages: no
navigation, no footer, no colour fields, black on white, with sections kept from
splitting across page breaks.

---

## Content note

Marisol is not a real restaurant. The addresses, phone numbers, email address,
staff, history and photographs are invented for this demonstration. The phone
numbers use the 555-01xx range reserved for fictional use. The footer says so
too, so the site cannot be mistaken for a real business.
