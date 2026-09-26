import type { Application, ApplicationDocument } from "../types";
import { PURPOSE_LABEL } from "../status";
import { legacyAnalysis } from "./analysis.js";
import { searchPackages } from "./packages.js";

interface SyntheticCheck {
  criterion: string;
  outcome: "matches" | "outside_criteria" | "needs_check";
  explanation: string;
}

interface SyntheticComparison {
  lenderName: string;
  overall: string;
  explanation: string;
  checks: SyntheticCheck[];
  synthetic: boolean;
}

interface SyntheticAnalysis {
  synthetic: boolean;
  summary: { text: string; missingFields: string[]; conflicts: string[]; reviewItems: string[] };
  lenderComparisons: SyntheticComparison[];
  disclaimer: string;
  fundingSearch: PackageSearch;
  termMonths: number;
}

interface PackageOption {
  allocations: Array<{ provider_name: string; facility_name: string; amount_cents: number }>;
  total_cents: number;
  provider_count: number;
  warnings: string[];
  status: string;
}

interface PackageSearch {
  alternatives: PackageOption[];
  exclusions: Array<{ provider: string; facility?: string; reason: string }>;
  shortfall_cents: number;
  message: string;
  exhaustive: boolean;
}

function csvCells(line: string): string[] {
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((raw) => {
    const value = raw.trim();
    return value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1).replace(/""/g, '"').trim() : value;
  });
}

function csvFacts(text: string): Array<{ field: string; value: string; filename: string }> {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (rows.length < 2) return [];
  const headers = csvCells(rows[0]).map((header) => header.toLowerCase());
  const fieldIndex = headers.indexOf("field");
  const valueIndex = headers.indexOf("value");
  if (fieldIndex < 0 || valueIndex < 0) return [];
  return rows.slice(1).flatMap((row) => {
    const cells = csvCells(row);
    const field = cells[fieldIndex]?.trim();
    const value = cells[valueIndex]?.trim();
    return field && value ? [{ field, value, filename: "" }] : [];
  });
}

