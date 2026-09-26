"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { activeApplicationLimit } from "../billing";
import { newId, nowIso, one, query, run } from "../db";
import { extractPdfText } from "../ai/pdf";
import { generateDealSummary } from "../ai/summary";
import { refreshApplicationLenders, setLenderStage as setLenderStageDb } from "../lenders";
import { saveFile } from "../storage";
import { ACTIVE_STATUSES, STATUS_LABEL } from "../status";
import type { Application, ApplicationStatus, LenderStage, LoanPurpose } from "../types";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function loadOwnedApplication(id: string, adviserId: string): Promise<Application> {
  const app = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [id, adviserId]);
  if (!app) fail("/app", "That application couldn't be found.");
  return app;
}

function parsePercent(raw: FormDataEntryValue | null): number | null {
  if (raw === null || String(raw).trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseDollarsToCents(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw || "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export async function createApplicationAction(formData: FormData) {
  const user = await requireUser();

  const limit = activeApplicationLimit(user);
  if (limit !== null) {
    const rows = await query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM applications WHERE adviser_id = $1 AND status IN (${ACTIVE_STATUSES.map((_, i) => `$${i + 2}`).join(",")})`,
      [user.id, ...ACTIVE_STATUSES],
    );
    if (Number(rows[0]?.n ?? 0) >= limit) {
      fail("/app/applications/new", `You've reached the ${limit}-application limit on your plan. Upgrade to Pro for unlimited applications.`);
    }
  }

  const clientName = String(formData.get("client_name") || "").trim();
  if (!clientName) fail("/app/applications/new", "Enter the client's name.");

  const id = newId();
  const now = nowIso();

  const region = String(formData.get("region") || "").trim();
  const suburb = String(formData.get("suburb") || "").trim();
  const location = suburb ? `${suburb}, ${region}` : region;

  await run(
    `INSERT INTO applications
       (id, adviser_id, client_name, loan_amount_cents, purpose, location, property_value_cents,
        pre_sales_pct, loan_term_months, notes, status, is_sample, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', 0, $11, $11)`,
    [
      id,
      user.id,
      clientName,
      parseDollarsToCents(formData.get("loan_amount")),
      String(formData.get("purpose") || "commercial_property") as LoanPurpose,
      location,
      formData.get("property_value") ? parseDollarsToCents(formData.get("property_value")) : null,
      parsePercent(formData.get("pre_sales_pct")),
      formData.get("loan_term_months") ? Number(formData.get("loan_term_months")) : null,
      String(formData.get("notes") || "").trim(),
      now,
    ],
  );

  await run(
    `INSERT INTO application_events (id, application_id, type, message, to_status, created_at)
     VALUES ($1, $2, 'status_change', 'Application created', 'draft', $3)`,
    [newId(), id, now],
  );

  const files = formData.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    await storeDocument(id, file);
  }

  redirect(`/app/applications/${id}`);
}

