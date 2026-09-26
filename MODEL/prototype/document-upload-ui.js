/* Read fictional CSV examples in the browser and keep extracted values reviewable. */
(function (global) {
  "use strict";

  const sampleScenarioByDeal = {
    northstar: "demo-northstar-civil",
    harbour: "demo-harbour-pine-foods",
    ridge: "demo-ridgeway-equipment"
  };
  global.MandateWorkingDeals = global.MandateWorkingDeals || {};
  global.MandateUploadState = global.MandateUploadState || {};

  function currentDeal() {
    const id = global.MandateActiveDealId;
    if (global.MandateCreatedDeals && global.MandateCreatedDeals[id]) return global.MandateCreatedDeals[id];
    if (!global.MandateWorkingDeals[id]) {
      const scenarioId = sampleScenarioByDeal[id];
      global.MandateWorkingDeals[id] = global.MandateSyntheticData.getDeal(scenarioId);
    }
    return global.MandateWorkingDeals[id];
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function fieldLabel(path) {
    return ({
      "company.name": "Company name",
      "company.industry": "Industry",
      "company.location": "Location",
      "funding.amount": "Requested amount",
      "funding.purpose": "Funding purpose",
      "funding.termMonths": "Requested term",
      "funding.security": "Proposed security",
      "financials.annualRevenue": "Annual revenue",
      "financials.ebitda": "EBITDA"
    })[path] || path;
  }

  function displayValue(path, value, currency) {
    if (value === null || value === undefined || value === "") return "Not provided";
    if ((path === "funding.amount" || path.indexOf("financials.") === 0) && typeof value === "number") {
      return (currency === "NZD" || path !== "funding.amount" ? "NZ$" : "") +
        new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(value);
    }
    if (path === "funding.termMonths") return value + " months";
    return Array.isArray(value) ? value.join(", ") : String(value);
  }

  function readField(deal, field) {
    if (field.indexOf("company.") === 0) return deal.company[field.slice("company.".length)];
    if (field === "funding.amount") return deal.funding.amount;
    if (field === "funding.purpose") return deal.funding.purpose;
    if (field === "funding.termMonths") return deal.funding.termMonths;
    if (field === "funding.security") return deal.funding.security;
    if (field === "financials.annualRevenue") return deal.financials.annualRevenue.amount;
    if (field === "financials.ebitda") return deal.financials.ebitda.amount;
    return null;
  }

  function writeField(deal, field, value, sourceIds) {
    if (field.indexOf("company.") === 0) deal.company[field.slice("company.".length)] = value;
    else if (field === "funding.amount") deal.funding.amount = Number(value);
    else if (field === "funding.purpose") deal.funding.purpose = String(value);
    else if (field === "funding.termMonths") deal.funding.termMonths = Number(value);
    else if (field === "funding.security") deal.funding.security = Array.isArray(value) ? value.slice() : [String(value)];
    else if (field === "financials.annualRevenue" || field === "financials.ebitda") {
      const key = field.split(".")[1];
      deal.financials[key].amount = Number(value);
      deal.financials[key].currency = "NZD";
      deal.financials[key].sourceIds = (sourceIds || []).slice();
    }
  }

  function sameValue(field, left, right) {
    const normalize = function (value) { return String(value).trim().toLowerCase(); };
    if (field === "funding.security") {
      const a = (Array.isArray(left) ? left : [left]).map(normalize).sort();
      const b = (Array.isArray(right) ? right : [right]).map(normalize).sort();
      return JSON.stringify(a) === JSON.stringify(b);
    }
    if (typeof left === "number" || typeof right === "number") return Number(left) === Number(right);
    return normalize(left) === normalize(right);
  }

  function ensureCandidates(deal) {
    deal.review = deal.review || {};
    deal.review.proposedValues = deal.review.proposedValues || {};
    deal.review.fields = deal.review.fields || {};
    deal.review.conflicts = deal.review.conflicts || [];
    deal.review.confirmedFields = deal.review.confirmedFields || [];
    (deal.documents || []).forEach(function (documentRecord) {
      (documentRecord.extractedFields || []).forEach(function (fact) {
        const fieldCandidates = deal.review.proposedValues[fact.field] || (deal.review.proposedValues[fact.field] = []);
        if (!fieldCandidates.some(function (candidate) { return candidate.sourceIds.includes(documentRecord.id); })) {
          fieldCandidates.push({ value: fact.value, sourceIds: [documentRecord.id], sourceLabel: documentRecord.name });
        }
      });
    });
  }

  function candidateValues(deal, field) {
    return (deal.review && deal.review.proposedValues && deal.review.proposedValues[field]) || [];
  }

  function showMessage(message, tone) {
    const area = document.getElementById("documentUploadStatus");
    if (!area) return;
    area.className = "document-upload-status" + (tone ? " document-upload-status-" + tone : "");
    area.textContent = message;
  }

  function renderUploadedFiles(deal) {
    const list = document.getElementById("uploadedDocumentList");
    if (!list) return;
    list.replaceChildren();
    const uploaded = (deal.documents || []).filter(function (item) { return item.sourceType === "local_file"; });
    if (!uploaded.length) {
      list.append(node("p", "upload-empty", "No files selected yet."));
      return;
    }
    list.append(node("h3", "", "Files read in this session"));
    uploaded.forEach(function (item) {
      const row = node("div", "uploaded-file-row");
      row.append(node("span", "uploaded-file-name", item.name));
      row.append(node("span", "uploaded-file-state", (item.extractedFields || []).length + " details read locally"));
      list.append(row);
    });
  }

  function renderExtractedFacts(deal) {
    const container = document.getElementById("extractedFacts");
    if (!container) return;
    container.replaceChildren();
    ensureCandidates(deal);
    const groups = new Map();
    (deal.documents || []).forEach(function (documentRecord) {
      (documentRecord.extractedFields || []).forEach(function (fact) {
        if (!groups.has(fact.field)) groups.set(fact.field, []);
        groups.get(fact.field).push({ fact: fact, document: documentRecord });
      });
    });
    if (!groups.size) return;

    container.append(node("h3", "", "Extracted details and sources"));
    groups.forEach(function (sources, field) {
      const fieldReview = (deal.review.fields && deal.review.fields[field]) || {};
      const conflict = (deal.review.conflicts || []).find(function (item) { return item.field === field; });
      const fieldBlock = node("section", "extracted-field" + (conflict ? " extracted-field-conflict" : ""));
      const title = node("div", "extracted-field-title");
      title.append(node("b", "", fieldLabel(field)));
      title.append(node("span", "analysis-result analysis-result-" + (conflict ? "needs_check" : fieldReview.status === "confirmed" ? "matches" : "needs_check"), conflict ? "Conflict · needs review" : fieldReview.status === "confirmed" ? "Confirmed" : "Review value"));
      fieldBlock.append(title);

      const current = readField(deal, field);
      const currentRow = node("div", "extracted-source-row");
      const currentText = "Deal details · " + displayValue(field, current, deal.funding && deal.funding.currency);
      currentRow.append(node("span", "extracted-source-copy", currentText));
      const hasCurrent = current !== null && current !== undefined && current !== "" && !(Array.isArray(current) && current.length === 0);
      if (hasCurrent && (conflict || fieldReview.status !== "confirmed")) {
        const keep = node("button", "review-value-button", "Keep / confirm deal value");
        keep.type = "button";
        keep.dataset.reviewField = field;
        keep.dataset.reviewChoice = "current";
        currentRow.append(keep);
      }
      fieldBlock.append(currentRow);

      sources.forEach(function (source) {
        const proposal = candidateValues(deal, field).find(function (item) {
          return item.sourceIds && item.sourceIds.includes(source.document.id) && sameValue(field, item.value, source.fact.value);
        });
        const sourceRow = node("div", "extracted-source-row");
        sourceRow.append(node("span", "extracted-source-copy", source.document.name + " · " + displayValue(field, source.fact.value, source.fact.currency || deal.funding.currency)));
        if (proposal && (conflict || fieldReview.status !== "confirmed")) {
          const use = node("button", "review-value-button", "Use this value");
          use.type = "button";
          use.dataset.reviewField = field;
          use.dataset.reviewChoice = source.document.id;
          sourceRow.append(use);
        }
        fieldBlock.append(sourceRow);
      });
      container.append(fieldBlock);
    });
  }

  function candidateFor(deal, field, choice) {
    if (choice === "current") return { value: readField(deal, field), sourceIds: [] };
    return candidateValues(deal, field).find(function (item) { return item.sourceIds.includes(choice); });
  }

  function resolveField(field, choice) {
    const deal = currentDeal();
    if (!deal) return;
    const candidate = candidateFor(deal, field, choice);
    if (!candidate) return;
    const previousConflict = (deal.review.conflicts || []).find(function (item) { return item.field === field; });
    const value = candidate.value;
    writeField(deal, field, value, candidate.sourceIds);
    deal.review.proposedValues[field] = [];
    deal.review.conflicts = (deal.review.conflicts || []).filter(function (item) { return item.field !== field; });
    deal.review.fields[field] = { status: "confirmed", value: value, sourceIds: candidate.sourceIds.slice() };
    if (!deal.review.confirmedFields.includes(field)) deal.review.confirmedFields.push(field);
    deal.review.resolutions = deal.review.resolutions || [];
    deal.review.resolutions.push({ field: field, chosenValue: value, sourceIds: candidate.sourceIds.slice(), resolvedAt: new Date().toISOString(), priorConflict: previousConflict || null });
    deal.updatedAt = new Date().toISOString();
    if (global.MandateRecordActivity) global.MandateRecordActivity("Deal information confirmed", deal.id, fieldLabel(field));
    global.renderDeal();
    global.notify("" + fieldLabel(field) + " confirmed for review");
  }

  function parseCsv(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(function (line) { return line.trim() !== ""; });
    if (lines.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
    function cells(line) {
      return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(function (cell) {
        let value = cell.trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/""/g, '"');
        return value.trim();
      });
    }
    const headers = cells(lines[0]).map(function (header) { return header.toLowerCase(); });
    if (!headers.includes("field") || !headers.includes("value")) throw new Error("Use the supplied synthetic CSV format with field and value columns.");
    return lines.slice(1).map(function (line) {
      const values = cells(line);
      const row = {};
      headers.forEach(function (header, index) { row[header] = values[index] || ""; });
      return row;
    }).filter(function (row) { return row.field && row.value; });
  }

  const supportedFields = new Set([
    "company.name", "company.industry", "company.location", "funding.amount",
    "funding.purpose", "funding.termMonths", "funding.security",
    "financials.annualRevenue", "financials.ebitda"
  ]);

  function convertRow(row) {
    const field = row.field.trim();
    if (!supportedFields.has(field)) return null;
    let value = row.value.trim();
    if (["funding.amount", "funding.termMonths", "financials.annualRevenue", "financials.ebitda"].includes(field)) {
      value = Number(value.replace(/[$,\s]/g, ""));
      if (!Number.isFinite(value)) throw new Error("A numeric value in " + fieldLabel(field) + " could not be read.");
    }
    if (field === "funding.security") value = value.split(";").map(function (item) { return item.trim(); }).filter(Boolean);
    return { field: field, value: value, currency: row.currency || null, periodEnd: row.period_end || null };
  }

  function combineRows(rows) {
    const grouped = new Map();
    rows.map(convertRow).filter(Boolean).forEach(function (fact) {
      if (!grouped.has(fact.field)) grouped.set(fact.field, []);
      const values = grouped.get(fact.field);
      if (fact.field === "funding.security") values.push.apply(values, fact.value);
      else values.push(fact.value);
      const existing = values;
      grouped.set(fact.field, existing);
    });
    return Array.from(grouped.entries()).map(function (entry) {
      const field = entry[0];
      const values = entry[1];
      if (field === "funding.security") return { field: field, value: Array.from(new Set(values)) };
      if (values.some(function (value) { return !sameValue(field, values[0], value); })) {
        throw new Error("This file has more than one different value for " + fieldLabel(field) + ". Keep one value per field in each CSV.");
      }
      return { field: field, value: values[0] };
    });
  }

  function proposedValues(deal, field) {
    deal.review.proposedValues = deal.review.proposedValues || {};
    deal.review.proposedValues[field] = deal.review.proposedValues[field] || [];
    return deal.review.proposedValues[field];
  }

  function recordConflict(deal, field, current, extracted, documentId, fileName) {
    const conflicts = deal.review.conflicts || (deal.review.conflicts = []);
    let conflict = conflicts.find(function (item) { return item.field === field; });
    if (!conflict) {
      conflict = {
        field: field,
        message: "Sources show different values for " + fieldLabel(field),
        values: current === null || current === undefined || current === "" ? [] : [{ value: current, sourceIds: [], sourceLabel: "Deal details" }]
      };
      conflicts.push(conflict);
    }
    const candidates = proposedValues(deal, field);
    if (!candidates.some(function (item) { return item.sourceIds.includes(documentId); })) {
      candidates.push({ value: extracted, sourceIds: [documentId], sourceLabel: fileName });
    }
    if (!conflict.values.some(function (item) { return item.sourceIds.includes(documentId); })) {
      conflict.values.push({ value: extracted, sourceIds: [documentId], sourceLabel: fileName });
    }
    deal.review.fields[field] = { status: "conflict", sourceIds: conflict.values.flatMap(function (item) { return item.sourceIds; }) };
  }

  function expectedDocumentFor(deal, kind) {
    const names = {
      management_accounts: ["management accounts"],
      cash_flow_forecast: ["cash flow forecast"],
      equipment_quote: ["security information", "equipment quote"],
      property_valuation: ["property valuation"],
      company_overview: ["company overview"]
    }[kind] || [];
    return (deal.documents || []).find(function (documentRecord) {
      return documentRecord.sourceType === "expected" && names.some(function (name) { return documentRecord.name.toLowerCase().includes(name); });
    });
  }

  function addUploadedDocument(deal, fileName, facts) {
    const id = "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    const kind = fileName.toLowerCase().replace(/^.*kowhai-/, "").replace(/\.csv$/, "").replace(/-/g, "_");
    const documentRecord = {
      id: id,
      name: fileName,
      kind: kind,
      sourceType: "local_file",
      status: "processed",
      extractedFields: facts.map(function (fact) {
        return { field: fact.field, value: fact.value, currency: fact.currency || (fact.field.indexOf("financials.") === 0 ? "NZD" : null), periodEnd: fact.periodEnd || null };
      })
    };
    deal.documents.push(documentRecord);

    const expected = expectedDocumentFor(deal, kind);
    if (expected) {
      expected.status = "provided";
      expected.sourceIds = Array.from(new Set((expected.sourceIds || []).concat([id])));
    }

    facts.forEach(function (fact) {
      const current = readField(deal, fact.field);
      const hasValue = current !== null && current !== undefined && current !== "" && !(Array.isArray(current) && current.length === 0);
      const same = hasValue && sameValue(fact.field, current, fact.value);
      const candidates = proposedValues(deal, fact.field);
      if (!candidates.some(function (candidate) { return candidate.sourceIds.includes(id); })) {
        candidates.push({ value: fact.value, sourceIds: [id], sourceLabel: fileName });
      }

      if (hasValue && !same) {
        recordConflict(deal, fact.field, current, fact.value, id, fileName);
      } else if (!hasValue) {
        deal.review.fields[fact.field] = { status: "needs_review", sourceIds: [id] };
      } else {
        deal.review.fields[fact.field] = { status: "needs_review", sourceIds: Array.from(new Set((deal.review.fields[fact.field] && deal.review.fields[fact.field].sourceIds || []).concat([id]))) };
        if (fact.field.indexOf("financials.") === 0) {
          const key = fact.field.split(".")[1];
          deal.financials[key].sourceIds = Array.from(new Set((deal.financials[key].sourceIds || []).concat([id])));
        }
      }
    });
    // Compare this file with earlier extracted proposals as well as the canonical deal value.
    // This catches disagreements even when the adviser left the deal field blank.
    facts.forEach(function (fact) {
      const candidates = proposedValues(deal, fact.field);
      const uniqueValues = [];
      candidates.forEach(function (candidate) {
        if (!uniqueValues.some(function (item) { return sameValue(fact.field, item.value, candidate.value); })) uniqueValues.push(candidate);
      });
      const canonical = readField(deal, fact.field);
      const hasCanonical = canonical !== null && canonical !== undefined && canonical !== "" && !(Array.isArray(canonical) && !canonical.length);
      if (uniqueValues.length > 1 || (hasCanonical && uniqueValues.some(function (candidate) { return !sameValue(fact.field, canonical, candidate.value); }))) {
        const conflict = {
          field: fact.field,
          message: "Sources show different values for " + fieldLabel(fact.field),
          values: []
        };
        if (hasCanonical) conflict.values.push({ value: canonical, sourceIds: [], sourceLabel: "Deal details" });
        candidates.forEach(function (candidate) {
          if (!conflict.values.some(function (item) { return sameValue(fact.field, item.value, candidate.value) && item.sourceIds.join() === candidate.sourceIds.join(); })) {
            conflict.values.push({ value: candidate.value, sourceIds: candidate.sourceIds.slice(), sourceLabel: candidate.sourceLabel });
          }
        });
        deal.review.conflicts = (deal.review.conflicts || []).filter(function (item) { return item.field !== fact.field; });
        deal.review.conflicts.push(conflict);
        deal.review.fields[fact.field] = { status: "conflict", sourceIds: candidates.flatMap(function (item) { return item.sourceIds; }) };
      }
    });
    deal.updatedAt = new Date().toISOString();
  }

  async function processFiles(files) {
    const deal = currentDeal();
    if (!deal) return;
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (selected.length > 5) { showMessage("Choose up to five CSV files at a time.", "error"); return; }
    if (selected.some(function (file) { return !file.name.toLowerCase().endsWith(".csv") || file.size > 1024 * 1024; })) {
      showMessage("Use CSV sample files smaller than 1 MB. Other formats need the future API.", "error");
      return;
    }

    const status = document.getElementById("documentUploadStatus");
    if (status) {
      status.className = "document-upload-status document-upload-status-working";
      status.textContent = "Reading " + selected.length + " synthetic CSV " + (selected.length === 1 ? "file" : "files") + " in this browser…";
    }
    const input = document.getElementById("syntheticDocumentInput");
    const newFiles = selected.filter(function (file) {
      return !(deal.documents || []).some(function (item) { return item.sourceType === "local_file" && item.name === file.name; });
    });
    if (!newFiles.length) { showMessage("Those files are already in this deal.", "error"); return; }

    const parsed = [];
    try {
      for (const file of newFiles) {
        const text = await file.text();
        const facts = combineRows(parseCsv(text));
        if (!facts.length) throw new Error(file.name + " did not contain any supported deal fields.");
        parsed.push({ file: file, facts: facts });
      }
      await new Promise(function (resolve) { global.setTimeout(resolve, 450); });
      parsed.forEach(function (item) { addUploadedDocument(deal, item.file.name, item.facts); });
      if (global.MandateRecordActivity) global.MandateRecordActivity("Synthetic documents added", deal.id, parsed.length + " file" + (parsed.length === 1 ? "" : "s"));
      global.renderDeal();
      showMessage("Read " + parsed.length + " file" + (parsed.length === 1 ? "" : "s") + " locally. Review each extracted value and source below.", "success");
    } catch (error) {
      showMessage(error.message || "The sample file could not be read. Choose one of the supplied CSV examples.", "error");
    } finally {
      if (input) input.value = "";
    }
  }

  function renderDocumentPanel() {
    const deal = currentDeal();
    if (!deal) return;
    const checklist = document.querySelector("#appContent .detail-column:first-child .detail-card:last-child");
    if (!checklist) return;
    const heading = checklist.querySelector(".detail-card-title h2");
    const button = checklist.querySelector("#addDocument");
    if (heading) heading.textContent = "Deal pack and documents";
    if (button) button.textContent = "＋ Upload synthetic CSV";

    checklist.querySelectorAll(".document-row").forEach(function (row, index) {
      const record = deal.documents[index];
      if (!record) return;
      const title = row.querySelector("b");
      const note = row.querySelector("small");
      const status = row.querySelector(".doc-status");
      if (title) title.textContent = record.name;
      if (note) note.textContent = record.sourceType === "local_file"
        ? "Fictional file read in this browser"
        : record.status === "missing"
          ? "No file attached · use a synthetic sample below"
          : "Fictional sample item · no real file attached";
      if (status) {
        const provided = record.status === "provided" || record.status === "processed";
        status.textContent = provided ? "Added" : "Needed";
        status.classList.toggle("missing", !provided);
      }
    });

    let area = checklist.querySelector(".document-upload-area");
    if (!area) {
      area = node("div", "document-upload-area");
      const rows = checklist.querySelectorAll(".document-row");
      if (rows.length) rows[rows.length - 1].insertAdjacentElement("afterend", area);
      else checklist.append(area);
    }
    area.replaceChildren();
    const input = node("input", "visually-hidden");
    input.type = "file";
    input.id = "syntheticDocumentInput";
    input.accept = ".csv,text/csv";
    input.multiple = true;
    input.setAttribute("aria-label", "Choose synthetic CSV documents");

    const drop = node("div", "document-drop-zone");
    drop.id = "documentDropZone";
    drop.tabIndex = 0;
    drop.setAttribute("role", "button");
    drop.setAttribute("aria-label", "Choose or drop synthetic CSV documents");
    drop.append(node("b", "", "Choose or drop CSV files"));
    drop.append(node("span", "", "Synthetic files are read in this browser only. No data is sent to an API yet."));

    const samples = node("div", "sample-document-links");
    samples.append(node("span", "", "Kowhai sample pack · use with “Fill fictional example”:"));
    [
      ["Company overview", "kowhai-company-overview.csv"],
      ["Management accounts", "kowhai-management-accounts.csv"],
      ["Accountant summary · includes a discrepancy", "kowhai-accountant-summary.csv"],
      ["Equipment quote", "kowhai-equipment-quote.csv"]
    ].forEach(function (sample) {
      const link = node("a", "", sample[0]);
      link.href = "samples/" + sample[1];
      link.download = sample[1];
      samples.append(link);
    });

    const status = node("p", "document-upload-status");
    status.id = "documentUploadStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const uploaded = node("div", "uploaded-document-list");
    uploaded.id = "uploadedDocumentList";
    const facts = node("div", "extracted-facts");
    facts.id = "extractedFacts";
    area.append(input, drop, samples, status, uploaded, facts);
    renderUploadedFiles(deal);
    renderExtractedFacts(deal);
  }

  const baseRenderDeal = global.renderDeal;
  global.renderDeal = function () {
    const result = baseRenderDeal();
    renderDocumentPanel();
    return result;
  };

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const uploadButton = target.closest("#addDocument");
    if (uploadButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const input = document.getElementById("syntheticDocumentInput");
      if (input) input.click();
      return;
    }
    const drop = target.closest("#documentDropZone");
    if (drop) {
      const input = document.getElementById("syntheticDocumentInput");
      if (input) input.click();
      return;
    }
    const reviewButton = target.closest("[data-review-field]");
    if (reviewButton) {
      event.preventDefault();
      resolveField(reviewButton.dataset.reviewField, reviewButton.dataset.reviewChoice);
    }
  }, true);

  document.addEventListener("change", function (event) {
    if (event.target && event.target.id === "syntheticDocumentInput") processFiles(event.target.files);
  });

  document.addEventListener("keydown", function (event) {
    if (event.target && event.target.id === "documentDropZone" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const input = document.getElementById("syntheticDocumentInput");
      if (input) input.click();
    }
  });

  document.addEventListener("dragover", function (event) {
    if (event.target instanceof Element && event.target.closest("#documentDropZone")) event.preventDefault();
  });
  document.addEventListener("drop", function (event) {
    const target = event.target instanceof Element ? event.target.closest("#documentDropZone") : null;
    if (!target) return;
    event.preventDefault();
    processFiles(event.dataTransfer.files);
  });
})(window);
