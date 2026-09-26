import type { ApplicationStatus } from "./types";

export const STATUS_ORDER: ApplicationStatus[] = [
  "draft",
  "summary_ready",
  "sent_to_lenders",
  "term_sheet_received",
  "approved",
  "settled",
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  summary_ready: "Summary ready",
  sent_to_lenders: "Sent to lenders",
  term_sheet_received: "Term sheet received",
  approved: "Approved",
  settled: "Settled",
  declined: "Declined",
};

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "draft",
  "summary_ready",
  "sent_to_lenders",
  "term_sheet_received",
  "approved",
];

export function statusTone(status: ApplicationStatus): "neutral" | "progress" | "success" | "danger" {
  if (status === "declined") return "danger";
  if (status === "settled" || status === "approved") return "success";
  if (status === "draft") return "neutral";
  return "progress";
}

export const PURPOSE_LABEL = {
  development: "Development",
  commercial_property: "Commercial property",
  business_acquisition: "Business acquisition",
  refinance: "Refinance",
} as const;

export const NZ_REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatū-Whanganui",
  "Wellington",
  "Tasman",
  "Nelson",
  "Marlborough",
  "West Coast",
  "Canterbury",
  "Otago",
  "Southland",
];

export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return `$${(cents / 100).toLocaleString("en-NZ", { maximumFractionDigits: 0 })}`;
}

export function computeLvr(loanCents: number, propertyValueCents: number | null): number | null {
  if (!propertyValueCents || propertyValueCents <= 0) return null;
  return Math.round((loanCents / propertyValueCents) * 1000) / 10;
}
