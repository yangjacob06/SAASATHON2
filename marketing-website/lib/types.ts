export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  firm_name: string;
  logo_url: string | null;
  account_type: "adviser" | "lender";
  account_status: "active" | "pending" | "suspended";
  lender_id: string | null;
  created_at: string;
}

export type ApplicationStatus =
  | "draft"
  | "summary_ready"
  | "sent_to_lenders"
  | "term_sheet_received"
  | "approved"
  | "settled"
  | "declined";

export type LoanPurpose = "development" | "commercial_property" | "business_acquisition" | "refinance";

export interface Application {
  id: string;
  adviser_id: string;
  client_name: string;
  loan_amount_cents: number;
  purpose: LoanPurpose;
  location: string;
  property_value_cents: number | null;
  pre_sales_pct: number | null;
  loan_term_months: number | null;
  notes: string;
  status: ApplicationStatus;
  is_sample: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  extracted_text: string | null;
  created_at: string;
}

export interface DealSummary {
  id: string;
  application_id: string;
  content: string;
  lvr_pct: number | null;
  ai_generated: number;
  generated_at: string;
  updated_at: string;
}

export type PreSalesRequirement = "required" | "not_required" | "either";

export interface Lender {
  id: string;
  name: string;
  min_loan_cents: number;
  max_loan_cents: number;
  max_lvr_pct: number;
  regions: string[];
  loan_types: LoanPurpose[];
  pre_sales_requirement: PreSalesRequirement;
  contact_email: string;
  notes: string;
  owner_user_id?: string | null;
}

export interface LenderPartnerApplication {
  id: string;
  user_id: string;
  firm_name: string;
  contact_name: string;
  contact_email: string;
  min_loan_cents: number;
  max_loan_cents: number;
  max_lvr_pct: number;
  regions: string[];
  loan_types: LoanPurpose[];
  pre_sales_requirement: PreSalesRequirement;
  notes: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

export interface DealShare {
  id: string;
  application_id: string;
  lender_id: string;
  shared_by: string;
  shared_at: string;
  revoked_at: string | null;
  response: "interested" | "pass" | null;
  response_note: string;
  responded_at: string | null;
}

export interface SettlementRecord {
  id: string;
  application_id: string;
  lender_id: string | null;
  facility_amount_cents: number;
  fee_amount_cents: number;
  fee_bps: number;
  fee_payer: "lender" | "adviser" | "borrower";
  settled_at: string;
  reference: string;
  created_by: string;
  created_at: string;
}

export type LenderStage = "matched" | "contacted" | "interested" | "declined";

export interface ApplicationLender {
  id: string;
  application_id: string;
  lender_id: string;
  match_score: number;
  match_reasons: string[];
  stage: LenderStage;
  created_at: string;
  updated_at: string;
}

export type EventType = "status_change" | "note" | "reminder";

export interface ApplicationEvent {
  id: string;
  application_id: string;
  type: EventType;
  message: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  due_at: string | null;
  done_at: string | null;
  created_at: string;
}
