/* Quartermaster Studio - dinner cost and risk model.
   Same model as the original ROI calculator: identical inputs, constants,
   formulas, tiers and copy. Rebuilt presentation only. */
(function () {
  "use strict";

  var STORE_KEY = "qm-dinner-model-v1";

  // fixed basis
  var DINNERS = 2;          // dinners a month
  var LOAD = 1.25;          // benefits, taxes, tooling
  var OPS_MO = 7500;        // ops, design, management time
  var PLATFORM_MO = 2100;   // event platform and collateral
  var HARD = 13000;         // venue, F&B, AV, print, gifting
  var RAMP_DRAG = 0.5;      // average productivity shortfall across the ramp
  var AGENCY_WEEKS = 5;     // lead time to a first dinner
  var CANCEL_KEEP = 0.25;   // share of fee due when cancelling beyond 30 days
  var SEVERANCE_MONTHS = 1; // notice and payout when a hire does not work out
  var WEEKS_PER_MONTH = 4.33;

  var TIER_NOTES = {
    15000: "We would run your first dinner in-market: no overnights, a tight guest list, one room you can repeat every month.",
    17000: "We would start regional with one overnight: two dinners a month in a private room, the format this model is built on.",
    19500: "We would start with the national format: two or more nights, built for guests flying in from anywhere."
  };

  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var usdK = function (n) {
    return Math.abs(n) >= 1000 ? "$" + Math.round(n / 1000) + "k" : "$" + Math.round(n);
  };
  var num = function (id) {
    var v = parseFloat($(id).value);
    return isFinite(v) ? v : 0;
  };
  var pct = function (x) { return Math.round(x * 100) + "%"; };

  function model() {
    var fm = num("qmFm"), sdr = num("qmSdr");
    var shareFm = Math.max(0.05, num("qmShareFm") / 100);
    var shareSdr = Math.max(0.05, num("qmShareSdr") / 100);
    var t = $("qmTier").value.split("|");
    var fee = parseFloat(t[0]), travel = parseFloat(t[1]);

    var fmPer = fm / 12 * LOAD * shareFm;
    var sdrPer = sdr / 12 * LOAD * shareSdr;
    var overheadPer = (OPS_MO + PLATFORM_MO) / DINNERS;
    var labourPer = fmPer + sdrPer + overheadPer;

    var budgetLine = HARD + travel;
    var trueCost = budgetLine + labourPer;
    var withMe = budgetLine + fee;
    var delta = labourPer - fee;

    var hireMonths = num("qmHireMonths");
    var firstDinnerWeeks = num("qmFirstDinnerWeeks");
    var rampMonths = num("qmRampMonths");
    var failPct = Math.max(0, num("qmFailPct") / 100);
    var recruitPct = Math.max(0, num("qmRecruitPct") / 100);

    var fullyLoaded = fm * LOAD;
    var monthlyLoaded = fullyLoaded / 12;
    var recruiting = fm * recruitPct;
    var rampWaste = monthlyLoaded * rampMonths * RAMP_DRAG;
    var utilisation = Math.min(1, DINNERS * shareFm);
    var idleCapacity = (1 - utilisation) * fullyLoaded;
    var severance = monthlyLoaded * SEVERANCE_MONTHS;

    var riskBest = recruiting + rampWaste + idleCapacity;
    var riskWorst = riskBest + severance + recruiting + rampWaste;
    var riskLikely = riskBest + failPct * (riskWorst - riskBest);

    return {
      fm: fm, sdr: sdr, shareFm: shareFm, shareSdr: shareSdr, fee: fee, travel: travel,
      fmPer: fmPer, sdrPer: sdrPer, overheadPer: overheadPer, labourPer: labourPer,
      budgetLine: budgetLine, trueCost: trueCost, withMe: withMe, delta: delta,
      hireMonths: hireMonths, firstDinnerWeeks: firstDinnerWeeks,
      rampMonths: rampMonths, failPct: failPct, recruitPct: recruitPct,
      fullyLoaded: fullyLoaded, recruiting: recruiting, rampWaste: rampWaste,
      utilisation: utilisation, idleCapacity: idleCapacity, severance: severance,
      riskBest: riskBest, riskWorst: riskWorst, riskLikely: riskLikely,
      weeksToFirst: Math.round(hireMonths * WEEKS_PER_MONTH + firstDinnerWeeks)
    };
  }

  /* ---------- charts (div-based, responsive) ---------- */

  function drawBudgetBar(m) {
    var max = Math.max(m.trueCost, 1);
    var w = function (v) { return (v / max * 100).toFixed(2) + "%"; };
    $("qmBar").innerHTML =
      '<div class="bbar-row">' +
        '<div class="bbar-label"><strong>What you budget</strong><span>the event line</span></div>' +
        '<div class="bbar-track"><div class="bbar-seg seen" style="width:' + w(m.budgetLine) + '"></div></div>' +
        '<div class="bbar-val">' + usd(m.budgetLine) + '</div>' +
      '</div>' +
      '<div class="bbar-row">' +
        '<div class="bbar-label"><strong>What it costs</strong><span>the same night, loaded</span></div>' +
        '<div class="bbar-track"><div class="bbar-seg seen" style="width:' + w(m.budgetLine) + '"></div>' +
        '<div class="bbar-seg hidden" style="width:' + w(m.labourPer) + '"><span>' + usdK(m.labourPer) + ' hidden</span></div></div>' +
        '<div class="bbar-val">' + usd(m.trueCost) + '</div>' +
      '</div>' +
      '<div class="bbar-foot">' + (m.trueCost / m.budgetLine).toFixed(1) + 'x the number in the event budget</div>';
  }

  function drawRiskBar(m) {
    var max = Math.max(m.riskWorst, m.fee, 1);
    var w = function (v) { return (v / max * 100).toFixed(2) + "%"; };
    var left = w(m.riskBest), width = w(m.riskWorst - m.riskBest);
    $("qmRiskbar").innerHTML =
      '<div class="bbar-row">' +
        '<div class="bbar-label"><strong>Hiring</strong><span>range of outcomes</span></div>' +
        '<div class="bbar-track risk">' +
          '<div class="whisker" style="left:' + left + ';width:' + width + '"></div>' +
          '<div class="whisker-dot" style="left:' + w(m.riskLikely) + '" title="Likely: ' + usd(m.riskLikely) + '"></div>' +
        '</div>' +
        '<div class="bbar-val">' + usd(m.riskLikely) + '</div>' +
      '</div>' +
      '<div class="bbar-row">' +
        '<div class="bbar-label"><strong>Bespoke agency</strong><span>per dinner booked</span></div>' +
        '<div class="bbar-track risk">' +
          '<div class="agency-dot" style="left:' + w(m.fee) + '" title="' + usd(m.fee) + '"></div>' +
        '</div>' +
        '<div class="bbar-val">' + usd(m.fee) + '</div>' +
      '</div>' +
      '<div class="bbar-foot">' + (m.riskLikely / m.fee).toFixed(1) + 'x the exposure at the midpoint</div>';
  }

  /* ---------- tables ---------- */

  function stackRows(m) {
    var rows = [
      ["Venue, F&B, AV, print & gifting", HARD, HARD, "Event budget: the only line you see today", ""],
      ["Travel & expenses", m.travel, m.travel, m.travel ? "Separate GL account" : "None at this tier", ""],
      ["Field marketing time", m.fmPer, 0, "Marketing payroll", ""],
      ["SDR / sales support time", m.sdrPer, 0, "Sales payroll", ""],
      ["Ops, design, management & tooling", m.overheadPer, 0, "Spread across teams, never re-aggregated", ""],
      ["Agency fee", 0, m.fee, "One invoice, one budget line", ""]
    ];
    var html = "";
    rows.forEach(function (r) {
      html += '<tr><td><strong>' + r[0] + '</strong></td><td class="num">' + usd(r[1]) + '</td>' +
              '<td class="num">' + usd(r[2]) + '</td><td class="where">' + r[3] + '</td></tr>';
    });
    html += '<tr class="total"><td><strong>Per dinner</strong></td><td class="num">' + usd(m.trueCost) +
            '</td><td class="num">' + usd(m.withMe) + '</td><td class="where"></td></tr>';
    return html;
  }

  function riskRows(m) {
    var utilPct = Math.round(m.utilisation * 100);
    var idleNote = m.idleCapacity <= 0.5
      ? "At " + utilPct + "% utilisation there is none, on these settings"
      : "At " + utilPct + "% utilisation you are paying for capacity the calendar does not use";
    var rows = [
      ["r", "Recruiting fee, " + Math.round(m.recruitPct * 100) + "% of base", usd(m.recruiting), usd(0), ""],
      ["r", "Ramp: " + m.rampMonths + " months at half productivity", usd(m.rampWaste), usd(0), ""],
      ["r", "Capacity you pay for and do not use", usd(m.idleCapacity), usd(0), idleNote],
      ["sub", "Sunk even if the hire works out", usd(m.riskBest), usd(0), ""],
      ["r", "Severance and notice, 1 month", usd(m.severance), usd(0), ""],
      ["r", "Recruiting and ramping a replacement", usd(m.recruiting + m.rampWaste), usd(0), ""],
      ["sub", "Sunk if the hire does not work out", usd(m.riskWorst), usd(0), ""],
      ["r", "Weeks before a comparable dinner", m.weeksToFirst + " weeks", AGENCY_WEEKS + " weeks",
        m.hireMonths + " months to fill the role, then " + m.firstDinnerWeeks + " weeks before they can run one"],
      ["r", "Year one salary you are committed to", usd(m.fullyLoaded), usd(0),
        "Not at risk if the program runs, but fixed whether it does or not"],
      ["r", "A month you skip", "Full salary", usd(0), ""],
      ["r", "If you change your mind", "Severance", usd(m.fee * CANCEL_KEEP) + " at 30 days notice", ""]
    ];
    var html = "";
    rows.forEach(function (r) {
      var cls = r[0] === "sub" ? ' class="subtotal"' : "";
      var note = r[4] ? '<span class="row-note">' + r[4] + '</span>' : "";
      html += '<tr' + cls + '><td><strong>' + r[1] + '</strong>' + note + '</td>' +
              '<td class="num">' + r[2] + '</td><td class="num">' + r[3] + '</td></tr>';
    });
    html += '<tr class="total"><td><strong>Risk weighted exposure</strong></td>' +
            '<td class="num">' + usd(m.riskLikely) + '</td><td class="num">' + usd(m.fee) + '</td></tr>';
    return html;
  }

  /* ---------- write-up ---------- */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function buildPrintSheet(m) {
    var win = m.delta > 0;
    var verdict = Math.abs(m.delta) < m.fee * 0.02
      ? "Line ball. At these numbers the two come out the same."
      : win
        ? "At your numbers you are overpaying by " + usd(m.delta) + " a night: " + usd(m.delta * 24) + " over a year of the same program."
        : "At your numbers your own team runs it " + usd(-m.delta) + " cheaper a night, so an agency would be the wrong call at this volume.";
    var tierNote = TIER_NOTES[m.fee] || TIER_NOTES[17000];
    var today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return "" +
      "<h1>Quartermaster Studio</h1>" +
      "<p class=\"ps-sub\">Executive dinner program, cost and risk analysis. Prepared " + esc(today) + ".</p>" +
      "<p class=\"ps-verdict\">" + esc(verdict) + "</p>" +
      "<h2>The night itself</h2>" +
      "<table>" +
      "<tr><td>One night on the event line</td><td class=\"num\">" + esc(usd(m.budgetLine)) + "</td></tr>" +
      "<tr><td>True loaded cost, in-house</td><td class=\"num\">" + esc(usd(m.trueCost)) + "</td></tr>" +
      "<tr><td>Of which: people and overhead</td><td class=\"num\">" + esc(usd(m.labourPer)) + "</td></tr>" +
      "<tr><td>Same night with Quartermaster (" + esc(usd(m.fee)) + " fixed)</td><td class=\"num\">" + esc(usd(m.withMe)) + "</td></tr>" +
      "</table>" +
      "<h2>The hiring risk</h2>" +
      "<table>" +
      "<tr><td>Sunk even when the hire works out</td><td class=\"num\">" + esc(usd(m.riskBest)) + "</td></tr>" +
      "<tr><td>Exposure if the hire does not (" + Math.round(m.failPct * 100) + "%)</td><td class=\"num\">" + esc(usd(m.riskWorst)) + "</td></tr>" +
      "<tr><td>Risk-weighted, before a single guest sits down</td><td class=\"num\">" + esc(usd(m.riskLikely)) + "</td></tr>" +
      "<tr><td>Weeks to a first comparable dinner</td><td class=\"num\">" + m.weeksToFirst + " vs " + AGENCY_WEEKS + "</td></tr>" +
      "</table>" +
      "<h2>Where we would start</h2>" +
      "<p>" + esc(tierNote) + "</p>" +
      "<div class=\"ps-note\"><p style=\"margin:0;\"><strong>One honest note:</strong> this compares labour to labour. Venue, food, AV and gifting are paid either way, and you hold those contracts directly, so you keep the pricing leverage and nothing is marked up. The saving is on the people, not on the program.</p></div>" +
      "<p class=\"ps-foot\">quartermasterstudio.leontang.ca &mdash; figures as entered on the ROI calculator.</p>";
  }

  /* ---------- render ---------- */

  function render() {
    var m = model();

    $("qmShareFmOut").textContent = pct(m.shareFm);
    $("qmShareSdrOut").textContent = pct(m.shareSdr);
    $("qmHireMonthsOut").textContent = m.hireMonths;
    $("qmFirstDinnerWeeksOut").textContent = m.firstDinnerWeeks;
    $("qmRampMonthsOut").textContent = m.rampMonths;
    $("qmFailPctOut").textContent = pct(m.failPct);
    $("qmRecruitPctOut").textContent = pct(m.recruitPct);

    // verdict
    var win = m.delta > 0;
    var verdict = $("qmVerdict"), head = $("qmVHead"), sub = $("qmVSub");
    if (Math.abs(m.delta) < m.fee * 0.02) {
      verdict.className = "verdict tie";
      head.textContent = "Line ball";
      sub.textContent = "At these numbers the two come out the same. Anything that slows your calendar down moves it the agency's way.";
    } else if (win) {
      verdict.className = "verdict win";
      head.textContent = "You're overpaying by " + usd(m.delta) + " a night";
      sub.innerHTML = "That's <b>" + usd(m.delta * 24) + "</b> over a year of the same program, and <b>" +
        Math.round(m.delta / m.labourPer * 100) + "%</b> of what the people side costs you.";
    } else {
      verdict.className = "verdict lose";
      head.textContent = "You should keep this in-house";
      sub.innerHTML = "At these numbers your own team runs it <b>" + usd(-m.delta) +
        "</b> cheaper a night. An agency would be the wrong call at this volume.";
    }

    // tiles
    $("qmInNum").textContent = usd(m.trueCost);
    $("qmInNote").textContent = usd(m.labourPer) + " of it is people and overhead, sitting in two payroll lines nobody adds back up.";
    $("qmMeNum").textContent = usd(m.withMe);
    $("qmMeNote").textContent = usd(m.fee) + " fixed, on one invoice. No ramp, no severance, no payroll admin, nothing in a quiet month.";

    $("qmBarLede").innerHTML = "One night reads as <strong>" + usd(m.budgetLine) +
      "</strong> on the event line and costs <strong>" + usd(m.trueCost) + "</strong>.";
    drawBudgetBar(m);

    $("qmStackLede").innerHTML = "<strong>" + Math.round(m.labourPer / m.trueCost * 100) +
      "%</strong> of the real number is labour, split across two cost centres: which is why the dinner looks like it cost " +
      usd(m.budgetLine) + " forever.";
    $("qmStackRows").innerHTML = stackRows(m);

    // risk
    $("qmRiskHireNum").textContent = usd(m.riskLikely);
    $("qmRiskHireNote").innerHTML = "<b>" + usd(m.riskBest) + "</b> of that is sunk even when the hire works out: " +
      "you cannot recruit or ramp for free. The rest is the " + Math.round(m.failPct * 100) +
      "% chance of paying to exit and starting again.";
    $("qmRiskAgencyNum").textContent = usd(m.fee);
    $("qmRiskAgencyNote").innerHTML = "Per dinner, at the moment you book it. <b>" + usd(0) +
      "</b> until you do, nothing in a month you skip, and no version of this that costs more.";
    drawRiskBar(m);
    $("qmRiskRows").innerHTML = riskRows(m);
    $("qmRiskNote").innerHTML = "<strong>The asymmetry is the shape, not the size.</strong> Even a hire that goes perfectly costs " +
      usd(m.riskBest) + " to get to a first dinner, and that dinner is " + (m.weeksToFirst - AGENCY_WEEKS) +
      " weeks later than the agency's. The agency number has no best or worst case: " + usd(m.fee) + " a dinner, " +
      usd(m.fee * CANCEL_KEEP) + " if you cancel beyond 30 days, " + usd(m.fee * 0.5) +
      " inside 30 days, nothing for a quarter you sit out.";

    // persist
    try {
      var vals = {};
      ["qmFm", "qmSdr", "qmShareFm", "qmShareSdr", "qmTier", "qmHireMonths",
       "qmFirstDinnerWeeks", "qmRampMonths", "qmFailPct", "qmRecruitPct"].forEach(function (id) {
        vals[id] = $(id).value;
      });
      localStorage.setItem(STORE_KEY, JSON.stringify(vals));
    } catch (e) { /* private mode */ }
  }

  /* ---------- init ---------- */

  function updateFill(elx) {
    if (!elx || elx.type !== "range") return;
    var min = parseFloat(elx.min || 0), max = parseFloat(elx.max || 100);
    var v = parseFloat(elx.value || 0);
    var fill = max > min ? ((v - min) / (max - min) * 100) : 50;
    elx.style.setProperty("--fill", fill.toFixed(1) + "%");
  }

  document.addEventListener("DOMContentLoaded", function () {
    // restore saved inputs
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      Object.keys(saved).forEach(function (id) {
        var elx = $(id);
        if (elx && saved[id] !== undefined) elx.value = saved[id];
      });
    } catch (e) { /* noop */ }

    ["qmFm", "qmSdr", "qmShareFm", "qmShareSdr", "qmTier", "qmHireMonths",
     "qmFirstDinnerWeeks", "qmRampMonths", "qmFailPct", "qmRecruitPct"].forEach(function (id) {
      var elx = $(id);
      if (elx) {
        updateFill(elx);
        elx.addEventListener("input", function () { updateFill(elx); render(); });
        elx.addEventListener("change", function () { updateFill(elx); render(); });
      }
    });

    var reset = $("qmReset");
    if (reset) reset.addEventListener("click", function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ }
      window.location.reload();
    });

    var resizeT = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        var m = model();
        drawBudgetBar(m);
        drawRiskBar(m);
      }, 150);
    });

    // PDF download -> builds a print sheet with their numbers, opens print dialog
    var dlBtn = $("qmDownloadPdf");
    if (dlBtn) dlBtn.addEventListener("click", function () {
      var m = model();
      $("qmPrintSheet").innerHTML = buildPrintSheet(m);
      window.print();
    });

    render();
  });
})();
