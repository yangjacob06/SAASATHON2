/*
 * Local, deterministic deal summary and illustrative criteria comparison.
 * This is a rules/template layer, not an AI call or credit decision.
 * Load synthetic-data.js before this file in a browser.
 */
(function (global) {
  "use strict";

  function formatMoney(amount, currency) {
    if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
    const formatted = new Intl.NumberFormat("en-NZ", {
      maximumFractionDigits: 0
    }).format(amount);
    return (currency === "NZD" ? "NZ$" : "") + formatted;
  }

  function getFinancial(deal, key) {
    const item = deal && deal.financials && deal.financials[key];
    return item && typeof item.amount === "number" ? item : null;
  }

  function collectMissingDocuments(deal) {
    return (deal.documents || [])
      .filter(function (document) { return document.status === "missing"; })
      .map(function (document) { return document.name; });
  }

  function collectConflicts(deal) {
    const conflicts = (deal.review && deal.review.conflicts) || [];
    return conflicts.map(function (conflict) {
      if (typeof conflict === "string") return conflict;
      return conflict.message || conflict.field || "Conflicting source information needs review";
    });
  }

  function hasConflict(deal, field) {
    const conflicts = (deal.review && deal.review.conflicts) || [];
    return conflicts.some(function (conflict) { return conflict && conflict.field === field; });
  }

  function createSummary(deal) {
    const company = deal.company || {};
    const funding = deal.funding || {};
    const revenue = hasConflict(deal, "financials.annualRevenue") ? null : getFinancial(deal, "annualRevenue");
    const ebitda = hasConflict(deal, "financials.ebitda") ? null : getFinancial(deal, "ebitda");
    const companyName = hasConflict(deal, "company.name") ? null : company.name;
    const purpose = hasConflict(deal, "funding.purpose") ? null : funding.purpose;
    const amount = hasConflict(deal, "funding.amount") ? null : funding.amount;
    const termMonths = hasConflict(deal, "funding.termMonths") ? null : funding.termMonths;
    const security = hasConflict(deal, "funding.security") ? [] : funding.security;
    const missing = [];
    const reviewItems = [];
    const parts = [];

    if (companyName) {
      parts.push(companyName + " is seeking " +
        (formatMoney(amount, funding.currency) || "an amount not provided") +
        (termMonths ? " over " + termMonths + " months" : "") +
        (purpose ? " for " + purpose.toLowerCase() : "") + ".");
    } else {
      if (hasConflict(deal, "company.name")) parts.push("The company name needs adviser confirmation.");
      else { missing.push("Company name"); parts.push("The company name has not been provided."); }
    }

    if (company.industry && company.location && !hasConflict(deal, "company.industry") && !hasConflict(deal, "company.location")) {
      parts.push("The business operates in " + company.industry.toLowerCase() + " from " + company.location + ".");
    } else {
      if (!company.industry && !hasConflict(deal, "company.industry")) missing.push("Industry");
      if (!company.location && !hasConflict(deal, "company.location")) missing.push("Location");
    }

    if (revenue) {
      parts.push("Recorded annual revenue is " + formatMoney(revenue.amount, revenue.currency) +
        (revenue.periodEnd ? " for the period ending " + revenue.periodEnd : "") + ".");
    } else {
      if (!hasConflict(deal, "financials.annualRevenue")) missing.push("Annual revenue");
    }

    if (ebitda) {
      parts.push("Recorded EBITDA is " + formatMoney(ebitda.amount, ebitda.currency) +
        (ebitda.periodEnd ? " for the period ending " + ebitda.periodEnd : "") + ".");
    } else {
      if (!hasConflict(deal, "financials.ebitda")) missing.push("EBITDA");
    }

    if (Array.isArray(security) && security.length) {
      parts.push("Proposed security includes " + security.join(" and ").toLowerCase() + ".");
    } else {
      if (!hasConflict(deal, "funding.security")) missing.push("Proposed security");
    }

    if (!amount && !hasConflict(deal, "funding.amount")) missing.push("Requested amount");
    if (!purpose && !hasConflict(deal, "funding.purpose")) missing.push("Funding purpose");
    if (!termMonths && !hasConflict(deal, "funding.termMonths")) missing.push("Requested term");

    const missingDocuments = collectMissingDocuments(deal);
    const conflicts = collectConflicts(deal);
    if (missing.length) reviewItems.push("Information to complete: " + missing.join(", ") + ".");
    if (missingDocuments.length) reviewItems.push("Documents still needed: " + missingDocuments.join(", ") + ".");
    conflicts.forEach(function (conflict) { reviewItems.push("Resolve conflicting information: " + conflict + "."); });

    return {
      text: parts.join(" "),
      status: "draft",
      method: "local_template",
      missingFields: missing,
      missingDocuments: missingDocuments,
      conflicts: conflicts,
      reviewItems: reviewItems,
      basedOnDealId: deal.id || null,
      basedOnUpdatedAt: deal.updatedAt || null,
      adviserReviewRequired: true
    };
  }

  function normalize(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
  }

  function compareRange(label, value, currency, range, formattedValue) {
    if (typeof value !== "number" || !range || currency !== "NZD") {
      return { criterion: label, outcome: "needs_check", dealValue: value == null ? null : value,
        recordedCriteria: range || null,
        explanation: currency && currency !== "NZD"
          ? "The deal amount is not in NZD, so it cannot be compared with this NZD range."
          : "The deal value or recorded range is missing." };
    }
    const inRange = value >= range.minimum && value <= range.maximum;
    const rangeText = formatMoney(range.minimum, "NZD") + "–" + formatMoney(range.maximum, "NZD");
    const boundaryText = value === range.minimum
      ? " It is exactly at the inclusive minimum."
      : value === range.maximum
        ? " It is exactly at the inclusive maximum."
        : "";
    return {
      criterion: label,
      outcome: inRange ? "matches" : "outside_criteria",
      dealValue: value,
      recordedCriteria: { currency: "NZD", minimum: range.minimum, maximum: range.maximum },
      explanation: inRange
        ? (formattedValue || formatMoney(value, "NZD")) + " is within the recorded " + rangeText + " range." + boundaryText
        : (formattedValue || formatMoney(value, "NZD")) + " is outside the recorded " + rangeText + " range."
    };
  }

  function compareTerm(value, range) {
    if (typeof value !== "number" || !range) {
      return { criterion: "termMonths", outcome: "needs_check", dealValue: value == null ? null : value,
        recordedCriteria: range || null,
        explanation: "The requested term or recorded term range is missing." };
    }
    const inRange = value >= range.minimum && value <= range.maximum;
    const boundaryText = value === range.minimum
      ? " It is exactly at the inclusive minimum."
      : value === range.maximum
        ? " It is exactly at the inclusive maximum."
        : "";
    return {
      criterion: "termMonths",
      outcome: inRange ? "matches" : "outside_criteria",
      dealValue: value,
      recordedCriteria: { minimum: range.minimum, maximum: range.maximum },
      explanation: inRange
        ? value + " months is within the recorded " + range.minimum + "–" + range.maximum + " month range." + boundaryText
        : value + " months is outside the recorded " + range.minimum + "–" + range.maximum + " month range."
    };
  }

  function comparePurpose(value, accepted) {
    if (!value || !Array.isArray(accepted) || !accepted.length) {
      return { criterion: "purpose", outcome: "needs_check", dealValue: value || null,
        recordedCriteria: accepted || [],
        explanation: "The deal purpose or recorded purpose criteria are missing." };
    }
    const dealPurpose = normalize(value);
    const matchedCriteria = accepted.filter(function (purpose) {
      const criterionPurpose = normalize(purpose);
      return dealPurpose === criterionPurpose || dealPurpose.includes(criterionPurpose) || criterionPurpose.includes(dealPurpose);
    });
    const matches = matchedCriteria.length > 0;
    return {
      criterion: "purpose",
      outcome: matches ? "matches" : "outside_criteria",
      dealValue: value,
      recordedCriteria: accepted.slice(),
      matchedCriteria: matchedCriteria,
      explanation: matches
        ? "The stated purpose overlaps with this recorded preference: " + matchedCriteria.join("; ") + "."
        : "The stated purpose does not match the recorded purpose preferences."
    };
  }

  function compareSecurity(values, accepted) {
    if (!Array.isArray(values) || !values.length || !Array.isArray(accepted) || !accepted.length) {
      return { criterion: "security", outcome: "needs_check", dealValue: values || null,
        recordedCriteria: accepted || [],
        explanation: "The proposed security or recorded security preferences are missing." };
    }
    const dealSecurity = values.map(normalize);
    const matchedCriteria = accepted.filter(function (security) {
      const criterionSecurity = normalize(security);
      return dealSecurity.some(function (item) {
        return item === criterionSecurity || item.includes(criterionSecurity) || criterionSecurity.includes(item);
      });
    });
    const matches = matchedCriteria.length > 0;
    return {
      criterion: "security",
      outcome: matches ? "matches" : "outside_criteria",
      dealValue: values.slice(),
      recordedCriteria: accepted.slice(),
      matchedCriteria: matchedCriteria,
      explanation: matches
        ? "Proposed security overlaps with these recorded preferences: " + matchedCriteria.join("; ") + "."
        : "No proposed security type matches the recorded preferences."
    };
  }

  function compareLender(deal, lender) {
    const funding = deal.funding || {};
    const criteria = lender.criteria || {};
    const checks = [
      compareRange("amountNZD", funding.amount, funding.currency, criteria.amountNZD,
        formatMoney(funding.amount, funding.currency)),
      comparePurpose(funding.purpose, criteria.purposes),
      compareSecurity(funding.security, criteria.securityAny),
      compareTerm(funding.termMonths, criteria.termMonths)
    ];
    const conflictEntries = (deal.review && deal.review.conflicts) || [];
    const fieldsByCriterion = { amountNZD: "funding.amount", purpose: "funding.purpose", security: "funding.security", termMonths: "funding.termMonths" };
    checks.forEach(function (check) {
      const conflict = conflictEntries.find(function (item) { return item && item.field === fieldsByCriterion[check.criterion]; });
      if (conflict) {
        check.outcome = "needs_check";
        check.explanation = (conflict.message || "Conflicting source values need adviser review") + " Confirm the deal value before comparing.";
      }
    });
    const matchingCount = checks.filter(function (check) { return check.outcome === "matches"; }).length;
    const outsideCount = checks.filter(function (check) { return check.outcome === "outside_criteria"; }).length;
    const needsCheckCount = checks.filter(function (check) { return check.outcome === "needs_check"; }).length;
    let overall;
    if (matchingCount === checks.length) overall = "several_criteria_align";
    else if (matchingCount > 0 && outsideCount === 0) overall = "possible_criteria_overlap";
    else if (matchingCount > 0) overall = "some_criteria_overlap_gaps_to_check";
    else if (needsCheckCount > 0) overall = "needs_check";
    else overall = "no_recorded_criteria_overlap";

    return {
      lenderId: lender.id,
      lenderName: lender.name,
      synthetic: lender.synthetic === true,
      criteriaAsAt: lender.criteriaAsAt || null,
      overall: overall,
      counts: { matches: matchingCount, outsideCriteria: outsideCount, needsCheck: needsCheckCount },
      checks: checks,
      explanation: overall === "several_criteria_align"
        ? "Several recorded criteria align with the deal details. Verify the criteria directly with the lender."
        : overall === "possible_criteria_overlap"
          ? "Some recorded criteria align; other details need checking. Verify the criteria directly with the lender."
          : overall === "some_criteria_overlap_gaps_to_check"
            ? "Some criteria align, and at least one recorded criterion does not. Review the gaps before deciding whether to investigate further."
            : overall === "needs_check"
              ? "There is not enough information to compare all recorded criteria."
              : "The supplied details do not overlap with the recorded criteria."
    };
  }

  function analyzeDeal(deal, lenders) {
    if (!deal || typeof deal !== "object") throw new TypeError("analyzeDeal requires a deal object");
    if (!Array.isArray(lenders)) throw new TypeError("analyzeDeal requires a lender criteria array");
    return {
      dealId: deal.id || null,
      synthetic: deal.synthetic === true,
      summary: createSummary(deal),
      lenderComparisons: lenders.map(function (lender) { return compareLender(deal, lender); }),
      disclaimer: "Illustrative comparison of supplied deal details with recorded criteria. Not a credit decision, offer, or approval prediction. Adviser review is required; confirm current criteria with each lender directly."
    };
  }

  function analyzeSyntheticDeal(id) {
    const data = global.MandateSyntheticData;
    if (!data) throw new Error("Load synthetic-data.js before deal-analysis.js and analyzeSyntheticDeal().");
    const deal = data.getDeal(id);
    if (!deal) throw new RangeError("No synthetic deal found with id: " + id);
    return analyzeDeal(deal, data.getLenders());
  }

  global.MandateDealAnalysis = Object.freeze({
    analyzeDeal: analyzeDeal,
    analyzeSyntheticDeal: analyzeSyntheticDeal
  });
})(window);
