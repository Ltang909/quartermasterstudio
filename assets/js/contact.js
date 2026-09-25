/* Quartermaster Studio - inquiry form (step 1 of 2).
   Submitting saves the inquiry locally (the client portal reads it)
   and reveals the calendar booking with name + email prefilled. */
(function () {
  "use strict";

  function field(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
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
    } catch (e) { /* storage unavailable; the booking still works */ }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("inquiry-form");
    if (!form) return;

    /* Two-step flow: after the brief is submitted, the form is replaced
       in place by the calendar booking, with name + email prefilled. */
    var panel = document.getElementById("step2-panel");
    var stepKicker = document.getElementById("step-kicker");
    var bookConfirm = document.getElementById("book-confirm");
    var calendlySlot = document.getElementById("calendly-slot");
    var calendlyInit = false;
    if (panel) panel.hidden = true;

    function initCalendly(prefill) {
      if (calendlyInit || !calendlySlot) return;
      calendlyInit = true;
      calendlySlot.innerHTML = "";
      var tries = 0;
      (function attempt() {
        if (window.Calendly && window.Calendly.initInlineWidget) {
          window.Calendly.initInlineWidget({
            url: "https://calendly.com/ltang9090/30min",
            parentElement: calendlySlot,
            prefill: prefill
          });
        } else if (tries++ < 20) {
          setTimeout(attempt, 300);
        } else {
          calendlySlot.innerHTML = '<p><a class="card-link" href="https://calendly.com/ltang9090/30min">Book directly on Calendly</a></p>';
        }
      })();
    }

    function revealBooking(name, email) {
      if (!panel) return;
      if (stepKicker) stepKicker.hidden = true;
      panel.hidden = false;
      if (bookConfirm) {
        bookConfirm.textContent = "Brief received" + (name ? ", " + name : "") + ". Now lock in your 30 minutes.";
        bookConfirm.hidden = false;
      }
      initCalendly({ name: name || "", email: email || "" });
      setTimeout(function () { panel.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
    }

    function backToForm() {
      if (panel) panel.hidden = true;
      if (stepKicker) stepKicker.hidden = false;
      calendlyInit = false;
      form.style.display = "";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = field("f-name");
      var email = field("f-email");
      if (!name || !email || email.indexOf("@") < 0) {
        alert("Please add your name and a valid work email so we can reply.");
        return;
      }
      saveInquiry();
      form.style.display = "none";
      revealBooking(name, email);
    });

    var edit2 = document.getElementById("edit-details-2");
    if (edit2) edit2.addEventListener("click", function (ev) { ev.preventDefault(); backToForm(); });
  });
})();