async function storeDocument(applicationId: string, file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const path = await saveFile(applicationId, file.name, bytes);
  const extractedText = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    ? await extractPdfText(bytes)
    : "";

  await run(
    `INSERT INTO application_documents (id, application_id, filename, storage_path, mime_type, size_bytes, extracted_text, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [newId(), applicationId, file.name, path, file.type || "application/octet-stream", bytes.length, extractedText || null, nowIso()],
  );
}

export async function uploadDocumentsAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);

  const files = formData.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    await storeDocument(app.id, file);
  }

  revalidatePath(`/app/applications/${app.id}`);
}

export async function generateSummaryAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);

  const docs = await query(`SELECT * FROM application_documents WHERE application_id = $1`, [app.id]);
  const result = await generateDealSummary(app, docs as any);
  const now = nowIso();

  const existing = await one(`SELECT id FROM deal_summaries WHERE application_id = $1`, [app.id]);
  if (existing) {
    await run(
      `UPDATE deal_summaries SET content = $1, lvr_pct = $2, ai_generated = $3, generated_at = $4, updated_at = $4 WHERE application_id = $5`,
      [result.content, result.lvrPct, result.aiGenerated ? 1 : 0, now, app.id],
    );
  } else {
    await run(
      `INSERT INTO deal_summaries (id, application_id, content, lvr_pct, ai_generated, generated_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)`,
      [newId(), app.id, result.content, result.lvrPct, result.aiGenerated ? 1 : 0, now],
    );
  }

  if (app.status === "draft") {
    await run(`UPDATE applications SET status = 'summary_ready', updated_at = $1 WHERE id = $2`, [now, app.id]);
    await run(
      `INSERT INTO application_events (id, application_id, type, message, from_status, to_status, created_at)
       VALUES ($1, $2, 'status_change', 'Deal summary generated', 'draft', 'summary_ready', $3)`,
      [newId(), app.id, now],
    );
  }

  await refreshApplicationLenders(app.status === "draft" ? { ...app, status: "summary_ready" } : app);

  revalidatePath(`/app/applications/${app.id}`);
}

export async function updateSummaryAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);
  const content = String(formData.get("content") || "");

  await run(`UPDATE deal_summaries SET content = $1, updated_at = $2 WHERE application_id = $3`, [
    content,
    nowIso(),
    app.id,
  ]);

  revalidatePath(`/app/applications/${app.id}`);
}

export async function refreshLenderMatchesAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);
  await refreshApplicationLenders(app);
  revalidatePath(`/app/applications/${app.id}`);
}

export async function setLenderStageAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  await loadOwnedApplication(applicationId, user.id);

  const applicationLenderId = String(formData.get("application_lender_id") || "");
  const stage = String(formData.get("stage") || "matched") as LenderStage;
  await setLenderStageDb(applicationLenderId, stage);

  revalidatePath(`/app/applications/${applicationId}`);
}

const NEXT_STATUS: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  draft: "summary_ready",
  summary_ready: "sent_to_lenders",
  sent_to_lenders: "term_sheet_received",
  term_sheet_received: "approved",
  approved: "settled",
};

export async function advanceStatusAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);

  const explicit = formData.get("status") ? (String(formData.get("status")) as ApplicationStatus) : null;
  const next = explicit ?? NEXT_STATUS[app.status];
  if (!next) return;

  const now = nowIso();
  await run(`UPDATE applications SET status = $1, updated_at = $2 WHERE id = $3`, [next, now, app.id]);
  await run(
    `INSERT INTO application_events (id, application_id, type, message, from_status, to_status, created_at)
     VALUES ($1, $2, 'status_change', $3, $4, $5, $6)`,
    [newId(), app.id, `Status changed to ${STATUS_LABEL[next]}`, app.status, next, now],
  );

  revalidatePath(`/app/applications/${app.id}`);
  revalidatePath("/app");
}

export async function addNoteAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);
  const message = String(formData.get("message") || "").trim();
  if (!message) return;

  await run(
    `INSERT INTO application_events (id, application_id, type, message, created_at) VALUES ($1, $2, 'note', $3, $4)`,
    [newId(), app.id, message, nowIso()],
  );

  revalidatePath(`/app/applications/${app.id}`);
}

export async function addReminderAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  const app = await loadOwnedApplication(applicationId, user.id);
  const message = String(formData.get("message") || "").trim();
  const days = Number(formData.get("days") || 3);
  if (!message) return;

  const dueAt = new Date(Date.now() + days * 86_400_000).toISOString();
  await run(
    `INSERT INTO application_events (id, application_id, type, message, due_at, created_at)
     VALUES ($1, $2, 'reminder', $3, $4, $5)`,
    [newId(), app.id, message, dueAt, nowIso()],
  );

  revalidatePath(`/app/applications/${app.id}`);
}

export async function completeReminderAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("application_id") || "");
  await loadOwnedApplication(applicationId, user.id);
  const eventId = String(formData.get("event_id") || "");

  await run(`UPDATE application_events SET done_at = $1 WHERE id = $2 AND application_id = $3`, [
    nowIso(),
    eventId,
    applicationId,
  ]);

  revalidatePath(`/app/applications/${applicationId}`);
}
