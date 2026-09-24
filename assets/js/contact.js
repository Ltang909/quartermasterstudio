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
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
  });
})();
