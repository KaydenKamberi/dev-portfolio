/* Kayden Kamberi – portfolio
   Mobile menu, theme toggle, lazy live previews. */
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

  /* ---------- Copy email address ----------
     Email links only work if the visitor has an email app set up,
     so this gives everyone a way to grab the address. */
  var copyBtn = document.querySelector(".copy-btn");
  var copyStatus = document.querySelector(".copy-status");

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return ok ? Promise.resolve() : Promise.reject();
  }

  if (copyBtn) {
    copyBtn.hidden = false;
    var resetTimer;
    copyBtn.addEventListener("click", function () {
      var text = copyBtn.getAttribute("data-copy");
      var copy = navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); })
        : fallbackCopy(text);
      copy.then(function () {
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("is-copied");
        if (copyStatus) copyStatus.textContent = "Email address copied";
      }, function () {
        // Copy blocked: select the address so the visitor can copy it by hand
        var link = document.querySelector(".contact-email");
        if (link && window.getSelection) {
          var range = document.createRange();
          range.selectNodeContents(link);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        copyBtn.textContent = "Press Ctrl+C";
      });
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("is-copied");
        if (copyStatus) copyStatus.textContent = "";
      }, 2000);
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
