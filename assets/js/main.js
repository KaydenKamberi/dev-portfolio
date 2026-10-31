/* Kayden Kamberi – portfolio
   Mobile menu, theme toggle, lazy live previews, contact form. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navList = document.getElementById("nav-list");

  function closeNav() {
    navToggle.setAttribute("aria-expanded", "false");
    navList.classList.remove("is-open");
  }

  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navList.classList.toggle("is-open", !open);
    });
    navList.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.querySelector(".theme-toggle");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return prefersDark && prefersDark.matches ? "dark" : "light";
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- Live previews ----------
     Each iframe renders the demo at desktop width, then gets scaled to fit
     its card. The src is only set when the card nears the viewport. */
  var frames = Array.prototype.slice.call(document.querySelectorAll(".preview-frame"));

  function fit(frame) {
    var iframe = frame.querySelector("iframe");
    if (!iframe) return;
    var virtualWidth = parseFloat(getComputedStyle(frame).getPropertyValue("--vw")) || 1280;
    var scale = frame.clientWidth / virtualWidth;
    if (!scale) return;
    iframe.style.width = virtualWidth + "px";
    iframe.style.height = Math.ceil(frame.clientHeight / scale) + "px";
    iframe.style.setProperty("--scale", scale);
  }

  function load(frame) {
    var iframe = frame.querySelector("iframe");
    if (!iframe || iframe.src) return;
    iframe.addEventListener("load", function () { iframe.classList.add("is-loaded"); }, { once: true });
    iframe.src = iframe.getAttribute("data-src");
  }

  frames.forEach(fit);

  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) { fit(entry.target); });
    });
    frames.forEach(function (f) { ro.observe(f); });
  } else {
    window.addEventListener("resize", function () { frames.forEach(fit); });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          load(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "300px 0px" });
    frames.forEach(function (f) { io.observe(f); });
  } else {
    frames.forEach(load);
  }

  /* ---------- Contact form (Formspree) ---------- */
  var form = document.querySelector(".contact-form");

  if (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector('button[type="submit"]');

    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = "form-status" + (type ? " is-" + type : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Basic checks before sending
      var firstBad = null;
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (el) {
        var ok = el.value.trim() !== "" && (el.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) {
        setStatus("Please fill in your name, a valid email and a few project details.", "error");
        firstBad.focus();
        return;
      }

      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        setStatus("The form isn't connected yet. Please email kaydenkamberi45@gmail.com directly.", "error");
        return;
      }

      submit.disabled = true;
      setStatus("Sending…");

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          setStatus("Thanks! Your message is on its way. I'll get back to you soon.", "success");
        })
        .catch(function () {
          setStatus("Something went wrong. Please email kaydenkamberi45@gmail.com instead.", "error");
        })
        .then(function () { submit.disabled = false; });
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