function normalized(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function comparisonValue(field: string, value: string): string {
  if (field === "funding.security") {
    return [...new Set(value.split(";").map((item) => normalized(item).replace(/[_.-]+/g, " ")).filter(Boolean))].sort().join("; ");
  }
  if (field === "funding.amount" || field === "funding.termMonths" || field.startsWith("financials.")) {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    if (Number.isFinite(parsed)) return String(parsed);
  }
  return normalized(value).replace(/[_.-]+/g, " ").replace(/\s+/g, " ");
}

function numeric(value: string): number | null {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSecurity(value: Application["security"] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return String(value).split(";").map((item) => item.trim()).filter(Boolean);
  }
}

function packageProvider(index: number, maximum = 6_000_000): any {
  const names = ["Rimu", "Totara", "Manuka", "Nikau", "Pohutukawa", "Rata", "Puriri"];
  const max = maximum;
  return {
    id: `CP-CLUB-${index}`,
    name: `${names[index - 1]} Demonstration Credit`,
    data: { synthetic: true },
    mandate: {
      id: `MAN-CLUB-${index}`,
      effective_from: "2026-01-01",
      data: {
        synthetic: true,
        currency: "NZD",
        sectors: ["Manufacturing"],
        purposes: ["acquisition", "growth_capital"],
        security: ["GSA"],
        facilityTypes: ["term_loan"],
        minTerm: 12,
        maxTerm: 60,
        participationMin: 1_000_000,
        participationMax: max,
        providerLimit: max,
        amountScope: "participation",
        availableCapital: max,
        capacityAsAt: new Date().toISOString(),
        coLend: true,
        canLead: index === 1,
        securityGroup: "synthetic-shared-first-ranking",
        source: "Explicit fictional participation scenario; not a real provider mandate",
      },
    },
  };
}

function packageProviders() {
  const providers = Array.from({ length: 7 }, (_, index) => packageProvider(index + 1));
  const solo = packageProvider(1, 30_000_000);
  solo.id = "CP-SOLO-DEMO";
  solo.name = "Single Facility Demonstration Fund";
  solo.mandate.id = "MAN-SOLO-DEMO";
  solo.mandate.data.coLend = false;
  solo.mandate.data.participationMin = 20_000_000;
  return [...providers, solo];
}

function fundingCategory(app: Application): string {
  return {
    development: "development",
    commercial_property: "commercial_property",
    business_acquisition: "acquisition",
    refinance: "refinance",
  }[app.purpose];
}

function syntheticDeal(app: Application, documents: ApplicationDocument[]) {
  const facts = documents.flatMap((document) => {
    if (!document.filename.toLowerCase().endsWith(".csv") || !document.extracted_text) return [];
    return csvFacts(document.extracted_text).map((fact) => ({ ...fact, filename: document.filename }));
  });

  const relevant = new Set([
    "company.name", "company.industry", "company.location", "funding.amount", "funding.purpose",
    "funding.termMonths", "funding.security", "financials.annualRevenue", "financials.ebitda",
  ]);
  const values = new Map<string, string[]>();
  for (const fact of facts) {
    if (!relevant.has(fact.field)) continue;
    const entries = values.get(fact.field) ?? [];
    entries.push(fact.value);
    values.set(fact.field, entries);
  }

  const formValues: Record<string, string> = {
    "company.name": app.client_name,
    "company.industry": app.industry,
    "company.location": app.location,
    "funding.amount": String(app.loan_amount_cents / 100),
    "funding.purpose": PURPOSE_LABEL[app.purpose],
    "funding.security": parseSecurity(app.security).join("; "),
    ...(app.loan_term_months ? { "funding.termMonths": String(app.loan_term_months) } : {}),
  };
  const conflicts: Array<{ field: string; message: string }> = [];
  for (const [field, fieldValues] of values) {
    const csvValue = field === "funding.security" ? [...new Set(fieldValues)].join("; ") : null;
    const candidates = field === "funding.security"
      ? [...(csvValue ? [csvValue] : []), ...(formValues[field] ? [formValues[field]] : [])]
      : [...fieldValues, ...(formValues[field] ? [formValues[field]] : [])];
    if (new Set(candidates.map((value) => comparisonValue(field, value))).size > 1) {
      conflicts.push({ field, message: `Sources disagree about ${field}: ${candidates.join("; ")}. Confirm the correct value.` });
    }
  }

  const valueFor = (field: string, fallback?: string) => {
    const csvValue = field === "funding.security" ? [...new Set(values.get(field) ?? [])].join("; ") : values.get(field)?.[0];
    return csvValue ?? fallback ?? "";
  };
  const amountRaw = valueFor("funding.amount", formValues["funding.amount"]);
  const termRaw = valueFor("funding.termMonths", formValues["funding.termMonths"]);
  const annualRevenue = numeric(valueFor("financials.annualRevenue"));
  const ebitda = numeric(valueFor("financials.ebitda"));

  return {
    synthetic: true,
    company: {
      name: valueFor("company.name", app.client_name),
      industry: valueFor("company.industry") || null,
      location: valueFor("company.location", app.location),
    },
    funding: {
      currency: "NZD",
      amount: numeric(amountRaw),
      purpose: valueFor("funding.purpose", PURPOSE_LABEL[app.purpose]),
      termMonths: numeric(termRaw),
      security: valueFor("funding.security").split(";").map((item) => item.trim()).filter(Boolean),
    },
    financials: {
      annualRevenue: annualRevenue === null ? null : { amount: annualRevenue, currency: "NZD" },
      ebitda: ebitda === null ? null : { amount: ebitda, currency: "NZD" },
    },
    documents: documents.filter((document) => document.filename.toLowerCase().endsWith(".csv")).map((document) => ({
      name: document.filename,
      status: "provided",
    })),
    review: { conflicts },
  };
}

export interface SyntheticSourceReviewRow {
  field: string;
  label: string;
  formValue: string | null;
  sources: Array<{ filename: string; value: string }>;
  state: "aligned" | "conflict" | "review";
}

const SOURCE_FIELD_LABELS: Record<string, string> = {
  "company.name": "Company name",
  "company.industry": "Industry",
  "company.location": "Location",
  "funding.amount": "Funding amount",
  "funding.purpose": "Funding purpose",
  "funding.termMonths": "Requested term",
  "funding.security": "Security",
  "financials.annualRevenue": "Annual revenue",
  "financials.ebitda": "EBITDA",
};

export function reviewSyntheticSources(app: Application, documents: ApplicationDocument[]): SyntheticSourceReviewRow[] {
  const formValues: Record<string, string | null> = {
    "company.name": app.client_name || null,
    "company.industry": app.industry || null,
    "company.location": app.location || null,
    "funding.amount": String(app.loan_amount_cents / 100),
    "funding.purpose": PURPOSE_LABEL[app.purpose],
    "funding.termMonths": app.loan_term_months ? String(app.loan_term_months) : null,
    "funding.security": parseSecurity(app.security).join("; ") || null,
    "financials.annualRevenue": null,
    "financials.ebitda": null,
  };
  const grouped = new Map<string, Array<{ filename: string; value: string }>>();
  for (const document of documents) {
    if (!document.filename.toLowerCase().endsWith(".csv") || !document.extracted_text) continue;
    for (const fact of csvFacts(document.extracted_text)) {
      if (!SOURCE_FIELD_LABELS[fact.field]) continue;
      const values = grouped.get(fact.field) ?? [];
      values.push({ filename: document.filename, value: fact.value });
      grouped.set(fact.field, values);
    }
  }

  return [...grouped.entries()].map(([field, sources]) => {
    const formValue = formValues[field] || null;
    const sourceValue = field === "funding.security" ? [...new Set(sources.map((source) => source.value))].join("; ") : null;
    const candidates = field === "funding.security"
      ? [...(sourceValue ? [sourceValue] : []), ...(formValue ? [formValue] : [])]
      : [...sources.map((source) => source.value), ...(formValue ? [formValue] : [])];
    const distinct = new Set(candidates.map((value) => comparisonValue(field, value)));
    const state: SyntheticSourceReviewRow["state"] = distinct.size > 1
      ? "conflict"
      : formValue
        ? "aligned"
        : "review";
    return { field, label: SOURCE_FIELD_LABELS[field], formValue, sources, state };
  });
}

export function analyzeSyntheticApplication(app: Application, documents: ApplicationDocument[]): SyntheticAnalysis | null {
  const hasSupportedCsv = documents.some((document) =>
    document.filename.toLowerCase().endsWith(".csv") && document.extracted_text && csvFacts(document.extracted_text).length > 0,
  );
  if (!hasSupportedCsv) return null;
  const deal = syntheticDeal(app, documents);
  const analysis = analyzeSyntheticDeal(deal);
  const amount = app.loan_amount_cents / 100;
  const termMonths = app.loan_term_months ?? (Number(deal.funding.termMonths) || 36);
  const purpose = fundingCategory(app);
  const security = parseSecurity(app.security).length ? parseSecurity(app.security) : deal.funding.security;
  const industry = app.industry || deal.company.industry || "";
  const facility = {
    id: "main",
    name: "Requested facility",
    amount,
    currency: "NZD",
    termMonths,
    type: "term_loan",
    security,
    purposes: [purpose],
  };
  const profile = {
    synthetic: true,
    company: { ...deal.company, industry },
    funding: {
      ...deal.funding,
      amount,
      currency: "NZD",
      purpose,
      purposes: [purpose],
      termMonths,
      security,
      targetBasis: "facility_limits",
      rolesConfirmed: false,
    },
    financials: deal.financials,
    facilities: [facility],
    ratios: {},
  };
  const fundingSearch = searchPackages(profile, packageProviders(), { now: new Date() }) as PackageSearch;
  return { ...analysis, fundingSearch, termMonths };
}

export function formatSyntheticAnalysis(analysis: SyntheticAnalysis): string {
  const lines = [
    "## Synthetic lender comparison",
    "",
    "**Fictional demonstration only:** these three provider profiles and criteria are synthetic fixtures, not real lender terms, current market data, offers, or approval predictions.",
    "",
    analysis.summary.text || "The supplied fields are incomplete; review the checks below.",
    "",
  ];

  for (const comparison of analysis.lenderComparisons) {
    lines.push(`### ${comparison.lenderName} — ${comparison.overall.replaceAll("_", " ")}`);
    lines.push(comparison.explanation);
    for (const check of comparison.checks) {
      lines.push(`- **${check.criterion}: ${check.outcome.replaceAll("_", " ")}** — ${check.explanation}`);
    }
    lines.push("");
  }

  lines.push("## Multi-provider funding options");
  lines.push("The original bounded package solver searched the fictional participation limits. Options are exploratory, not lender commitments. Pricing, fees, and transaction-specific conditions are not supplied by these fixtures and must be quoted.");
  lines.push("");
  if (analysis.fundingSearch.alternatives.length) {
    analysis.fundingSearch.alternatives.forEach((option, index) => {
      lines.push(`### Option ${index + 1} — ${option.provider_count} provider${option.provider_count === 1 ? "" : "s"} — NZD ${(option.total_cents / 100).toLocaleString("en-NZ")}`);
      for (const allocation of option.allocations) {
        lines.push(`- **${allocation.provider_name}:** NZD ${(allocation.amount_cents / 100).toLocaleString("en-NZ")} for ${allocation.facility_name}; term ${analysis.termMonths} months.`);
        lines.push("  - Interest rate, fees, and final conditions: not supplied; obtain a transaction-specific quote.");
      }
      if (option.warnings.length) lines.push(`- **Checks before approach:** ${option.warnings.join("; ")}.`);
      if (analysis.summary.conflicts.length) lines.push("- **Source data:** confirm the conflicts listed below before relying on this allocation.");
      lines.push("");
    });
  } else {
    lines.push(analysis.fundingSearch.message);
    if (analysis.fundingSearch.shortfall_cents > 0) lines.push(`Recorded limits leave a NZD ${(analysis.fundingSearch.shortfall_cents / 100).toLocaleString("en-NZ")} shortfall.`);
    lines.push("");
  }

  if (analysis.fundingSearch.exclusions.length) {
    lines.push("### Why other providers were excluded");
    for (const item of analysis.fundingSearch.exclusions) {
      lines.push(`- **${item.provider}${item.facility ? ` — ${item.facility}` : ""}:** ${item.reason}.`);
    }
    lines.push("");
  }

  if (analysis.summary.conflicts.length) {
    lines.push("### Source conflicts to review");
    for (const conflict of analysis.summary.conflicts) lines.push(`- ${conflict}`);
    lines.push("");
  }
  lines.push(analysis.disclaimer);
  return lines.join("\n");
}

export function analyzeSyntheticDeal(deal: unknown): SyntheticAnalysis {
  return legacyAnalysis(deal) as SyntheticAnalysis;
}
