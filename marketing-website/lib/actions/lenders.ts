"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSession, createUser, findUserByEmail, requireAdviser, requireLender, requireMarketplaceAdmin } from "../auth";
import { feeCents, FEE_BPS, FEE_PAYER } from "../fees";
import { getDb, newId, nowIso, one, run } from "../db";
import { scoreLender } from "../lenders";
import type { Application, Lender, LenderPartnerApplication } from "../types";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function dollarsToCents(value: FormDataEntryValue | null): number {
  const amount = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export async function createLenderPartnerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const firmName = String(formData.get("firm_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const minLoan = dollarsToCents(formData.get("min_loan"));
  const maxLoan = dollarsToCents(formData.get("max_loan"));
  const maxLvr = Number(formData.get("max_lvr_pct"));
  const regions = String(formData.get("regions") || "").split(",").map((x) => x.trim()).filter(Boolean);
  const loanTypes = formData.getAll("loan_types").map(String).filter((x) => ["development", "commercial_property", "business_acquisition", "refinance"].includes(x));
  const presales = String(formData.get("pre_sales_requirement") || "either");

  if (!name || !firmName || !email.includes("@")) fail("/lenders/join", "Enter your name, fund name, and a valid work email.");
  if (password.length < 8) fail("/lenders/join", "Your password needs to be at least 8 characters.");
  if (!minLoan || minLoan >= maxLoan) fail("/lenders/join", "Enter a maximum facility larger than your minimum.");
  if (!Number.isFinite(maxLvr) || maxLvr <= 0 || maxLvr > 100) fail("/lenders/join", "Enter a maximum LVR between 1 and 100.");
  if (!regions.length || !loanTypes.length) fail("/lenders/join", "Add at least one region and one facility type.");
  if (!["required", "not_required", "either"].includes(presales)) fail("/lenders/join", "Choose a valid pre-sales position.");
  if (await findUserByEmail(email)) fail("/lenders/join", "There is already an account with that email. Sign in or use another address.");

  const user = await createUser({ email, name, password, firmName, accountType: "lender", accountStatus: "pending" });
  await run(
    `INSERT INTO lender_partner_applications
       (id, user_id, firm_name, contact_name, contact_email, min_loan_cents, max_loan_cents, max_lvr_pct,
        regions, loan_types, pre_sales_requirement, notes, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13)`,
    [newId(), user.id, firmName, name, email, minLoan, maxLoan, maxLvr, JSON.stringify(regions), JSON.stringify(loanTypes), presales, String(formData.get("notes") || "").trim(), nowIso()],
  );
  await createSession(user.id);
  redirect("/lenders/pending");
}

export async function approveLenderPartnerAction(formData: FormData) {
  await requireMarketplaceAdmin();
  const partnerId = String(formData.get("partner_id") || "");
  const partner = await one<LenderPartnerApplication>(`SELECT * FROM lender_partner_applications WHERE id = $1`, [partnerId]);
  if (!partner || partner.status !== "pending") return;

  const existing = await one<{ id: string }>(`SELECT id FROM lenders WHERE owner_user_id = $1`, [partner.user_id]);
  const lenderId = existing?.id ?? newId();
  if (!existing) {
    await run(
      `INSERT INTO lenders (id, name, min_loan_cents, max_loan_cents, max_lvr_pct, regions, loan_types, pre_sales_requirement, contact_email, notes, owner_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [lenderId, partner.firm_name, partner.min_loan_cents, partner.max_loan_cents, partner.max_lvr_pct, partner.regions, partner.loan_types, partner.pre_sales_requirement, partner.contact_email, partner.notes, partner.user_id],
    );
  }
  const now = nowIso();
  await run(`UPDATE users SET account_status = 'active', lender_id = $1 WHERE id = $2 AND account_type = 'lender'`, [lenderId, partner.user_id]);
  await run(`UPDATE lender_partner_applications SET status = 'approved', reviewed_at = $1 WHERE id = $2`, [now, partner.id]);
  revalidatePath("/app/lenders/review");
}

export async function rejectLenderPartnerAction(formData: FormData) {
  await requireMarketplaceAdmin();
  const partnerId = String(formData.get("partner_id") || "");
  const partner = await one<{ user_id: string; status: string }>(`SELECT user_id, status FROM lender_partner_applications WHERE id = $1`, [partnerId]);
  if (!partner || partner.status !== "pending") return;
  const now = nowIso();
  await run(`UPDATE lender_partner_applications SET status = 'rejected', reviewed_at = $1 WHERE id = $2`, [now, partnerId]);
  await run(`UPDATE users SET account_status = 'suspended' WHERE id = $1 AND account_type = 'lender'`, [partner.user_id]);
  revalidatePath("/app/lenders/review");
}

export async function shareDealAction(formData: FormData) {
  const adviser = await requireAdviser();
  const applicationId = String(formData.get("application_id") || "");
  const lenderId = String(formData.get("lender_id") || "");
  const app = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [applicationId, adviser.id]);
  if (!app) fail("/app", "That deal could not be found.");
  const summary = await one<{ id: string }>(`SELECT id FROM deal_summaries WHERE application_id = $1`, [app.id]);
  if (!summary) fail(`/app/applications/${app.id}`, "Generate and review a deal summary before sharing this deal.");
  if (!["summary_ready", "sent_to_lenders", "term_sheet_received", "approved"].includes(app.status)) {
    fail(`/app/applications/${app.id}`, "Prepare the deal summary before sharing this deal.");
  }
  const matched = await one<{ id: string }>(`SELECT id FROM application_lenders WHERE application_id = $1 AND lender_id = $2`, [app.id, lenderId]);
  const lenderRow = await one<Lender & { regions: string; loan_types: string; account_status: string }>(
    `SELECT l.*, u.account_status FROM lenders l JOIN users u ON u.id = l.owner_user_id WHERE l.id = $1 AND u.account_type = 'lender'`,
    [lenderId],
  );
  if (!matched || !lenderRow || lenderRow.account_status !== "active") fail(`/app/applications/${app.id}`, "Only matched, approved Mandate lenders can receive a deal here.");
  const lender: Lender = {
    ...lenderRow,
    regions: JSON.parse(lenderRow.regions as unknown as string),
    loan_types: JSON.parse(lenderRow.loan_types as unknown as string),
  };
  if (!scoreLender(app, lender).fits) fail(`/app/applications/${app.id}`, "This fund’s current criteria no longer fit. Re-match the deal before sharing it.");
  const now = nowIso();
  await run(
    `INSERT INTO deal_shares (id, application_id, lender_id, shared_by, shared_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(application_id, lender_id) DO UPDATE SET shared_by = $4, shared_at = $5, revoked_at = NULL, response = NULL, response_note = '', responded_at = NULL`,
    [newId(), app.id, lenderId, adviser.id, now],
  );
  await run(`UPDATE application_lenders SET stage = 'contacted', updated_at = $1 WHERE application_id = $2 AND lender_id = $3`, [now, app.id, lenderId]);
  if (app.status === "summary_ready") {
    await run(`UPDATE applications SET status = 'sent_to_lenders', updated_at = $1 WHERE id = $2`, [now, app.id]);
    await run(
      `INSERT INTO application_events (id, application_id, type, message, from_status, to_status, created_at)
       VALUES ($1, $2, 'status_change', $3, $4, 'sent_to_lenders', $5)`,
      [newId(), app.id, `Deal shared with a matched lender by ${adviser.name}`, app.status, now],
    );
  }
  revalidatePath(`/app/applications/${app.id}`);
  revalidatePath("/app/inbox");
}

export async function revokeDealShareAction(formData: FormData) {
  const adviser = await requireAdviser();
  const shareId = String(formData.get("share_id") || "");
  const share = await one<{ id: string; application_id: string }>(
    `SELECT s.id, s.application_id FROM deal_shares s JOIN applications a ON a.id = s.application_id
      WHERE s.id = $1 AND a.adviser_id = $2 AND s.revoked_at IS NULL`, [shareId, adviser.id],
  );
  if (!share) return;
  await run(`UPDATE deal_shares SET revoked_at = $1 WHERE id = $2`, [nowIso(), share.id]);
  revalidatePath(`/app/applications/${share.application_id}`);
  revalidatePath("/app/inbox");
}

export async function respondToDealAction(formData: FormData) {
  const lender = await requireLender();
  const shareId = String(formData.get("share_id") || "");
  const response = String(formData.get("response") || "");
  const note = String(formData.get("response_note") || "").trim();
  if (response !== "interested" && response !== "pass") return;
  const share = await one<{ id: string; application_id: string; lender_id: string }>(
    `SELECT id, application_id, lender_id FROM deal_shares WHERE id = $1 AND lender_id = $2 AND revoked_at IS NULL`,
    [shareId, lender.lender_id],
  );
  if (!share) return;
  await run(`UPDATE deal_shares SET response = $1, response_note = $2, responded_at = $3 WHERE id = $4`, [response, note, nowIso(), share.id]);
  const match = await one<{ id: string }>(`SELECT id FROM application_lenders WHERE application_id = $1 AND lender_id = $2`, [share.application_id, lender.lender_id]);
  if (match) await run(`UPDATE application_lenders SET stage = $1, updated_at = $2 WHERE id = $3`, [response === "interested" ? "interested" : "declined", nowIso(), match.id]);
  revalidatePath("/app/inbox");
  revalidatePath(`/app/inbox/${share.id}`);
  revalidatePath(`/app/applications/${share.application_id}`);
}

export async function updateLenderCriteriaAction(formData: FormData) {
  const lenderUser = await requireLender();
  const minLoan = dollarsToCents(formData.get("min_loan"));
  const maxLoan = dollarsToCents(formData.get("max_loan"));
  const maxLvr = Number(formData.get("max_lvr_pct"));
  const regions = String(formData.get("regions") || "").split(",").map((x) => x.trim()).filter(Boolean);
  const loanTypes = formData.getAll("loan_types").map(String).filter((x) => ["development", "commercial_property", "business_acquisition", "refinance"].includes(x));
  const presales = String(formData.get("pre_sales_requirement") || "either");
  if (!minLoan || minLoan >= maxLoan || !Number.isFinite(maxLvr) || maxLvr <= 0 || maxLvr > 100 || !regions.length || !loanTypes.length || !["required", "not_required", "either"].includes(presales)) {
    fail("/app/criteria", "Check your facility range, LVR, regions, facility types and pre-sales setting.");
  }
  await run(
    `UPDATE lenders SET min_loan_cents = $1, max_loan_cents = $2, max_lvr_pct = $3, regions = $4, loan_types = $5, pre_sales_requirement = $6, notes = $7 WHERE id = $8 AND owner_user_id = $9`,
    [minLoan, maxLoan, maxLvr, JSON.stringify(regions), JSON.stringify(loanTypes), presales, String(formData.get("notes") || "").trim(), lenderUser.lender_id, lenderUser.id],
  );
  revalidatePath("/app/criteria");
  revalidatePath("/app/lenders");
  redirect("/app/criteria?saved=1");
}

export async function completeSettlementAction(formData: FormData) {
  const adviser = await requireAdviser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [applicationId, adviser.id]);
  if (!app) fail("/app", "That deal could not be found.");
  if (app.status !== "approved") fail(`/app/applications/${app.id}`, "Only an approved deal can be recorded as settled.");
  const amount = dollarsToCents(formData.get("facility_amount"));
  const lenderChoice = String(formData.get("lender_id") || "");
  const lenderId = lenderChoice && lenderChoice !== "external" ? lenderChoice : null;
  const date = String(formData.get("settled_at") || "");
  if (!amount || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`/app/applications/${app.id}/settle`, "Enter the settled facility amount and settlement date.");
  if (FEE_PAYER === "lender" && !lenderId && lenderChoice !== "external") fail(`/app/applications/${app.id}/settle`, "Select the lender that provided the settled facility.");
  if (lenderId) {
    const shared = await one<{ id: string }>(`SELECT id FROM deal_shares WHERE application_id = $1 AND lender_id = $2`, [app.id, lenderId]);
    if (!shared) fail(`/app/applications/${app.id}/settle`, "The selected lender was not shared this deal through Mandate.");
  }
  const now = nowIso();
  const db = await getDb();
  const inserted = await db.transaction(async (tx) => {
    const current = await tx.one<{ status: string }>(`SELECT status FROM applications WHERE id = $1 AND adviser_id = $2`, [app.id, adviser.id]);
    if (!current || current.status !== "approved") return false;
    const existing = await tx.one<{ id: string }>(`SELECT id FROM settlement_records WHERE application_id = $1`, [app.id]);
    if (existing) return false;
    await tx.run(
      `INSERT INTO settlement_records (id, application_id, lender_id, facility_amount_cents, fee_amount_cents, fee_bps, fee_payer, settled_at, reference, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [newId(), app.id, lenderId, amount, feeCents(amount), FEE_BPS, FEE_PAYER, new Date(`${date}T12:00:00.000Z`).toISOString(), String(formData.get("reference") || "").trim(), adviser.id, now],
    );
    await tx.run(`UPDATE applications SET status = 'settled', updated_at = $1 WHERE id = $2 AND adviser_id = $3`, [now, app.id, adviser.id]);
    await tx.run(
      `INSERT INTO application_events (id, application_id, type, message, from_status, to_status, created_at)
       VALUES ($1, $2, 'status_change', 'Facility settlement recorded', 'approved', 'settled', $3)`,
      [newId(), app.id, now],
    );
    return true;
  });
  if (!inserted) redirect(`/app/applications/${app.id}`);
  revalidatePath(`/app/applications/${app.id}`);
  revalidatePath("/app");
  revalidatePath("/app/billing");
  redirect(`/app/applications/${app.id}`);
}
