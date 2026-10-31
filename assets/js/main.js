/* Kayden Kamberi – portfolio
   Mobile menu, lazy live previews. */
(function () {
  "use strict";

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

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
