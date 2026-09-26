/**
 * Lender matching.
 *
 * Deliberately simple and explainable — every reason shown to the adviser is
 * a direct consequence of one rule below, never a black-box score. Run on
 * demand from the application page; results are cached into
 * `application_lenders` so an adviser's stage changes (Contacted, Interested,
 * Declined) survive a re-match.
 */

import { newId, nowIso, one, query, run } from "./db";
import type { Application, ApplicationLender, Lender, LenderStage, LoanPurpose } from "./types";

const PURPOSE_LABEL: Record<LoanPurpose, string> = {
  development: "development",
  commercial_property: "commercial property",
  business_acquisition: "business acquisition",
  refinance: "refinance",
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-NZ", { maximumFractionDigits: 0 })}`;
}

export interface LenderMatch {
  lender: Lender;
  fits: boolean;
  score: number;
  reasons: string[];
  blockers: string[];
}

/**
 * Scores one lender against one application. `fits` is true only when every
 * hard constraint (loan size, region, loan type) is met — LVR and pre-sales
 * affect the score and show up as a reason either way, since advisers often
 * still want to see a close-but-not-quite match.
 */
export function scoreLender(app: Application, lender: Lender): LenderMatch {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  const inSize = app.loan_amount_cents >= lender.min_loan_cents && app.loan_amount_cents <= lender.max_loan_cents;
  if (inSize) {
    score += 35;
    reasons.push(`Lends ${money(lender.min_loan_cents)}–${money(lender.max_loan_cents)}, fits the ${money(app.loan_amount_cents)} request`);
  } else if (app.loan_amount_cents > lender.max_loan_cents) {
    blockers.push(`Loan request exceeds their ${money(lender.max_loan_cents)} maximum`);
  } else {
    blockers.push(`Loan request is below their ${money(lender.min_loan_cents)} minimum`);
  }

  const region = (app.location.split(",").pop() || app.location).trim();
  const inRegion = lender.regions.includes("Nationwide") || lender.regions.some((r) => region.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(region.toLowerCase()));
  if (inRegion) {
    score += 25;
    reasons.push(lender.regions.includes("Nationwide") ? "Lends nationwide" : `Lends in ${region}`);
  } else {
    blockers.push(`Does not lend in ${region} (covers ${lender.regions.join(", ")})`);
  }

  const inType = lender.loan_types.includes(app.purpose);
  if (inType) {
    score += 20;
    reasons.push(`Writes ${PURPOSE_LABEL[app.purpose]} facilities`);
  } else {
    blockers.push(`Does not lend for ${PURPOSE_LABEL[app.purpose]}`);
  }

  if (app.property_value_cents && app.property_value_cents > 0) {
    const lvr = (app.loan_amount_cents / app.property_value_cents) * 100;
    if (lvr <= lender.max_lvr_pct) {
      score += 15;
      reasons.push(`${lvr.toFixed(0)}% LVR is within their ${lender.max_lvr_pct}% maximum`);
    } else {
      blockers.push(`${lvr.toFixed(0)}% LVR exceeds their ${lender.max_lvr_pct}% maximum`);
    }
  }

  if (app.purpose === "development") {
    const preSales = app.pre_sales_pct ?? 0;
    if (lender.pre_sales_requirement === "not_required") {
      score += 5;
      reasons.push("No pre-sales requirement");
    } else if (lender.pre_sales_requirement === "either") {
      score += 5;
      reasons.push("Flexible on pre-sales position");
    } else if (preSales >= 30) {
      score += 5;
      reasons.push(`${preSales}% pre-sold meets their pre-sales requirement`);
    } else {
      blockers.push(`Requires pre-sales evidence; only ${preSales}% pre-sold`);
    }
  }

  return { lender, fits: blockers.length === 0, score, reasons, blockers };
}

export async function matchLenders(app: Application): Promise<LenderMatch[]> {
  const lenders = await query<Lender & { regions: string; loan_types: string }>(`SELECT * FROM lenders ORDER BY name`);
  const parsed: Lender[] = lenders.map((l) => ({
    ...l,
    regions: JSON.parse(l.regions as unknown as string),
    loan_types: JSON.parse(l.loan_types as unknown as string),
  }));

  return parsed
    .map((lender) => scoreLender(app, lender))
    .filter((m) => m.fits)
    .sort((a, b) => b.score - a.score);
}

/**
 * Runs the matcher and upserts results into `application_lenders`, preserving
 * any stage the adviser has already set (Contacted, Interested, Declined).
 */
export async function refreshApplicationLenders(app: Application): Promise<void> {
  const matches = await matchLenders(app);

  for (const m of matches) {
    const existing = await one<ApplicationLender>(
      `SELECT * FROM application_lenders WHERE application_id = $1 AND lender_id = $2`,
      [app.id, m.lender.id],
    );
    if (existing) {
      await run(
        `UPDATE application_lenders SET match_score = $1, match_reasons = $2, updated_at = $3 WHERE id = $4`,
        [m.score, JSON.stringify(m.reasons), nowIso(), existing.id],
      );
    } else {
      await run(
        `INSERT INTO application_lenders (id, application_id, lender_id, match_score, match_reasons, stage, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'matched', $6, $6)`,
        [newId(), app.id, m.lender.id, m.score, JSON.stringify(m.reasons), nowIso()],
      );
    }
  }
}

export interface ApplicationLenderRow extends Omit<ApplicationLender, "match_reasons"> {
  match_reasons: string[];
  lender: Lender;
}

export async function listApplicationLenders(applicationId: string): Promise<ApplicationLenderRow[]> {
  const rows = await query<any>(
    `SELECT al.*, l.name AS lender_name, l.min_loan_cents, l.max_loan_cents, l.max_lvr_pct,
            l.regions AS lender_regions, l.loan_types AS lender_loan_types,
            l.pre_sales_requirement, l.contact_email, l.notes AS lender_notes
       FROM application_lenders al
       JOIN lenders l ON l.id = al.lender_id
      WHERE al.application_id = $1
      ORDER BY al.match_score DESC`,
    [applicationId],
  );

  return rows.map((r) => ({
    id: r.id,
    application_id: r.application_id,
    lender_id: r.lender_id,
    match_score: r.match_score,
    match_reasons: JSON.parse(r.match_reasons),
    stage: r.stage,
    created_at: r.created_at,
    updated_at: r.updated_at,
    lender: {
      id: r.lender_id,
      name: r.lender_name,
      min_loan_cents: r.min_loan_cents,
      max_loan_cents: r.max_loan_cents,
      max_lvr_pct: r.max_lvr_pct,
      regions: JSON.parse(r.lender_regions),
      loan_types: JSON.parse(r.lender_loan_types),
      pre_sales_requirement: r.pre_sales_requirement,
      contact_email: r.contact_email,
      notes: r.lender_notes,
    },
  }));
}

export async function setLenderStage(applicationLenderId: string, applicationId: string, stage: LenderStage): Promise<void> {
  const occurredAt = nowIso();
  await run(`UPDATE application_lenders SET stage = $1, updated_at = $2 WHERE id = $3 AND application_id = $4`, [
    stage,
    occurredAt,
    applicationLenderId,
    applicationId,
  ]);
  await run(
    `INSERT INTO application_lender_events (id, application_lender_id, event_type, stage, occurred_at)
     SELECT $1, id, $2, $3, $4 FROM application_lenders WHERE id = $5 AND application_id = $6`,
    [newId(), stage === "contacted" ? "contacted" : stage === "interested" || stage === "declined" ? "response" : "matched", stage, occurredAt, applicationLenderId, applicationId],
  );
}
