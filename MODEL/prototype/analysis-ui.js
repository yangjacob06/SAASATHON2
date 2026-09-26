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
  const baseOpenDeal = global.openDeal;
  const baseRenderDeal = global.renderDeal;
  const baseRenderLenders = global.renderLenders;

  function selectedAnalysis() {
    const createdDeal = global.MandateCreatedDeals && global.MandateCreatedDeals[activeDealId];
    if (createdDeal) {
      return global.MandateDealAnalysis.analyzeDeal(createdDeal, global.MandateSyntheticData.getLenders());
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
    analysis.lenderComparisons.forEach(function (comparison, index) {
      const card = cards[index];
      if (!card) return;

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

  function enhanceSummary(analysis) {
    const card = document.querySelector("#appContent .summary-box");
    if (!card) return;
    card.textContent = analysis.summary.text;

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

    const meta = document.querySelector("#appContent .summary-meta span:first-child");
    if (meta) meta.textContent = "Local template from fictional deal details · Review before use";
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
})(window);
