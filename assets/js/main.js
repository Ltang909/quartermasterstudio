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

  // Active nav link
  function navInit() {
    var path = window.location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll(".nav-links a[data-nav]").forEach(function (a) {
      var key = a.getAttribute("data-nav");
      if ((key === "home" && (path === "/" || path === "/index.html")) ||
          (key !== "home" && path.indexOf("/" + key) === 0)) {
        a.classList.add("active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    revealInit();
    yearInit();
    navInit();
  });
})();
