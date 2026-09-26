/* First local new-deal flow: create a fictional draft in this browser session. */
(function (global) {
  "use strict";

  const createdIds = [];
  const initialActivity = JSON.parse(JSON.stringify(activityItems));
  const initialStages = Object.fromEntries(Object.entries(deals).map(function (entry) {
    return [entry[0], entry[1].stage];
  }));
  let returnPage = "overview";
  global.MandateCreatedDeals = {};

  function formatNZD(amount) {
    if (amount === null || amount === undefined || amount === "") return "Not provided";
    return "NZ$" + new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(amount);
  }

  function makeId() {
    return "new-" + (global.crypto && global.crypto.randomUUID
      ? global.crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  }

  function renderForm() {
    returnPage = currentPage === "deals" ? "deals" : "overview";
    const content = document.getElementById("appContent");
    document.getElementById("crumbTitle").textContent = "New deal";
    content.innerHTML = `
      <div class="page-title intake-page-title">
        <div><h1>New deal</h1><p>Start a fictional draft. You can review details before sharing anything.</p></div>
      </div>
      <form id="newDealForm" class="intake-form" novalidate>
        <section class="detail-card intake-card">
          <div class="detail-card-title"><h2>Company details</h2><span class="intake-required-note">* Required to save</span></div>
          <div class="intake-grid">
            <label class="intake-field"><span>Company name *</span><input name="companyName" autocomplete="off" required maxlength="120" placeholder="e.g. Kowhai Contracting Ltd"></label>
            <label class="intake-field"><span>Industry</span><input name="industry" autocomplete="off" maxlength="100" placeholder="e.g. Civil construction"></label>
            <label class="intake-field"><span>Location</span><input name="location" autocomplete="off" maxlength="100" placeholder="e.g. Hamilton, New Zealand"></label>
          </div>
        </section>
        <section class="detail-card intake-card">
          <div class="detail-card-title"><h2>Funding request</h2></div>
          <div class="intake-grid">
            <label class="intake-field"><span>Amount requested (NZD) *</span><input name="amount" type="number" min="1" step="1" required inputmode="decimal" placeholder="750000"></label>
            <label class="intake-field"><span>Purpose *</span><input name="purpose" autocomplete="off" required maxlength="180" placeholder="e.g. Equipment purchase"></label>
            <label class="intake-field"><span>Term requested (months)</span><input name="termMonths" type="number" min="1" max="600" step="1" inputmode="numeric" placeholder="36"></label>
            <label class="intake-field"><span>Preferred timing</span><input name="preferredTiming" autocomplete="off" maxlength="100" placeholder="e.g. Within 8 weeks"></label>
            <label class="intake-field intake-field-wide"><span>Proposed security</span><input name="security" autocomplete="off" maxlength="180" placeholder="e.g. Commercial property, equipment"></label>
          </div>
        </section>
        <section class="detail-card intake-card">
          <div class="detail-card-title"><h2>Known financials</h2><span class="intake-optional-note">Optional · leave blank if unknown</span></div>
          <div class="intake-grid">
            <label class="intake-field"><span>Annual revenue (NZD)</span><input name="revenue" type="number" min="0" step="1000" inputmode="decimal" placeholder="Not provided"></label>
            <label class="intake-field"><span>EBITDA (NZD)</span><input name="ebitda" type="number" min="0" step="1000" inputmode="decimal" placeholder="Not provided"></label>
          </div>
        </section>
        <p class="intake-session-note">Drafts, uploaded synthetic CSVs, and summary reviews stay in this browser session and clear when you refresh.</p>
        <div class="intake-example-section">
          <p>Quick examples for exploring criteria results</p>
          <div class="intake-example-actions">
            <button class="button-outline" type="button" id="fillDealExample">Fill fictional example</button>
            <button class="button-outline" type="button" id="fillBoundaryExample">Try minimum-boundary case</button>
            <button class="button-outline" type="button" id="fillMissingExample">Try missing-info case</button>
          </div>
        </div>
        <div class="intake-actions"><button class="button-outline" type="button" id="cancelNewDeal">Cancel</button><button class="button button-dark" type="submit">Save draft <span>↗</span></button></div>
      </form>`;
    content.querySelector("[name=companyName]").focus();
  }

  function fillExample(variant) {
    const form = document.getElementById("newDealForm");
    const sample = {
      companyName: "Kowhai Contracting Ltd",
      industry: "Civil construction",
      location: "Hamilton, New Zealand",
      amount: "950000",
      purpose: "Equipment purchase and seasonal working capital",
      termMonths: "36",
      preferredTiming: "Within 8 weeks",
      security: "Equipment, commercial property",
      revenue: "2850000",
      ebitda: "390000"
    };
    if (variant === "boundary") {
      sample.amount = "1000000";
      sample.purpose = "Equipment purchase";
      sample.termMonths = "12";
    } else if (variant === "missing") {
      sample.companyName = "Matai Plant Hire Ltd";
      sample.industry = "Equipment hire";
      sample.location = "Hamilton, New Zealand";
      sample.amount = "1200000";
      sample.purpose = "Equipment purchase";
      sample.termMonths = "";
      sample.security = "";
      sample.revenue = "4200000";
      sample.ebitda = "560000";
    }
    Object.keys(sample).forEach(function (name) { form.elements[name].value = sample[name]; });
  }

  function numericValue(value) {
    if (value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function saveDraft(form) {
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const amount = numericValue(fields.get("amount"));
    const companyName = String(fields.get("companyName") || "").trim();
    const purpose = String(fields.get("purpose") || "").trim();
    if (!companyName || !purpose || amount === null || amount <= 0) {
      return;
    }

    const id = makeId();
    const now = new Date().toISOString();
    const revenue = numericValue(fields.get("revenue"));
    const ebitda = numericValue(fields.get("ebitda"));
    const termMonths = numericValue(fields.get("termMonths"));
    const security = String(fields.get("security") || "")
      .split(",").map(function (item) { return item.trim(); }).filter(Boolean);
    const company = {
      name: companyName,
      industry: String(fields.get("industry") || "").trim() || null,
      location: String(fields.get("location") || "").trim() || null
    };
    const funding = {
      currency: "NZD",
      amount: amount,
      purpose: purpose,
      termMonths: termMonths,
      preferredTiming: String(fields.get("preferredTiming") || "").trim() || null,
      security: security
    };
    const documents = [
      { id: id + "-management-accounts", name: "Management accounts", kind: "management_accounts", sourceType: "expected", status: "missing", extractedFields: [] },
      { id: id + "-cashflow", name: "Cash flow forecast", kind: "cash_flow_forecast", sourceType: "expected", status: "missing", extractedFields: [] },
      { id: id + "-security", name: "Security information", kind: "security_information", sourceType: "expected", status: "missing", extractedFields: [] }
    ];

    global.MandateCreatedDeals[id] = {
      id: id,
      synthetic: true,
      createdAt: now,
      updatedAt: now,
      company: company,
      funding: funding,
      financials: {
        annualRevenue: { amount: revenue, currency: "NZD", periodEnd: null, sourceIds: [] },
        ebitda: { amount: ebitda, currency: "NZD", periodEnd: null, sourceIds: [] }
      },
      documents: documents,
      review: { confirmedFields: ["company.name", "funding.amount", "funding.purpose"], conflicts: [] },
      workflow: { stage: "draft", nextSteps: [], activity: [] },
      summary: { text: "", method: "local_template", status: "not_started", generatedAt: null, reviewedAt: null, basedOnUpdatedAt: null }
    };

    deals[id] = {
      name: company.name,
      initial: company.name.slice(0, 1).toUpperCase(),
      industry: company.industry || "Industry not provided",
      location: company.location || "Location not provided",
      purpose: funding.purpose,
      amount: formatNZD(amount),
      term: termMonths ? termMonths + " months" : "Not provided",
      security: security.length ? security.join(" + ") : "Not provided",
      revenue: formatNZD(revenue),
      ebitda: formatNZD(ebitda),
      stage: 0,
      docs: documents.map(function (document) { return document.name; }),
      matches: deals.northstar.matches
    };
    createdIds.push(id);
    activityItems.unshift({ title: "Draft deal created", detail: company.name + " · by you", when: "Just now", icon: company.name.slice(0, 1).toUpperCase(), tone: "green" });
    global.openDeal(id);
    global.notify("Draft saved for adviser review");
  }

  function updateCounts() {
    const ids = Object.keys(deals);
    const counts = [0, 1, 2].map(function (stage) {
      return ids.filter(function (id) { return deals[id].stage === stage; }).length;
    });
    const analyses = ids.map(function (id) {
      const created = global.MandateCreatedDeals[id];
      if (created) return global.MandateDealAnalysis.analyzeDeal(created, global.MandateSyntheticData.getLenders());
      const scenarioIds = { northstar: "demo-northstar-civil", harbour: "demo-harbour-pine-foods", ridge: "demo-ridgeway-equipment" };
      return global.MandateDealAnalysis.analyzeSyntheticDeal(scenarioIds[id]);
    });
    const attentionCount = analyses.filter(function (analysis) { return analysis.summary.reviewItems.length > 0; }).length;
    const possibleFits = analyses.reduce(function (total, analysis) {
      return total + analysis.lenderComparisons.filter(function (comparison) {
        return comparison.overall === "several_criteria_align" || comparison.overall === "possible_criteria_overlap";
      }).length;
    }, 0);
    const navCount = document.querySelector(".nav-count");
    if (navCount) navCount.textContent = String(ids.length);
    const statValues = document.querySelectorAll(".stat-grid .stat-card .stat-value");
    if (statValues[0]) statValues[0].textContent = String(ids.length).padStart(2, "0");
    if (statValues[1]) statValues[1].textContent = String(attentionCount).padStart(2, "0");
    if (statValues[2]) statValues[2].textContent = String(possibleFits).padStart(2, "0");
    const attentionBadge = document.querySelector(".attention-count");
    if (attentionBadge) attentionBadge.textContent = String(attentionCount);
    const chips = document.querySelectorAll("#appContent .filter-chip b");
    if (chips.length >= 4) {
      chips[0].textContent = String(ids.length);
      chips[1].textContent = String(counts[0]);
      chips[2].textContent = String(counts[1]);
      chips[3].textContent = String(counts[2]);
    }
  }

  const baseRenderOverview = global.renderOverview;
  const baseRenderDeals = global.renderDeals;
  const baseRenderDeal = global.renderDeal;
  global.renderOverview = function () {
    const result = baseRenderOverview();
    updateCounts();
    const mobileList = document.querySelector("#appContent .mobile-deal");
    if (mobileList) {
      const rows = Object.entries(deals).map(function (entry) {
        const id = entry[0];
        const deal = entry[1];
        const button = document.createElement("button");
        button.className = "mobile-deal mobile-deal-dynamic";
        button.type = "button";
        const name = document.createElement("b");
        name.textContent = deal.name;
        const detail = document.createElement("span");
        detail.textContent = deal.amount + " · " + ["Preparing", "In review", "With lender", "Outcome recorded"][deal.stage];
        button.append(name, detail);
        button.addEventListener("click", function () { global.openDeal(id); });
        return button;
      });
      const container = mobileList.parentElement;
      mobileList.replaceWith(rows[0] || document.createTextNode(""));
      rows.slice(1).forEach(function (row) { container.append(row); });
    }
    return result;
  };
  global.renderDeals = function () {
    const result = baseRenderDeals();
    updateCounts();
    return result;
  };
  global.renderDeal = function () {
    const result = baseRenderDeal();
    const created = global.MandateCreatedDeals[global.MandateActiveDealId];
    if (created) {
      document.querySelectorAll("#appContent .document-row").forEach(function (row, index) {
        const name = created.documents[index] && created.documents[index].name;
        const title = row.querySelector("b");
        const note = row.querySelector("small");
        const status = row.querySelector(".doc-status");
        if (title && name) title.textContent = name;
        if (note) note.textContent = "No file attached · upload a synthetic document in the next step";
        if (status) { status.textContent = "Needed"; status.classList.add("missing"); }
      });
    }
    return result;
  };

  const baseOpenDeal = global.openDeal;
  global.openDeal = function (id) {
    global.MandateActiveDealId = id;
    return baseOpenDeal(id);
  };

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("#newDeal")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderForm();
      return;
    }
    if (target.closest("#fillDealExample")) {
      event.preventDefault();
      fillExample("standard");
      return;
    }
    if (target.closest("#fillBoundaryExample")) {
      event.preventDefault();
      fillExample("boundary");
      return;
    }
    if (target.closest("#fillMissingExample")) {
      event.preventDefault();
      fillExample("missing");
      return;
    }
    if (target.closest("#cancelNewDeal")) {
      event.preventDefault();
      global.showPage(returnPage);
      return;
    }
    if (target.closest("#resetDemo")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      createdIds.forEach(function (id) { delete deals[id]; delete global.MandateCreatedDeals[id]; });
      createdIds.length = 0;
      global.MandateWorkingDeals = {};
      global.MandateUploadState = {};
      global.MandateSummaryReviewRecords = {};
      if (global.MandateResetWorkflow) global.MandateResetWorkflow();
      Object.keys(initialStages).forEach(function (id) { deals[id].stage = initialStages[id]; });
      activityItems = JSON.parse(JSON.stringify(initialActivity));
      summaryReady = true;
      global.MandateActiveDealId = "northstar";
      global.showPage("overview");
      global.notify("Sample workspace reset");
    }
  }, true);

  document.addEventListener("submit", function (event) {
    if (!event.target || event.target.id !== "newDealForm") return;
    event.preventDefault();
    saveDraft(event.target);
  });
})(window);
