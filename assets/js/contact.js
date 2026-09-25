/* Quartermaster Studio - inquiry form.
   Set STUDIO_EMAIL to the studio's inbox to enable the "Open in email" button.
   Until then, visitors copy the brief and send it manually. */
(function () {
  "use strict";

  var STUDIO_EMAIL = "info@quartermaster.studio";

  function field(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function buildBrief() {
    var lines = [];
    lines.push("PROJECT INQUIRY - Quartermaster Studio");
    lines.push("=====================================");
    lines.push("Name: " + (field("f-name") || "-"));
    lines.push("Work email: " + (field("f-email") || "-"));
    lines.push("Company: " + (field("f-company") || "-"));
    lines.push("Planning: " + (field("f-type") || "-"));
    lines.push("Target date: " + (field("f-date") || "-"));
    lines.push("Guest count: " + (field("f-guests") || "-"));
    lines.push("");
    lines.push("What we should know:");
    lines.push(field("f-msg") || "-");
    return lines.join("\n");
  }

  function saveInquiry() {
    try {
      var key = "qm_inquiries";
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      list.unshift({
        name: field("f-name"),
        email: field("f-email"),
        company: field("f-company"),
        type: field("f-type"),
        date: field("f-date"),
        guests: field("f-guests"),
        message: field("f-msg"),
        at: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
    } catch (e) { /* storage unavailable; the brief still works */ }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("inquiry-form");
    if (!form) return;

    var result = document.getElementById("inquiry-result");
    var briefText = document.getElementById("brief-text");
    var copyBtn = document.getElementById("copy-brief");
    var mailtoBtn = document.getElementById("mailto-brief");
    var copyNote = document.getElementById("copy-note");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = field("f-name");
      var email = field("f-email");
      if (!name || !email || email.indexOf("@") < 0) {
        alert("Please add your name and a valid work email so we can reply.");
        return;
      }
      var brief = buildBrief();
      briefText.textContent = brief;
      saveInquiry();
      result.classList.add("show");
      copyNote.style.display = "none";
      if (STUDIO_EMAIL) {
        mailtoBtn.style.display = "";
        mailtoBtn.href = "mailto:" + STUDIO_EMAIL +
          "?subject=" + encodeURIComponent("Project inquiry from " + name) +
          "&body=" + encodeURIComponent(brief);
      } else {
        mailtoBtn.style.display = "none";
      }
      form.style.display = "none";
      revealBooking(name);
    });

    copyBtn.addEventListener("click", function () {
      var done = function () { copyNote.style.display = "block"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(briefText.textContent).then(done, function () {
          fallbackCopy(done);
        });
      } else {
        fallbackCopy(done);
      }
    });

    function fallbackCopy(done) {
      var ta = document.createElement("textarea");
      ta.value = briefText.textContent;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      done();
    }

    /* Two-step flow: the calendar booking reveals only after the brief is submitted. */
    var book = document.getElementById("book");
    var bookConfirm = document.getElementById("book-confirm");
    var calendlySlot = document.getElementById("calendly-slot");
    var calendlyInit = false;
    if (book) book.hidden = true;

    function initCalendly() {
      if (calendlyInit || !calendlySlot) return;
      calendlyInit = true;
      calendlySlot.innerHTML = "";
      var tries = 0;
      (function attempt() {
        if (window.Calendly && window.Calendly.initInlineWidget) {
          window.Calendly.initInlineWidget({
            url: "https://calendly.com/ltang9090/30min",
            parentElement: calendlySlot
          });
        } else if (tries++ < 20) {
          setTimeout(attempt, 300);
        } else {
          calendlySlot.innerHTML = '<p><a class="card-link" href="https://calendly.com/ltang9090/30min">Book directly on Calendly</a></p>';
        }
      })();
    }

    function revealBooking(name) {
      if (!book) return;
      book.hidden = false;
      if (bookConfirm) {
        bookConfirm.textContent = "Brief received" + (name ? ", " + name : "") + ". Now lock in your 30 minutes.";
        bookConfirm.hidden = false;
      }
      initCalendly();
      setTimeout(function () { book.scrollIntoView({ behavior: "smooth" }); }, 80);
    }

    function backToForm() {
      if (book) book.hidden = true;
      result.classList.remove("show");
      form.style.display = "";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    var edit1 = document.getElementById("edit-details");
    if (edit1) edit1.addEventListener("click", function (ev) { ev.preventDefault(); backToForm(); });
    var edit2 = document.getElementById("edit-details-2");
    if (edit2) edit2.addEventListener("click", function (ev) { ev.preventDefault(); backToForm(); });
  });
})();
