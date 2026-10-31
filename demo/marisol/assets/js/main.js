/* ==========================================================================
   Marisol — Coastal Kitchen & Bar
   Two jobs only: the mobile navigation panel, and the reservation form's
   client-side validation plus its fake-submit confirmation state.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ------------------------------------------------------------------
     Reveal on scroll

     The .reveal class only hides anything once this script has run, so a
     blocked or failed script leaves the content visible rather than blank.
     ------------------------------------------------------------------ */

  var revealables = document.querySelectorAll(".reveal");

  if (revealables.length && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");

    var show = function (el) { el.classList.add("in-view"); };

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });

    Array.prototype.forEach.call(revealables, function (el) {
      // The hero fires on load rather than waiting for a scroll it may never get.
      if (el.hasAttribute("data-reveal-now") || reduceMotion) {
        show(el);
      } else {
        revealObserver.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------
     Header shadow once the page has moved past 100px
     ------------------------------------------------------------------ */

  var sentinel = document.querySelector("[data-header-sentinel]");
  var header = document.querySelector(".site-header");

  if (sentinel && header && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */

  var navToggle = document.querySelector("[data-nav-toggle]");
  var navPanel = document.getElementById("site-nav");

  if (navToggle && navPanel) {
    var setNav = function (open) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navPanel.classList.toggle("is-open", open);
    };

    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });

    // Escape closes the panel and returns focus to the button that opened it.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        navToggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Menu section tabs

     The underline slides between tabs instead of jumping. Which tab is
     active comes from whichever menu section is nearest the top of the
     viewport, so it tracks scrolling as well as clicks.
     ------------------------------------------------------------------ */

  var tablist = document.querySelector("[data-tablist]");
  var underline = document.querySelector("[data-tab-underline]");

  if (tablist && underline) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("a"));

    var moveTo = function (tab) {
      if (!tab) { return; }
      tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
      underline.style.width = tab.offsetWidth + "px";
      underline.style.transform = "translateX(" + tab.offsetLeft + "px)";
    };

    var current = function () {
      return tabs.filter(function (t) { return t.classList.contains("is-active"); })[0];
    };

    if ("IntersectionObserver" in window) {
      var sections = Array.prototype.slice.call(
        document.querySelectorAll(".menu-section")
      );

      /* Pick the last section whose top has passed a line a third of the way
         down the viewport. Choosing the first *visible* section instead put
         the underline on whichever group happened to be highest on screen,
         which lands on the wrong tab mid-scroll. */
      var syncFromScroll = function () {
        var line = window.innerHeight / 3;
        var currentId = sections.length ? sections[0].id : null;

        sections.forEach(function (section) {
          if (section.getBoundingClientRect().top <= line) {
            currentId = section.id;
          }
        });

        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].getAttribute("href").slice(1) === currentId) {
            moveTo(tabs[i]);
            return;
          }
        }
      };

      var ticking = false;
      var onScroll = function () {
        if (ticking) { return; }
        ticking = true;
        window.requestAnimationFrame(function () {
          syncFromScroll();
          ticking = false;
        });
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      syncFromScroll();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { moveTo(tab); });
    });

    moveTo(tabs[0]);
    window.addEventListener("resize", function () { moveTo(current() || tabs[0]); });
  }

  /* ------------------------------------------------------------------
     Reservation form

     Non-functional by design: nothing is sent anywhere. The form validates
     in the browser and swaps itself for a confirmation panel.
     ------------------------------------------------------------------ */

  var form = document.querySelector("[data-reservation-form]");

  if (!form) {
    return;
  }

  var confirmation = document.querySelector("[data-reservation-confirmation]");
  var errorSummary = form.querySelector("[data-error-summary]");
  var errorList = form.querySelector("[data-error-list]");

  var fieldLabel = function (field) {
    var label = form.querySelector('label[for="' + field.id + '"]');
    return label ? label.textContent.replace(/\s*\(.*$/, "").trim() : field.name;
  };

  var messageFor = function (field) {
    var v = field.validity;
    var name = fieldLabel(field).toLowerCase();

    if (v.valueMissing) {
      if (field.tagName === "SELECT") {
        return "Choose a " + name + ".";
      }
      return "Enter " + (field.id === "email" ? "an" : "a") + " " + name + ".";
    }
    if (v.typeMismatch && field.type === "email") {
      return "Enter an email address with an @ in it.";
    }
    if (v.rangeUnderflow || v.rangeOverflow) {
      return "Party size must be between 1 and 12. For larger groups, call the location directly.";
    }
    if (v.tooShort) {
      return "That " + name + " looks too short.";
    }
    return "Check the " + name + " field.";
  };

  var showFieldError = function (field, message) {
    var slot = document.getElementById(field.id + "-error");
    field.setAttribute("aria-invalid", "true");
    if (slot) {
      slot.textContent = message;
      slot.hidden = false;
    }
  };

  var clearFieldError = function (field) {
    var slot = document.getElementById(field.id + "-error");
    field.removeAttribute("aria-invalid");
    if (slot) {
      slot.textContent = "";
      slot.hidden = true;
    }
  };

  var fields = Array.prototype.slice.call(
    form.querySelectorAll("input, select, textarea")
  );

  // Clear a field's error as soon as the visitor fixes it.
  fields.forEach(function (field) {
    var settle = function () {
      if (field.getAttribute("aria-invalid") === "true" && field.checkValidity()) {
        clearFieldError(field);
      }
    };
    field.addEventListener("input", settle);
    field.addEventListener("change", settle);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var invalid = [];

    fields.forEach(function (field) {
      clearFieldError(field);
      if (!field.checkValidity()) {
        invalid.push(field);
      }
    });

    if (invalid.length) {
      if (errorList) {
        errorList.innerHTML = "";
        invalid.forEach(function (field) {
          var message = messageFor(field);
          showFieldError(field, message);

          var item = document.createElement("li");
          var link = document.createElement("a");
          link.href = "#" + field.id;
          link.textContent = message;
          link.addEventListener("click", function (e) {
            e.preventDefault();
            field.focus();
          });
          item.appendChild(link);
          errorList.appendChild(item);
        });
      }

      if (errorSummary) {
        errorSummary.hidden = false;
        errorSummary.focus();
      }
      return;
    }

    if (errorSummary) {
      errorSummary.hidden = true;
    }

    if (confirmation) {
      var nameField = form.querySelector("#name");
      var slot = confirmation.querySelector("[data-confirmation-name]");
      if (slot && nameField) {
        slot.textContent = nameField.value.trim().split(/\s+/)[0];
      }

      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
    }
  });
})();
