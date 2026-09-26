/* Keep stages, next steps and activity in sync across the local adviser workspace. */
(function (global) {
  "use strict";

  const stages = [
    { key: "draft", label: "Draft" },
    { key: "adviser_review", label: "Adviser review" },
    { key: "ready_to_send", label: "Ready to send" },
    { key: "sent_to_lender", label: "Sent to lender" },
    { key: "more_information_needed", label: "More information needed" },
    { key: "decision_received", label: "Outcome recorded" }
  ];
  const stageByKey = new Map(stages.map(function (stage) { return [stage.key, stage]; }));
  const initialStages = { northstar: "draft", harbour: "adviser_review", ridge: "sent_to_lender" };
  const scenarioByDeal = {
    northstar: "demo-northstar-civil",
    harbour: "demo-harbour-pine-foods",
    ridge: "demo-ridgeway-equipment"
  };
  const statusClassByStage = {
    draft: "status-preparing",
    adviser_review: "status-review",
    ready_to_send: "status-review",
    sent_to_lender: "status-waiting",
    more_information_needed: "status-review",
    decision_received: "status-waiting"
  };

  Object.keys(deals).forEach(function (id) {
    deals[id].workflowStage = initialStages[id] || "draft";
  });

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function idFor(dealId) {
    return dealId || global.MandateActiveDealId || selectedDeal;
  }

  function recordFor(id) {
    return (global.MandateCreatedDeals && global.MandateCreatedDeals[id]) ||
      (global.MandateWorkingDeals && global.MandateWorkingDeals[id]) || null;
  }

  function currentStage(id) {
    const created = global.MandateCreatedDeals && global.MandateCreatedDeals[id];
    const key = created && created.workflow && created.workflow.stage;
    if (stageByKey.has(key)) return key;
    const deal = deals[id];
    if (deal && stageByKey.has(deal.workflowStage)) return deal.workflowStage;
    const working = global.MandateWorkingDeals && global.MandateWorkingDeals[id];
    return working && working.workflow && stageByKey.has(working.workflow.stage) ? working.workflow.stage : initialStages[id] || "draft";
  }

  function stageLabel(key) {
    return (stageByKey.get(key) || stageByKey.get("draft")).label;
  }

  function nextStage(key) {
    const next = {
      draft: "adviser_review",
      adviser_review: "ready_to_send",
      ready_to_send: "sent_to_lender",
      sent_to_lender: "decision_received",
      more_information_needed: "adviser_review",
      decision_received: null
    };
    return next[key] || null;
  }

  function activeAnalysis(id) {
    const record = recordFor(id);
    if (record && global.MandateDealAnalysis) {
      return global.MandateDealAnalysis.analyzeDeal(record, global.MandateSyntheticData.getLenders());
    }
    const scenario = scenarioByDeal[id];
    return scenario && global.MandateDealAnalysis.analyzeSyntheticDeal(scenario);
  }

  function nextAction(id) {
    const analysis = activeAnalysis(id);
    const record = recordFor(id);
    const summary = analysis && analysis.summary;
    const summaryState = global.MandateSummaryReviewRecords && global.MandateSummaryReviewRecords[id];
    if (record && record.review && record.review.conflicts && record.review.conflicts.length) {
      return { title: "Resolve a source conflict", detail: "Deal information needs adviser confirmation", tone: "amber" };
    }
    if (summaryState && summaryState.status === "needs_review") {
      return { title: "Review the updated summary", detail: "Deal details changed since it was prepared", tone: "amber" };
    }
    if (summary && summary.missingDocuments.length) {
      return { title: "Add " + summary.missingDocuments[0].toLowerCase(), detail: "Missing deal document", tone: "doc" };
    }
    if (summary && summary.missingFields.length) {
      return { title: "Complete deal information", detail: summary.missingFields.slice(0, 2).join(" · "), tone: "amber" };
    }
    if (!summaryState || summaryState.status !== "reviewed") {
      return { title: "Review the deal summary", detail: "Check the draft before using it", tone: "green" };
    }
    const stage = currentStage(id);
    if (stage === "draft" || stage === "adviser_review") {
      return { title: "Review lender criteria", detail: "Illustrative comparisons · adviser decides next", tone: "green" };
    }
    if (stage === "ready_to_send") {
      return { title: "Decide whether to approach a lender", detail: "No lender communication is sent by this demo", tone: "green" };
    }
    if (stage === "sent_to_lender") {
      return { title: "Record any response manually", detail: "Workflow note only · no lender connection", tone: "blue" };
    }
    if (stage === "more_information_needed") {
      return { title: "Record information needed", detail: "Then return the deal to adviser review", tone: "amber" };
    }
    return { title: "Review the recorded outcome", detail: "Sample workflow stage only", tone: "blue" };
  }

  function recordActivity(title, dealId, note) {
    const id = idFor(dealId);
    const deal = deals[id];
    if (!deal) return;
    const entry = {
      title: title,
      detail: deal.name + " · " + (note || "by you"),
      when: "Just now",
      icon: deal.initial || deal.name.slice(0, 1).toUpperCase(),
      tone: "green"
    };
    activityItems.unshift(entry);
    const record = recordFor(id);
    if (record) {
      record.workflow = record.workflow || { stage: currentStage(id) };
      record.workflow.activity = record.workflow.activity || [];
      record.workflow.activity.unshift({ title: title, detail: entry.detail, createdAt: new Date().toISOString() });
    }
  }
  global.MandateRecordActivity = recordActivity;

  function updateStage(id, key) {
    if (!deals[id] || !stageByKey.has(key)) return;
    const previous = currentStage(id);
    if (previous === key) return;
    deals[id].workflowStage = key;
    deals[id].stage = stages.findIndex(function (stage) { return stage.key === key; });
    const record = recordFor(id);
    if (record) {
      record.workflow = record.workflow || {};
      record.workflow.stage = key;
      record.workflow.updatedAt = new Date().toISOString();
    }
    recordActivity("Deal stage updated", id, stageLabel(previous) + " → " + stageLabel(key));
    refreshCurrentView(id);
    global.notify("Deal stage set to " + stageLabel(key) + " · no lender communication was sent");
  }

  function refreshCurrentView(id) {
    if (document.querySelector("#appContent .detail-layout, #appContent .pitch-workspace")) global.renderDeal();
    else if (currentPage === "deals") global.renderDeals();
    else if (currentPage === "activity") global.renderActivity();
    else if (currentPage === "lenders") global.renderLenders();
    else global.renderOverview();
    if (id) global.MandateActiveDealId = id;
  }

  function setStatus(element, id) {
    if (!element || !deals[id]) return;
    const stage = currentStage(id);
    element.className = "table-status " + statusClassByStage[stage];
    element.textContent = "● " + stageLabel(stage);
    element.title = "Local workflow stage only; no lender contact is made by this demo.";
  }

  function makeActivityItem(entry) {
    const row = make("div", "activity-item");
    row.append(make("span", "activity-avatar activity-avatar-" + (entry.tone || "green"), entry.icon || "M"));
    const copy = make("div", "activity-copy");
    copy.append(make("b", "", entry.title), make("p", "", entry.detail));
    row.append(copy, make("time", "", entry.when));
    return row;
  }

  function renderRecentActivity(container, entries) {
    if (!container) return;
    container.querySelectorAll(".activity-item").forEach(function (item) { item.remove(); });
    entries.slice(0, 4).forEach(function (entry) { container.append(makeActivityItem(entry)); });
  }

  function renderOverviewTable() {
    const body = document.querySelector("#appContent .deals-panel .deal-table tbody");
    if (!body) return;
    body.replaceChildren();
    Object.entries(deals).forEach(function (entry) {
      const id = entry[0];
      const deal = entry[1];
      const row = make("tr", "deal-row");
      row.dataset.deal = id;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Open deal " + deal.name);
      const companyCell = make("td");
      const company = make("span", "table-company");
      const icon = make("i", "company-icon company-icon-" + (id === "harbour" ? "blue" : id === "ridge" ? "violet" : "orange"), deal.initial);
      const copy = make("span");
      copy.append(make("b", "", deal.name), make("small", "", (deal.location || "Location not provided") + " · " + (deal.purpose || "Purpose not provided").split(" ")[0]));
      company.append(icon, copy);
      companyCell.append(company);
      const amount = make("td", "", deal.amount);
      const status = make("td");
      status.append(make("span", "table-status", ""));
      setStatus(status.firstElementChild, id);
      const updated = make("td", "", recordFor(id) ? "This session" : "Sample deal");
      const open = make("td", "", "↗");
      row.append(companyCell, amount, status, updated, open);
      row.addEventListener("click", function () { global.openDeal(id); });
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          global.openDeal(id);
        }
      });
      body.append(row);
    });
  }

  function renderNextSteps() {
    const panel = document.querySelector("#appContent .attention-panel");
    if (!panel) return;
    panel.querySelectorAll(".task-item,.panel-footer,.next-step-empty").forEach(function (item) { item.remove(); });
    const tasks = Object.keys(deals).map(function (id) {
      return { id: id, deal: deals[id], action: nextAction(id) };
    }).filter(function (item) { return item.action; }).slice(0, 5);
    const count = panel.querySelector(".attention-count");
    if (count) count.textContent = String(tasks.length);
    const attentionStat = document.querySelector("#appContent .stat-grid .stat-card:nth-child(2) .stat-value");
    if (attentionStat) attentionStat.textContent = String(tasks.length).padStart(2, "0");
    const attentionCaption = document.querySelector("#appContent .stat-grid .stat-card:nth-child(2) .stat-caption");
    if (attentionCaption) attentionCaption.textContent = "Suggested adviser actions";
    if (!tasks.length) {
      panel.append(make("p", "next-step-empty", "No suggested next steps. Review each deal before deciding what to do."));
      return;
    }
    tasks.forEach(function (task) {
      const row = make("div", "task-item");
      const iconClass = task.action.tone === "doc" ? "task-doc" : task.action.tone === "blue" ? "task-follow" : "task-doc";
      row.append(make("span", "task-icon " + iconClass, task.action.tone === "doc" ? "▤" : "↗"));
      const text = make("span");
      text.append(make("b", "", task.action.title), make("small", "", task.deal.name + " · " + task.action.detail));
      const open = make("button", "task-arrow", "↗");
      open.type = "button";
      open.dataset.deal = task.id;
      open.setAttribute("aria-label", "Open " + task.deal.name + " to review next step");
      open.addEventListener("click", function () { global.openDeal(task.id); });
      row.append(text, open);
      panel.append(row);
    });
    panel.append(make("p", "next-step-footnote", "Suggestions are local prompts. You decide and record what happens next."));
  }

  function enhanceOverview() {
    renderOverviewTable();
    renderNextSteps();
    renderRecentActivity(document.querySelector("#appContent .activity-panel"), activityItems);
    const nextStepsCopy = document.querySelector("#appContent .attention-panel .panel-heading p");
    if (nextStepsCopy) nextStepsCopy.textContent = "Local prompts based on your current deal reviews.";
    const stat = document.querySelector("#appContent .stat-grid .stat-card:first-child .stat-value");
    if (stat) stat.textContent = String(Object.keys(deals).length).padStart(2, "0");
    const fits = Object.keys(deals).reduce(function (total, id) {
      const analysis = activeAnalysis(id);
      return total + (analysis ? analysis.lenderComparisons.filter(function (comparison) {
        return comparison.overall === "several_criteria_align" || comparison.overall === "possible_criteria_overlap";
      }).length : 0);
    }, 0);
    const fitsStat = document.querySelector("#appContent .stat-grid .stat-card:nth-child(3) .stat-value");
    const fitsCaption = document.querySelector("#appContent .stat-grid .stat-card:nth-child(3) .stat-caption");
    if (fitsStat) fitsStat.textContent = String(fits).padStart(2, "0");
    if (fitsCaption) fitsCaption.textContent = "Illustrative criteria overlaps";
    document.querySelectorAll("#appContent .mobile-deal[data-deal]").forEach(function (button) {
      const deal = deals[button.dataset.deal];
      const detail = button.querySelector("span");
      if (deal && detail) detail.textContent = deal.amount + " · " + stageLabel(currentStage(button.dataset.deal)) + " ↗";
    });
  }

  function dealGroup(stage) {
    if (stage === "draft" || stage === "adviser_review" || stage === "more_information_needed") return "preparing";
    if (stage === "ready_to_send") return "ready";
    if (stage === "sent_to_lender") return "with_lender";
    return "completed";
  }

  function filterCounts() {
    const ids = Object.keys(deals);
    return {
      all: ids.length,
      preparing: ids.filter(function (id) { return dealGroup(currentStage(id)) === "preparing"; }).length,
      ready: ids.filter(function (id) { return dealGroup(currentStage(id)) === "ready"; }).length,
      with_lender: ids.filter(function (id) { return dealGroup(currentStage(id)) === "with_lender"; }).length
    };
  }

  function applyDealFilter(filter) {
    document.querySelectorAll("#appContent .full-table tbody tr[data-deal]").forEach(function (row) {
      row.hidden = filter !== "all" && dealGroup(currentStage(row.dataset.deal)) !== filter;
    });
  }

  function enhanceDeals() {
    const counts = filterCounts();
    const labels = ["All deals", "Preparing", "Ready to send", "With lender"];
    const filters = ["all", "preparing", "ready", "with_lender"];
    document.querySelectorAll("#appContent .filter-chip").forEach(function (chip, index) {
      const filter = filters[index];
      if (!filter) return;
      chip.dataset.workflowFilter = filter;
      chip.replaceChildren(document.createTextNode(labels[index] + " "), make("b", "", counts[filter]));
    });
    document.querySelectorAll("#appContent .full-table tbody tr[data-deal]").forEach(function (row) {
      const id = row.dataset.deal;
      row.dataset.workflowGroup = dealGroup(currentStage(id));
      setStatus(row.querySelector("td:nth-child(4) .table-status"), id);
      const next = row.querySelector("td:nth-child(5)");
      const action = nextAction(id);
      if (next && action) next.textContent = action.title;
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter") global.openDeal(id);
      });
    });
    applyDealFilter("all");
  }

  function addStageRow(list, stage, currentIndex, index) {
    const row = make("div", "stage-row" + (index < currentIndex ? " complete" : index === currentIndex ? " current" : ""));
    const marker = make("span", "stage-dot", index < currentIndex ? "✓" : "");
    const copy = make("span", "stage-copy");
    copy.append(make("b", "", stage.label), make("small", "", index < currentIndex ? "Marked complete" : index === currentIndex ? "Current stage" : "Not started"));
    row.append(marker, copy);
    list.append(row);
  }

  function enhanceDetail() {
    const id = idFor();
    if (!deals[id]) return;
    setStatus(document.querySelector("#appContent .detail-company .table-status"), id);
    const current = currentStage(id);
    const currentIndex = stages.findIndex(function (stage) { return stage.key === current; });
    const progress = Array.from(document.querySelectorAll("#appContent .detail-card")).find(function (card) {
      const heading = card.querySelector(".detail-card-title h2");
      return heading && heading.textContent.trim() === "Deal progress";
    });
    if (progress) {
      const list = progress.querySelector(".stage-list");
      if (list) {
        list.replaceChildren();
        stages.forEach(function (stage, index) { addStageRow(list, stage, currentIndex, index); });
      }
      const menu = progress.querySelector("#stageMenu");
      if (menu) menu.textContent = "Choose stage ↗";
      if (!progress.querySelector(".workflow-stage-picker")) {
        const label = make("label", "workflow-stage-picker", "Recorded workflow stage");
        const select = make("select", "workflow-stage-select");
        select.id = "workflowStageSelect";
        stages.forEach(function (stage) {
          const option = make("option", "", stage.label);
          option.value = stage.key;
          option.selected = stage.key === current;
          select.append(option);
        });
        label.append(select);
        progress.append(label, make("p", "workflow-stage-note", "Local workflow note only. Changing this does not contact a lender or record a real decision."));
      } else {
        progress.querySelector("#workflowStageSelect").value = current;
      }
    }
    const advance = document.getElementById("advanceDeal");
    if (advance) {
      const next = nextStage(current);
      if (!next) {
        advance.textContent = "Workflow complete";
        advance.disabled = true;
      } else {
        advance.disabled = false;
        advance.textContent = "Move to " + stageLabel(next) + " ↗";
        advance.dataset.nextStage = next;
      }
    }
    const activityCard = Array.from(document.querySelectorAll("#appContent .detail-card")).find(function (card) {
      const heading = card.querySelector(".detail-card-title h2");
      return heading && heading.textContent.trim() === "Recent activity";
    });
    renderRecentActivity(activityCard, activityItems);
  }

  function lenderMatchesFilter(lender, filter) {
    if (filter === "all") return true;
    const criteria = lender && lender.criteria || {};
    if (filter === "secured") return Array.isArray(criteria.securityAny) && criteria.securityAny.length > 0;
    if (filter === "asset") {
      return (criteria.purposes || []).concat(criteria.securityAny || []).some(function (value) {
        return /equipment|asset/i.test(value);
      });
    }
    if (filter === "working") return (criteria.purposes || []).some(function (value) { return /working capital/i.test(value); });
    return true;
  }

  function applyLenderFilter(filter) {
    const lenders = new Map(global.MandateSyntheticData.getLenders().map(function (lender) { return [lender.name, lender]; }));
    const cards = Array.from(document.querySelectorAll("#appContent .lender-grid .lender-card"));
    let visible = 0;
    cards.forEach(function (card) {
      const title = card.querySelector(".lender-title b");
      const show = title && lenderMatchesFilter(lenders.get(title.textContent), filter);
      card.hidden = !show;
      if (show) visible += 1;
    });
    let empty = document.querySelector("#appContent .lender-filter-empty");
    if (!visible && !empty) {
      empty = make("p", "lender-filter-empty", "No fictional lender profiles match this filter.");
      document.querySelector("#appContent .lender-grid").append(empty);
    } else if (visible && empty) empty.remove();
  }

  function enhanceLenders() {
    const labels = ["All lenders", "Secured lending", "Asset finance", "Working capital"];
    const keys = ["all", "secured", "asset", "working"];
    document.querySelectorAll("#appContent .filter-chip").forEach(function (chip, index) {
      if (!keys[index]) return;
      chip.dataset.lenderFilter = keys[index];
      chip.setAttribute("aria-pressed", String(chip.classList.contains("active")));
      chip.textContent = labels[index];
    });
    applyLenderFilter("all");
  }

  function dealRecordForEdit(id) {
    const record = recordFor(id);
    if (record) return record;
    const scenario = scenarioByDeal[id];
    const copy = scenario && global.MandateSyntheticData.getDeal(scenario);
    if (copy) {
      global.MandateWorkingDeals[id] = copy;
      return copy;
    }
    return null;
  }

  function renderEditForm(id) {
    const deal = dealRecordForEdit(id);
    const facts = document.querySelector("#appContent .overview-facts");
    if (!deal || !facts) return;
    facts.hidden = true;
    let form = document.getElementById("workflowEditForm");
    if (form) form.remove();
    form = make("form", "workflow-edit-form");
    form.id = "workflowEditForm";
    const values = [
      ["companyName", "Company name", deal.company.name, "text", true],
      ["industry", "Industry", deal.company.industry, "text", false],
      ["location", "Location", deal.company.location, "text", false],
      ["amount", "Requested amount (NZD)", deal.funding.amount, "number", true],
      ["purpose", "Funding purpose", deal.funding.purpose, "text", true],
      ["term", "Requested term (months)", deal.funding.termMonths, "number", false],
      ["security", "Proposed security", (deal.funding.security || []).join(", "), "text", false],
      ["revenue", "Annual revenue (NZD)", deal.financials.annualRevenue.amount, "number", false],
      ["ebitda", "EBITDA (NZD)", deal.financials.ebitda.amount, "number", false]
    ];
    const grid = make("div", "workflow-edit-grid");
    values.forEach(function (item) {
      const label = make("label", "intake-field", item[1]);
      const input = make("input");
      input.name = item[0];
      input.type = item[3];
      input.value = item[2] === null || item[2] === undefined ? "" : String(item[2]);
      if (item[3] === "number") { input.min = item[0] === "amount" ? "1" : "0"; input.step = "1"; }
      if (item[4]) input.required = true;
      label.append(input);
      grid.append(label);
    });
    const note = make("p", "intake-session-note", "Changes stay in this browser session. Source-based values will need review again.");
    const actions = make("div", "intake-actions");
    const cancel = make("button", "button-outline", "Cancel");
    cancel.type = "button";
    cancel.dataset.workflowAction = "cancel-edit";
    const save = make("button", "button button-dark", "Save details");
    save.type = "submit";
    actions.append(cancel, save);
    form.append(grid, note, actions);
    facts.insertAdjacentElement("afterend", form);
  }

  function saveEdit(form) {
    const id = idFor();
    const record = dealRecordForEdit(id);
    if (!record || !form.reportValidity()) return;
    const values = new FormData(form);
    const amount = Number(values.get("amount"));
    const parseOptional = function (name) {
      const value = String(values.get(name) || "").trim();
      return value === "" ? null : Number(value);
    };
    record.company.name = String(values.get("companyName") || "").trim();
    record.company.industry = String(values.get("industry") || "").trim() || null;
    record.company.location = String(values.get("location") || "").trim() || null;
    record.funding.amount = amount;
    record.funding.currency = "NZD";
    record.funding.purpose = String(values.get("purpose") || "").trim();
    record.funding.termMonths = parseOptional("term");
    record.funding.security = String(values.get("security") || "").split(",").map(function (value) { return value.trim(); }).filter(Boolean);
    record.financials.annualRevenue.amount = parseOptional("revenue");
    record.financials.ebitda.amount = parseOptional("ebitda");
    record.updatedAt = new Date().toISOString();
    record.review = record.review || { fields: {}, conflicts: [] };
    record.review.fields = record.review.fields || {};
    record.review.conflicts = record.review.conflicts || [];
    ["company.name", "company.industry", "company.location", "funding.amount", "funding.purpose", "funding.termMonths", "funding.security", "financials.annualRevenue", "financials.ebitda"].forEach(function (field) {
      const conflict = record.review.conflicts.some(function (item) { return item && item.field === field; });
      record.review.fields[field] = { status: conflict ? "conflict" : "confirmed", sourceIds: [] };
    });

    const deal = deals[id];
    deal.name = record.company.name;
    deal.initial = record.company.name.slice(0, 1).toUpperCase();
    deal.industry = record.company.industry || "Industry not provided";
    deal.location = record.company.location || "Location not provided";
    deal.purpose = record.funding.purpose;
    deal.amount = "NZ$" + new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(amount);
    deal.term = record.funding.termMonths ? record.funding.termMonths + " months" : "Not provided";
    deal.security = record.funding.security.length ? record.funding.security.join(" + ") : "Not provided";
    deal.revenue = record.financials.annualRevenue.amount === null ? "Not provided" : "NZ$" + new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(record.financials.annualRevenue.amount);
    deal.ebitda = record.financials.ebitda.amount === null ? "Not provided" : "NZ$" + new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(record.financials.ebitda.amount);
    recordActivity("Deal details updated", id);
    refreshCurrentView(id);
    global.notify("Deal details saved · summary returned to review");
  }

  function renderNoteForm() {
    const id = idFor();
    const card = Array.from(document.querySelectorAll("#appContent .detail-card")).find(function (item) {
      const heading = item.querySelector(".detail-card-title h2");
      return heading && heading.textContent.trim() === "Recent activity";
    });
    if (!card) return;
    let form = document.getElementById("workflowNoteForm");
    if (form) { form.remove(); return; }
    form = make("form", "workflow-note-form");
    form.id = "workflowNoteForm";
    const label = make("label", "summary-editor-label", "Note for this browser session");
    const textarea = make("textarea", "summary-editor");
    textarea.name = "note";
    textarea.rows = 3;
    textarea.maxLength = 300;
    textarea.required = true;
    textarea.setAttribute("placeholder", "Record a reminder or adviser action");
    label.append(textarea);
    const actions = make("div", "summary-review-actions");
    const cancel = make("button", "button-outline", "Cancel");
    cancel.type = "button";
    cancel.dataset.workflowAction = "cancel-note";
    const save = make("button", "button button-dark", "Save note");
    save.type = "submit";
    actions.append(cancel, save);
    form.append(label, make("p", "summary-editor-hint", "This note is added to the activity list; it is not sent to a lender."), actions);
    card.insertBefore(form, card.querySelector(".activity-item"));
    textarea.focus();
  }

  const baseRenderOverview = global.renderOverview;
  const baseRenderDeals = global.renderDeals;
  const baseRenderDeal = global.renderDeal;
  const baseRenderActivity = global.renderActivity;
  const baseRenderLenders = global.renderLenders;
  global.renderOverview = function () { const result = baseRenderOverview(); enhanceOverview(); return result; };
  global.renderDeals = function () { const result = baseRenderDeals(); enhanceDeals(); return result; };
  global.renderDeal = function () { const result = baseRenderDeal(); enhanceDetail(); return result; };
  global.renderActivity = function () {
    const result = baseRenderActivity();
    const description = document.querySelector("#appContent .page-title p");
    if (description) description.textContent = "Session events across your adviser workspace.";
    renderRecentActivity(document.querySelector("#appContent .activity-feed"), activityItems);
    return result;
  };
  global.renderLenders = function () { const result = baseRenderLenders(); enhanceLenders(); return result; };
  global.MandateResetWorkflow = function () {
    Object.keys(deals).forEach(function (id) {
      deals[id].workflowStage = initialStages[id] || "draft";
      deals[id].stage = id === "northstar" ? 0 : id === "harbour" ? 1 : 2;
    });
  };

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const dealFilter = target.closest("[data-workflow-filter]");
    if (dealFilter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll("#appContent [data-workflow-filter]").forEach(function (chip) { chip.classList.toggle("active", chip === dealFilter); });
      applyDealFilter(dealFilter.dataset.workflowFilter);
      return;
    }
    const lenderFilter = target.closest("[data-lender-filter]");
    if (lenderFilter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll("#appContent [data-lender-filter]").forEach(function (chip) {
        const active = chip === lenderFilter;
        chip.classList.toggle("active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
      applyLenderFilter(lenderFilter.dataset.lenderFilter);
      return;
    }
    if (target.closest("#advanceDeal")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const button = target.closest("#advanceDeal");
      if (button.dataset.nextStage) updateStage(idFor(), button.dataset.nextStage);
      return;
    }
    if (target.closest("#stageMenu")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById("workflowStageSelect")?.focus();
      return;
    }
    if (target.closest("#editDeal")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderEditForm(idFor());
      return;
    }
    if (target.closest("#addNote")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderNoteForm();
      return;
    }
    if (target.closest("#addDocument")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const input = document.getElementById("syntheticDocumentInput");
      if (input) input.click();
      else global.notify("Synthetic CSV upload is available from a deal detail page");
      return;
    }
    if (target.closest("[data-workflow-action='cancel-edit']")) {
      event.preventDefault();
      const facts = document.querySelector("#appContent .overview-facts");
      if (facts) facts.hidden = false;
      document.getElementById("workflowEditForm")?.remove();
      return;
    }
    if (target.closest("[data-workflow-action='cancel-note']")) {
      event.preventDefault();
      document.getElementById("workflowNoteForm")?.remove();
    }
  }, true);

  document.addEventListener("change", function (event) {
    if (event.target && event.target.id === "workflowStageSelect") updateStage(idFor(), event.target.value);
  });
  document.addEventListener("submit", function (event) {
    if (event.target && event.target.id === "workflowEditForm") {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveEdit(event.target);
    } else if (event.target && event.target.id === "workflowNoteForm") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const note = String(new FormData(event.target).get("note") || "").trim();
      if (!note) return;
      recordActivity("Adviser note recorded", idFor(), note);
      global.renderDeal();
      global.notify("Note added to this session's activity");
    }
  }, true);
})(window);
