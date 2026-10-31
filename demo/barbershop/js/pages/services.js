import { SERVICES, SERVICE_CATEGORIES, FAQ, formatPrice } from '../data.js';

// Jump links scroll natively (smooth via base.css, instant with reduced motion);
// the sticky offset comes from scroll-margin-top in services.css.

// Render service menu
function renderServicesMenu() {
  const container = document.querySelector('[data-services-menu]');
  if (!container) return;

  const html = SERVICE_CATEGORIES.map(
    (category) => `
      <section class="services-menu__category" id="${category.id}">
        <h2>${category.label}</h2>
        <div class="services-menu__items">
          ${SERVICES
            .filter((s) => s.category === category.id)
            .map(
              (service) => `
                <article class="services-menu__item">
                  <div class="services-menu__row">
                    <span class="services-menu__name">${service.name}</span>
                    <span class="services-menu__leader"></span>
                    <span class="services-menu__price">${formatPrice(service.price, service.addon)}</span>
                  </div>
                  <div class="services-menu__meta">
                    <span class="chip services-menu__duration">${service.minutes} min</span>
                    <a class="services-menu__book" href="book.html?service=${service.id}">Book this</a>
                  </div>
                  ${service.description ? `<p class="services-menu__description">${service.description}</p>` : ''}
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `
  ).join('');

  container.innerHTML = html;
}

// Render FAQ
function renderFAQ() {
  const container = document.querySelector('[data-services-faq]');
  if (!container) return;

  const html = FAQ.map(
    (item) => `
      <details class="accordion services-faq__item">
        <summary class="accordion__summary">
          <span class="accordion__title">${item.q}</span>
        </summary>
        <div class="accordion__content">
          <p>${item.a}</p>
        </div>
      </details>
    `
  ).join('');

  container.innerHTML = html;
}

// Initialize
renderServicesMenu();
renderFAQ();
