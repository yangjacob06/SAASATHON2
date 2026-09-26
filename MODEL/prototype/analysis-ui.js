/* Connect the local deal analysis output to the existing sample deal screens. */
(function (global) {
  "use strict";

  if (!global.MandateDealAnalysis || !global.MandateSyntheticData) return;

  const scenarioByDeal = {
    northstar: "demo-northstar-civil",
    harbour: "demo-harbour-pine-foods",
    ridge: "demo-ridgeway-equipment"
  };
  let activeDealId = "northstar";
  let editingSummaryFor = null;
  global.MandateSummaryReviewRecords = global.MandateSummaryReviewRecords || {};
  const baseOpenDeal = global.openDeal;
  const baseRenderDeal = global.renderDeal;
  const baseRenderLenders = global.renderLenders;

  function selectedAnalysis() {
    const createdDeal = global.MandateCreatedDeals && global.MandateCreatedDeals[activeDealId];
    if (createdDeal) {
      return global.MandateDealAnalysis.analyzeDeal(createdDeal, global.MandateSyntheticData.getLenders());
    }
    const workingDeal = global.MandateWorkingDeals && global.MandateWorkingDeals[activeDealId];
    if (workingDeal) {
      return global.MandateDealAnalysis.analyzeDeal(workingDeal, global.MandateSyntheticData.getLenders());
    }
    const scenarioId = scenarioByDeal[activeDealId] || scenarioByDeal.northstar;
    return global.MandateDealAnalysis.analyzeSyntheticDeal(scenarioId);
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function outcomeLabel(outcome) {
    return ({
      matches: "Matches",
      outside_criteria: "Outside criteria",
      needs_check: "Needs checking"
    })[outcome] || "Needs checking";
  }

  function overallLabel(outcome) {
    return ({
      several_criteria_align: "Several criteria align",
      possible_criteria_overlap: "Possible criteria overlap",
      some_criteria_overlap_gaps_to_check: "Some overlap · gaps to check",
      needs_check: "Needs checking",
      no_recorded_criteria_overlap: "No recorded overlap"
    })[outcome] || "Needs checking";
  }

  function criterionLabel(criterion) {
    return ({
      amountNZD: "Requested amount",
      purpose: "Funding purpose",
      security: "Proposed security",
      termMonths: "Requested term"
    })[criterion] || criterion;
  }

  function dealValue(check) {
    if (check.dealValue === null || check.dealValue === undefined || check.dealValue === "") return "Not provided";
    if (check.criterion === "amountNZD" && typeof check.dealValue === "number") {
      return "NZ$" + new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(check.dealValue);
    }
    if (check.criterion === "termMonths") return check.dealValue + " months";
    return Array.isArray(check.dealValue) ? check.dealValue.join(", ") : String(check.dealValue);
  }

  function criteriaValue(check) {
    const criteria = check.recordedCriteria;
    if (Array.isArray(criteria)) return criteria.length ? criteria.join(", ") : "No criteria recorded";
    if (criteria && typeof criteria === "object" && typeof criteria.minimum === "number") {
      const number = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 });
      const currency = check.criterion === "amountNZD" ? "NZ$" : "";
      const suffix = check.criterion === "termMonths" ? " months" : "";
      return currency + number.format(criteria.minimum) + "–" + currency + number.format(criteria.maximum) + suffix;
    }
    return "No criteria recorded";
  }

  function makeCheckRow(check) {
    const row = makeElement("div", "analysis-check analysis-check-" + check.outcome);
    const heading = makeElement("div", "analysis-check-heading");
    heading.append(
      makeElement("b", "", criterionLabel(check.criterion)),
      makeElement("span", "analysis-result analysis-result-" + check.outcome, outcomeLabel(check.outcome))
    );

    const values = makeElement("div", "analysis-values");
    [["Deal", dealValue(check)], ["Recorded criteria", criteriaValue(check)]].forEach(function (item) {
      const value = makeElement("span", "");
      value.append(makeElement("small", "", item[0]), document.createTextNode(item[1]));
      values.append(value);
    });

    row.append(heading, values, makeElement("p", "", check.explanation));
    return row;
  }

  function enhanceLenderCards(analysis) {
    const cards = document.querySelectorAll("#appContent .lender-card");
    Array.from(cards).forEach(function (card, index) {
      const currentName = card.querySelector(".lender-title b");
      const comparison = analysis.lenderComparisons.find(function (item) {
        return currentName && item.lenderName === currentName.textContent;
      }) || analysis.lenderComparisons[index];
      if (!comparison) return;

      const title = makeElement("div", "lender-title");
      title.append(
        makeElement("span", "lender-logo", comparison.lenderName.slice(0, 1)),
        makeElement("b", "", comparison.lenderName),
        makeElement("span", "fit-label analysis-fit-" + comparison.overall, overallLabel(comparison.overall))
      );

      const checks = makeElement("div", "analysis-checks");
      comparison.checks.forEach(function (check) { checks.append(makeCheckRow(check)); });

      card.replaceChildren(
        title,
        makeElement("p", "", comparison.explanation),
        checks
      );
      card.classList.add("analysis-lender-card");
    });
  }

  function summaryRecord(analysis) {
    const records = global.MandateSummaryReviewRecords;
    const owner = (global.MandateCreatedDeals && global.MandateCreatedDeals[activeDealId]) ||
      (global.MandateWorkingDeals && global.MandateWorkingDeals[activeDealId]);
    let record = records[activeDealId] || (owner && owner.summary);
    if (!record || !record.text) {
      record = {
        text: analysis.summary.text,
        method: "local_template",
        status: "draft",
        generatedAt: new Date().toISOString(),
        reviewedAt: null,
        basedOnUpdatedAt: analysis.summary.basedOnUpdatedAt || null
      };
    }
    if (record.basedOnUpdatedAt && analysis.summary.basedOnUpdatedAt &&
        record.basedOnUpdatedAt !== analysis.summary.basedOnUpdatedAt && record.status !== "needs_review") {
      record.status = "needs_review";
      record.reviewedAt = null;
    }
    records[activeDealId] = record;
    if (owner) owner.summary = record;
    return record;
  }

  function renderSummaryControls(card, analysis, record) {
    let controls = card.querySelector(".summary-review-controls");
    if (!controls) {
      controls = makeElement("div", "summary-review-controls");
      card.querySelector(".summary-box").insertAdjacentElement("afterend", controls);
    }
    controls.replaceChildren();

    if (editingSummaryFor === activeDealId) {
      const label = makeElement("label", "summary-editor-label", "Edit deal summary");
      const textarea = makeElement("textarea", "summary-editor");
      textarea.id = "summaryDraftInput";
      textarea.rows = 7;
      textarea.maxLength = 4000;
      textarea.setAttribute("aria-describedby", "summaryEditHint");
      textarea.value = record.text;
      label.htmlFor = textarea.id;
      label.append(textarea);
      const hint = makeElement("p", "summary-editor-hint", "Save your changes before marking this summary as reviewed.");
      hint.id = "summaryEditHint";
      const actions = makeElement("div", "summary-review-actions");
      const save = makeElement("button", "button button-dark", "Save draft");
      save.type = "button";
      save.dataset.summaryAction = "save";
      const cancel = makeElement("button", "button-outline", "Cancel");
      cancel.type = "button";
      cancel.dataset.summaryAction = "cancel";
      actions.append(cancel, save);
      controls.append(label, hint, actions);
      return;
    }

    const note = makeElement("p", "summary-state-note");
    if (record.status === "needs_review") {
      note.textContent = "Deal details changed after this summary was prepared. Refresh it to use the latest details, then review the wording.";
    } else if (analysis.summary.reviewItems.length) {
      note.textContent = "Check the flagged information and source notes above as you review this draft.";
    } else {
      note.textContent = "Review the wording and confirm it is accurate before sharing it outside Mandate.";
    }
    controls.append(note);
    const actions = makeElement("div", "summary-review-actions");
    const edit = makeElement("button", "button-outline", "Edit summary");
    edit.type = "button";
    edit.dataset.summaryAction = "edit";
    actions.append(edit);
    if (record.status !== "reviewed") {
      if (record.status === "needs_review") {
        const refresh = makeElement("button", "button button-dark", "Refresh, then review");
        refresh.type = "button";
        refresh.dataset.summaryAction = "refresh";
        actions.append(refresh);
      } else {
        const review = makeElement("button", "button button-dark", "Mark as reviewed");
        review.type = "button";
        review.dataset.summaryAction = "review";
        actions.append(review);
      }
    }
    controls.append(actions);
  }

  function enhanceSummary(analysis) {
    const card = document.querySelector("#appContent .summary-box");
    if (!card) return;
    const summaryCard = card.closest(".detail-card");
    const record = summaryRecord(analysis);
    card.textContent = record.text;
    card.setAttribute("aria-live", "polite");

    const refresh = summaryCard.querySelector("#draftSummary");
    if (refresh) refresh.textContent = "Refresh draft ↗";
    renderSummaryControls(summaryCard, analysis, record);

    let review = document.querySelector("#appContent .summary-review");
    if (!review) {
      review = makeElement("div", "summary-review");
      card.insertAdjacentElement("afterend", review);
    }
    review.replaceChildren(makeElement("b", "", "For adviser review"));

    if (analysis.summary.reviewItems.length) {
      const list = makeElement("ul", "summary-review-list");
      analysis.summary.reviewItems.forEach(function (item) { list.append(makeElement("li", "", item)); });
      review.append(list);
    } else {
      review.append(makeElement("p", "summary-review-clear", "Verify source documents and current lender requirements before sharing."));
    }

    const meta = summaryCard.querySelector(".summary-meta span:first-child");
    if (meta) meta.textContent = "Local template · Saved in this browser session";
    const badge = summaryCard.querySelector(".summary-meta .draft-label");
    if (badge) {
      badge.textContent = record.status === "reviewed" ? "REVIEWED" : record.status === "needs_review" ? "NEEDS REVIEW" : "DRAFT";
      badge.classList.toggle("summary-status-reviewed", record.status === "reviewed");
      badge.classList.toggle("summary-status-needs-review", record.status === "needs_review");
    }
  }

  function enhanceCurrentDeal() {
    const analysis = selectedAnalysis();
    enhanceSummary(analysis);
    enhanceLenderCards(analysis);
    const disclaimer = document.querySelector("#appContent .app-disclaimer");
    if (disclaimer) disclaimer.textContent = analysis.disclaimer;
  }

  global.openDeal = function (id) {
    activeDealId = id;
    return baseOpenDeal(id);
  };

  global.renderDeal = function () {
    const result = baseRenderDeal();
    enhanceCurrentDeal();
    return result;
  };

  global.renderLenders = function () {
    const result = baseRenderLenders();
    enhanceLenderCards(selectedAnalysis());
    return result;
  };

  function refreshSummaryDraft() {
    const analysis = selectedAnalysis();
    const record = summaryRecord(analysis);
    record.text = analysis.summary.text;
    record.method = "local_template";
    record.status = "draft";
    record.generatedAt = new Date().toISOString();
    record.reviewedAt = null;
    record.basedOnUpdatedAt = analysis.summary.basedOnUpdatedAt || null;
    editingSummaryFor = null;
    if (global.MandateRecordActivity) global.MandateRecordActivity("Summary draft refreshed", activeDealId);
    global.renderDeal();
    global.notify("Fresh draft ready · review the wording before marking it reviewed");
  }

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const refresh = target.closest("#draftSummary,[data-summary-action='refresh']");
    if (refresh) {
      event.preventDefault();
      event.stopImmediatePropagation();
      refreshSummaryDraft();
      return;
    }

    const action = target.closest("[data-summary-action]");
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const analysis = selectedAnalysis();
    const record = summaryRecord(analysis);
    if (action.dataset.summaryAction === "edit") {
      editingSummaryFor = activeDealId;
      global.renderDeal();
    } else if (action.dataset.summaryAction === "cancel") {
      editingSummaryFor = null;
      global.renderDeal();
    } else if (action.dataset.summaryAction === "save") {
      const input = document.getElementById("summaryDraftInput");
      const value = input ? input.value.trim() : "";
      if (!value) {
        global.notify("Add summary text before saving");
        return;
      }
      record.text = value;
      record.method = "adviser_edited_local_template";
      record.status = "draft";
      record.reviewedAt = null;
      record.basedOnUpdatedAt = analysis.summary.basedOnUpdatedAt || null;
      editingSummaryFor = null;
      if (global.MandateRecordActivity) global.MandateRecordActivity("Summary draft edited", activeDealId);
      global.renderDeal();
      global.notify("Summary draft saved in this browser session");
    } else if (action.dataset.summaryAction === "review" && record.status !== "needs_review") {
      record.status = "reviewed";
      record.reviewedAt = new Date().toISOString();
      record.basedOnUpdatedAt = analysis.summary.basedOnUpdatedAt || null;
      if (global.MandateRecordActivity) global.MandateRecordActivity("Summary marked reviewed", activeDealId);
      global.renderDeal();
      global.notify("Summary marked as reviewed");
    }
  }, true);
})(window);
