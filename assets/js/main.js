/* Quartermaster Studio - shared behaviours */
(function () {
  "use strict";

  // Reveal on scroll
  var io = null;
  function revealInit() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  // Footer year
  function yearInit() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  // Active nav link (desktop + mobile menu)
  function navInit() {
    var path = window.location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll(".nav-links a[data-nav], .mobile-menu a[data-nav]").forEach(function (a) {
      var key = a.getAttribute("data-nav");
      if ((key === "home" && (path === "/" || path === "/index.html")) ||
          (key !== "home" && path.indexOf("/" + key) === 0)) {
        a.classList.add("active");
      }
    });
  }

  // Mobile hamburger menu
  function navToggleInit() {
    var btn = document.querySelector(".nav-toggle");
    var menu = document.getElementById("mobileMenu");
    if (!btn || !menu) return;
    function set(open) {
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    btn.addEventListener("click", function () {
      set(!menu.classList.contains("open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { set(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") set(false);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    revealInit();
    yearInit();
    navInit();
    navToggleInit();
  });
})();
