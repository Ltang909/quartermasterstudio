/* Quartermaster Studio portal: builds blog posts and past-event cards. */
(function () {
  "use strict";

  var SITE_HEADER = `<header class="site">
  <div class="wrap nav">
    <a class="brand" href="/" aria-label="Quartermaster Studio home">
      <span class="brand-logo"><img src="/assets/img/mark.svg" alt="Quartermaster Studio compass mark" width="42" height="42"></span>
      <span class="brand-word"><span>Quartermaster</span><span>Studio</span></span>
    </a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/" data-nav="home">Home</a>
      <a href="/roi-calculator/" data-nav="roi-calculator">ROI Calculator</a>
      <a href="/services/" data-nav="services">Services</a>
      <a href="/past-events/" data-nav="past-events">Past Events</a>
      <a href="/blog/" data-nav="blog">Blog</a>
      <a href="/contact/" class="btn btn-primary nav-cta">Reserve a Consultation</a>
    </nav>
    <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <nav class="mobile-menu" id="mobileMenu" aria-label="Mobile">
    <a href="/" data-nav="home">Home</a>
    <a href="/roi-calculator/" data-nav="roi-calculator">ROI Calculator</a>
    <a href="/services/" data-nav="services">Services</a>
    <a href="/past-events/" data-nav="past-events">Past Events</a>
    <a href="/blog/" data-nav="blog">Blog</a>
    <a href="/contact/" class="btn btn-primary">Reserve a Consultation</a>
  </nav>
</header>`;
  var SITE_FOOTER = `<footer class="site">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="foot-brand">Quartermaster Studio</div>
        <p>Executive dinners and private events, provisioned down to the last detail.</p>
      </div>
      <div class="footer-links">
        <h4>Studio</h4>
        <a href="/">Home</a>
        <a href="/roi-calculator/">ROI Calculator</a>
        <a href="/services/">Services</a>
        <a href="/past-events/">Past Events</a>
        <a href="/blog/">Blog</a>
        <a href="/contact/">Contact</a>
      </div>
      <div class="footer-links">
        <h4>Begin</h4>
        <a href="/contact/">Reserve a Consultation</a>
        <a href="/roi-calculator/">Run Your Numbers</a>
      </div>
    </div>
    <div class="footer-note">
      <span>&copy; <span data-year>2026</span> Quartermaster Studio. All rights reserved.</span>
      <span>Provisioned with care.</span>
    </div>
  </div>
</footer>`;


  var IMG_PRESETS = [
    { id: "photo-1414235077428-338989a2e8c0", label: "Fine dining" },
    { id: "photo-1519167758481-83f550bb49b3", label: "Event hall" },
    { id: "photo-1511795409834-ef04bbd61622", label: "Table setting" },
    { id: "photo-1464366400600-7168b8af9bc3", label: "Dinner party" },
    { id: "photo-1511578314322-379afb476865", label: "Celebration" },
    { id: "photo-1505373877841-8d25f7d46678", label: "Summit" }
  ];
  function imgUrl(id) {
    return "https://images.unsplash.com/" + id + "?q=80&w=1200&auto=format&fit=crop";
  }

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(s) {
    return String(s || "your-slug").toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "your-slug";
  }

  function inlineFmt(s) {
    var out = esc(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return out;
  }

  function bodyToHtml(body) {
    var blocks = String(body || "").split(/\n\s*\n/);
    var html = "";
    var firstPara = true;
    blocks.forEach(function (b) {
      var t = b.trim();
      if (!t) return;
      if (t.indexOf("## ") === 0) {
        html += "<h2>" + inlineFmt(t.slice(3).trim()) + "</h2>\n";
      } else if (t.indexOf("> ") === 0) {
        html += "<blockquote>" + inlineFmt(t.replace(/^> /gm, "").trim()) + "</blockquote>\n";
      } else {
        var cls = firstPara ? ' class="lede"' : "";
        html += "<p" + cls + ">" + inlineFmt(t) + "</p>\n";
        firstPara = false;
      }
    });
    return html || '<p class="lede">Your words will appear here.</p>';
  }

  function longDate(iso) {
    if (!iso) return "September 24, 2026";
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function readTime(body, manual) {
    if (manual && manual.trim()) return manual.trim();
    var words = String(body || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200)) + " min read";
  }

  /* ---------- tabs ---------- */
  function initTabs() {
    var tabs = document.querySelectorAll(".portal-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        document.querySelectorAll(".portal-panel").forEach(function (p) { p.classList.remove("active"); });
        var name = tab.getAttribute("data-ptab");
        $("panel-" + name).classList.add("active");
        if (name === "inquiries") renderInquiries();
      });
    });
  }

  /* ---------- image picks ---------- */
  function initPicks(containerId, inputId) {
    var box = $(containerId);
    if (!box) return;
    IMG_PRESETS.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<img src="' + imgUrl(p.id).replace("w=1200", "w=200") + '" alt="" loading="lazy"><span>' + p.label + "</span>";
      b.addEventListener("click", function () {
        $(inputId).value = imgUrl(p.id);
        render();
      });
      box.appendChild(b);
    });
  }

  /* ---------- blog post ---------- */
  function postData() {
    var title = $("p-title").value.trim() || "Your headline here";
    var body = $("p-body").value;
    return {
      title: title,
      titleHtml: inlineFmt(title),
      slug: slugify($("p-title").value),
      dateLong: longDate($("p-date").value),
      read: readTime(body, $("p-read").value),
      excerpt: $("p-excerpt").value.trim() || "Your excerpt will appear here.",
      image: $("p-image").value.trim() || imgUrl(IMG_PRESETS[0].id),
      alt: $("p-alt").value.trim() || title,
      bodyHtml: bodyToHtml(body)
    };
  }

  function postCardHtml(d) {
    return '<article class="post-card">\n' +
      '  <img src="' + esc(d.image) + '" alt="' + esc(d.alt) + '" loading="lazy">\n' +
      '  <div class="body">\n' +
      '    <span class="post-meta">' + esc(d.dateLong) + " &middot; " + esc(d.read) + "</span>\n" +
      '    <h3><a href="/blog/' + d.slug + '/">' + d.titleHtml + "</a></h3>\n" +
      '    <p class="excerpt">' + esc(d.excerpt) + "</p>\n" +
      '    <a class="card-link" href="/blog/' + d.slug + '/">Read the note</a>\n' +
      "  </div>\n" +
      "</article>";
  }

  function postPageHtml(d) {
    return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
"<head>\n" +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
"<title>" + esc(d.title.replace(/\*/g, "")) + " - Quartermaster Studio</title>\n" +
'<meta name="description" content="' + esc(d.excerpt) + '">\n' +
'<link rel="stylesheet" href="/assets/css/style.css?v=20260924f">\n' +
'<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">\n' +
"</head>\n" +
"<body>\n\n" +
SITE_HEADER + "\n\n" +
"<main>\n" +
'  <section class="page-head">\n' +
'    <div class="wrap post-hero">\n' +
'      <span class="kicker"><a href="/blog/" style="color:inherit;">The logbook</a></span>\n' +
"      <h1>" + d.titleHtml + "</h1>\n" +
'      <p class="post-meta" style="margin-top:14px;">' + esc(d.dateLong) + " &middot; " + esc(d.read) + "</p>\n" +
"    </div>\n" +
"  </section>\n\n" +
'  <section class="section" style="padding-top: 20px;">\n' +
'    <div class="wrap">\n' +
'      <div class="post-hero">\n' +
'        <img src="' + esc(d.image) + '" alt="' + esc(d.alt) + '">\n' +
"      </div>\n" +
"    </div>\n" +
"  </section>\n\n" +
'  <section class="section" style="padding-top: 10px;">\n' +
'    <div class="wrap">\n' +
'      <article class="prose">\n' +
d.bodyHtml +
"      </article>\n\n" +
'      <div class="cta-band" style="margin-top: 60px;">\n' +
"        <h2>Planning your own <em>table?</em></h2>\n" +
"        <p>Tell us about the evening you are imagining. We will provision the rest.</p>\n" +
'        <a class="btn btn-brass" href="/contact/">Reserve a Consultation</a>\n' +
"      </div>\n" +
"    </div>\n" +
"  </section>\n" +
"</main>\n\n" +
SITE_FOOTER + "\n\n" +
'<script src="/assets/js/main.js" defer></scr' + 'ipt>\n' +
"</body>\n" +
"</html>\n";
  }

  /* ---------- past event ---------- */
  function eventData() {
    return {
      title: $("e-title").value.trim() || "Your event title",
      guests: $("e-guests").value.trim() || "20 guests",
      duration: $("e-duration").value.trim() || "1 night",
      location: $("e-location").value.trim() || "New York",
      desc: $("e-desc").value.trim() || "Your description will appear here.",
      image: $("e-image").value.trim() || imgUrl(IMG_PRESETS[3].id),
      alt: $("e-alt").value.trim() || $("e-title").value.trim() || "Past event"
    };
  }

  function eventCardHtml(d) {
    return '<article class="event-card">\n' +
      '  <img src="' + esc(d.image) + '" alt="' + esc(d.alt) + '" loading="lazy">\n' +
      '  <div class="body">\n' +
      "    <h3>" + esc(d.title) + "</h3>\n" +
      '    <div class="event-facts">\n' +
      "      <span>" + esc(d.guests) + "</span><span>" + esc(d.duration) + "</span><span>" + esc(d.location) + "</span>\n" +
      "    </div>\n" +
      '    <p class="excerpt" style="color:var(--muted);margin:0;">' + esc(d.desc) + "</p>\n" +
      "  </div>\n" +
      "</article>";
  }

  /* ---------- inquiries inbox ---------- */
  var INQ_KEY = "qm_inquiries";
  function getInquiries() {
    try { return JSON.parse(localStorage.getItem(INQ_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function renderInquiries() {
    var list = getInquiries();
    var box = $("inqList");
    if (!box) return;
    $("inqCount").textContent = list.length ? "(" + list.length + ")" : "";
    if (!list.length) {
      box.innerHTML = '<div class="empty-state"><h2>No inquiries yet.</h2><p>When someone submits the contact form, their brief will appear here.</p></div>';
      return;
    }
    box.innerHTML = list.map(function (q, i) {
      var when = "";
      try {
        when = new Date(q.at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
      } catch (e) {}
      var facts = "";
      if (q.email) facts += "<span>" + esc(q.email) + "</span>";
      if (q.company) facts += "<span>" + esc(q.company) + "</span>";
      if (q.type) facts += "<span>" + esc(q.type) + "</span>";
      if (q.guests) facts += "<span>" + esc(q.guests) + " guests</span>";
      if (q.date) facts += "<span>" + esc(q.date) + "</span>";
      return '<article class="inq-card">' +
        '<div class="inq-head"><div><h3>' + esc(q.name || "Unnamed") + "</h3>" +
        (when ? '<span class="post-meta">' + esc(when) + "</span>" : "") + "</div>" +
        '<div class="portal-actions" style="margin:0;">' +
        '<a class="btn btn-ghost" style="padding:8px 16px;" href="mailto:' + esc(q.email || "") +
        "?subject=" + encodeURIComponent("Re: your Quartermaster inquiry") + '">Reply</a>' +
        '<button type="button" class="btn btn-ghost" style="padding:8px 16px;" data-del="' + i + '">Delete</button>' +
        "</div></div>" +
        (facts ? '<div class="event-facts">' + facts + "</div>" : "") +
        (q.message ? '<p style="margin:0;color:var(--muted);">' + esc(q.message) + "</p>" : "") +
        "</article>";
    }).join("");
    box.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = getInquiries();
        l.splice(parseInt(b.getAttribute("data-del"), 10), 1);
        try { localStorage.setItem(INQ_KEY, JSON.stringify(l)); } catch (e) {}
        renderInquiries();
      });
    });
  }

  /* ---------- render ---------- */
  function render() {
    var pd = postData();
    $("slugOut").textContent = pd.slug;
    $("postCardPreview").innerHTML = postCardHtml(pd);
    var page = postPageHtml(pd);
    $("postPreview").srcdoc = page;
    postPageCache = page;
    postCardCache = postCardHtml(pd);

    var ed = eventData();
    $("eventCardPreview").innerHTML = eventCardHtml(ed);
    eventCardCache = eventCardHtml(ed);
  }

  var postPageCache = "", postCardCache = "", eventCardCache = "";

  /* ---------- copy / download ---------- */
  function flash(btn, label) {
    var orig = btn.textContent;
    btn.textContent = label || "Copied!";
    setTimeout(function () { btn.textContent = orig; }, 1600);
  }

  function copyText(text, btn) {
    function done() { flash(btn); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "text/html" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    }, 500);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initPicks("p-picks", "p-image");
    initPicks("e-picks", "e-image");
    var today = new Date().toISOString().slice(0, 10);
    $("p-date").value = today;

    ["postForm", "eventForm"].forEach(function (fid) {
      $(fid).addEventListener("input", render);
    });

    $("postCopy").addEventListener("click", function () { copyText(postPageCache, this); });
    $("postCardCopy").addEventListener("click", function () { copyText(postCardCache, this); });
    $("eventCardCopy").addEventListener("click", function () { copyText(eventCardCache, this); });
    $("postDownload").addEventListener("click", function () {
      var slug = postData().slug;
      download("index.html", postPageCache);
      flash(this, "Downloaded!");
    });

    render();
    renderInquiries();
  });
})();
