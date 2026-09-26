#!/usr/bin/env node
/**
 * Loads a demo adviser account with a lender directory and three worked
 * example applications, so the app has something real to look at.
 *
 *   npm run db:seed
 *
 * Log in with demo@mandate.test / demo1234
 */

import { randomUUID, randomBytes, scryptSync } from "node:crypto";

import { connect } from "./db.mjs";

const db = await connect();
const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000).toISOString();
const id = () => randomUUID();

function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const DEMO_EMAIL = "demo@mandate.test";

const LENDERS = [
  {
    name: "Summit Capital Partners",
    min: 1_000_000, max: 20_000_000, lvr: 65,
    regions: ["Nationwide"], types: ["development", "commercial_property"],
    preSales: "required", email: "deals@summitcapital.co.nz",
    notes: "Wants 40%+ pre-sales by value on residential development before first drawdown.",
  },
  {
    name: "Anchorage Private Debt",
    min: 2_000_000, max: 50_000_000, lvr: 60,
    regions: ["Auckland", "Waikato", "Bay of Plenty"], types: ["development", "commercial_property", "business_acquisition"],
    preSales: "either", email: "origination@anchorageprivate.co.nz",
    notes: "Institutional mandate; fastest at the larger end of the book.",
  },
  {
    name: "Kotare Bridging Finance",
    min: 250_000, max: 5_000_000, lvr: 70,
    regions: ["Nationwide"], types: ["commercial_property", "refinance", "business_acquisition"],
    preSales: "not_required", email: "hello@kotarebridging.co.nz",
    notes: "Bridging specialist — term sheets inside 48 hours, first mortgage only.",
  },
  {
    name: "Longacre Capital",
    min: 1_000_000, max: 15_000_000, lvr: 65,
    regions: ["Canterbury", "Otago", "Southland"], types: ["development", "commercial_property"],
    preSales: "required", email: "enquiries@longacrecapital.co.nz",
    notes: "South Island focus; comfortable with staged townhouse and terrace developments.",
  },
  {
    name: "Ironbridge Credit",
    min: 5_000_000, max: 100_000_000, lvr: 55,
    regions: ["Nationwide"], types: ["development", "commercial_property", "business_acquisition"],
    preSales: "either", email: "deals@ironbridgecredit.co.nz",
    notes: "Larger, more conservative facilities; full independent QS reporting required.",
  },
  {
    name: "Tussock Lending",
    min: 500_000, max: 8_000_000, lvr: 65,
    regions: ["Wellington", "Manawatū-Whanganui", "Canterbury"], types: ["commercial_property", "refinance"],
    preSales: "not_required", email: "team@tussocklending.co.nz",
    notes: "Strong on investment-grade commercial property refinancing.",
  },
  {
    name: "Northline Private Credit",
    min: 1_000_000, max: 12_000_000, lvr: 60,
    regions: ["Auckland", "Northland"], types: ["development", "business_acquisition"],
    preSales: "required", email: "originations@northlineprivate.co.nz",
    notes: "Upper North Island only. Wants a named main contractor at approval.",
  },
  {
    name: "Castlepoint Finance",
    min: 2_000_000, max: 30_000_000, lvr: 65,
    regions: ["Nationwide"], types: ["development", "commercial_property"],
    preSales: "either", email: "deals@castlepointfinance.co.nz",
    notes: "Flexible on pre-sales where the sponsor has a strong track record.",
  },
  {
    name: "Fernridge Capital",
    min: 500_000, max: 6_000_000, lvr: 70,
    regions: ["Canterbury", "Otago"], types: ["commercial_property", "business_acquisition", "refinance"],
    preSales: "not_required", email: "hello@fernridgecapital.co.nz",
    notes: "South Island generalist, quick indicative terms.",
  },
  {
    name: "Harbourview Debt Partners",
    min: 3_000_000, max: 40_000_000, lvr: 60,
    regions: ["Auckland", "Wellington"], types: ["development", "commercial_property"],
    preSales: "required", email: "origination@harbourviewdebt.co.nz",
    notes: "Main-centre CBD and fringe development only.",
  },
  {
    name: "Merino Private Finance",
    min: 250_000, max: 4_000_000, lvr: 70,
    regions: ["Otago", "Southland", "Canterbury"], types: ["business_acquisition", "refinance"],
    preSales: "not_required", email: "team@merinoprivate.co.nz",
    notes: "Owner-operator business acquisition specialist.",
  },
  {
    name: "Beacon Hill Capital",
    min: 1_000_000, max: 25_000_000, lvr: 65,
    regions: ["Nationwide"], types: ["development", "commercial_property", "refinance"],
    preSales: "either", email: "deals@beaconhillcapital.co.nz",
    notes: "Generalist private credit fund, broad appetite.",
  },
  {
    name: "Ridgeline Bridging",
    min: 500_000, max: 10_000_000, lvr: 65,
    regions: ["Waikato", "Bay of Plenty", "Auckland"], types: ["commercial_property", "refinance", "business_acquisition"],
    preSales: "not_required", email: "hello@ridgelinebridging.co.nz",
    notes: "Short-term bridging while permanent finance or a sale settles.",
  },
  {
    name: "Southern Cross Mezzanine",
    min: 2_000_000, max: 15_000_000, lvr: 75,
    regions: ["Nationwide"], types: ["development"],
    preSales: "required", email: "deals@southerncrossmezz.co.nz",
    notes: "Second-tier mezzanine layered behind a senior facility — higher effective LVR.",
  },
  {
    name: "Quay Street Capital",
    min: 1_000_000, max: 18_000_000, lvr: 65,
    regions: ["Auckland", "Wellington", "Canterbury"], types: ["development", "commercial_property", "business_acquisition"],
    preSales: "either", email: "originate@quaystreetcapital.co.nz",
    notes: "Main-centre focus across all three core loan types.",
  },
];

try {
  const existing = await db.all(`SELECT id FROM users WHERE email = $1`, [DEMO_EMAIL]);
  if (existing.length) {
    console.log("Demo data is already here. Run `npm run db:reset` to rebuild it.");
    process.exit(0);
  }

  const userId = id();
  await db.run(
    `INSERT INTO users
       (id, email, name, password_hash, firm_name, plan, subscription_status, trial_ends_at, created_at)
     VALUES ($1, $2, $3, $4, $5, 'trial', 'trialing', $6, $7)`,
    [userId, DEMO_EMAIL, "Grace Tauwhare", hashPassword("demo1234"), "Blackwood Finance Partners", daysFromNow(11), daysAgo(19)],
  );

  const lenderIds = {};
  for (const l of LENDERS) {
    const lid = id();
    lenderIds[l.name] = lid;
    await db.run(
      `INSERT INTO lenders
         (id, name, min_loan_cents, max_loan_cents, max_lvr_pct, regions, loan_types, pre_sales_requirement, contact_email, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        lid, l.name, l.min * 100, l.max * 100, l.lvr,
        JSON.stringify(l.regions), JSON.stringify(l.types), l.preSales, l.email, l.notes,
      ],
    );
  }
  console.log(`  seeded ${LENDERS.length} lenders`);

  async function addApplication(app) {
    const appId = id();
    await db.run(
      `INSERT INTO applications
         (id, adviser_id, client_name, loan_amount_cents, purpose, location, property_value_cents,
          pre_sales_pct, loan_term_months, notes, status, is_sample, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, $12, $13)`,
      [
        appId, userId, app.clientName, app.loanAmount * 100, app.purpose, app.location,
        app.propertyValue ? app.propertyValue * 100 : null, app.preSales ?? null,
        app.termMonths ?? null, app.notes ?? "", app.status, app.createdDaysAgo ? daysAgo(app.createdDaysAgo) : now(),
        app.updatedDaysAgo !== undefined ? daysAgo(app.updatedDaysAgo) : now(),
      ],
    );

    for (const ev of app.events ?? []) {
      await db.run(
        `INSERT INTO application_events
           (id, application_id, type, message, from_status, to_status, due_at, done_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id(), appId, ev.type, ev.message, ev.from ?? null, ev.to ?? null, ev.dueAt ?? null, ev.doneAt ?? null, daysAgo(ev.daysAgo ?? 0)],
      );
    }

    if (app.summary) {
      await db.run(
        `INSERT INTO deal_summaries (id, application_id, content, lvr_pct, ai_generated, generated_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, $5, $6)`,
        [id(), appId, app.summary, app.lvrPct ?? null, daysAgo(app.summaryDaysAgo ?? 1), daysAgo(app.summaryDaysAgo ?? 1)],
      );
    }

    for (const match of app.matches ?? []) {
      await db.run(
        `INSERT INTO application_lenders
           (id, application_id, lender_id, match_score, match_reasons, stage, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id(), appId, lenderIds[match.name], match.score, JSON.stringify(match.reasons), match.stage ?? "matched", daysAgo(match.daysAgo ?? 1), daysAgo(match.daysAgo ?? 1)],
      );
    }

    return appId;
  }

  await addApplication({
    clientName: "Rangiora Terraces Ltd",
    loanAmount: 8_000_000,
    purpose: "development",
    location: "Christchurch, Canterbury",
    propertyValue: 12_500_000,
    preSales: 30,
    termMonths: 18,
    notes: "42-unit staged townhouse development in Rangiora. Stage 1 (18 units) consented, Stage 2 subject to a resource consent variation lodged 4 weeks ago. Builder is a repeat client with three completed developments in North Canterbury.",
    status: "sent_to_lenders",
    createdDaysAgo: 12,
    updatedDaysAgo: 1,
    lvrPct: 64,
    summary:
      "## Deal summary — Rangiora Terraces Ltd\n\n" +
      "**Loan request:** $8,000,000 development facility, 18-month term.\n\n" +
      "**Security:** First mortgage over a 42-unit staged townhouse development in Rangiora, Canterbury. Independent valuation supports an on-completion value of $12,500,000 (LVR 64%).\n\n" +
      "**Purpose:** Construction funding for Stage 1 (18 units, fully consented) and Stage 2 (24 units, resource consent variation lodged).\n\n" +
      "**Location:** Rangiora, Canterbury — established growth corridor 25 minutes north of Christchurch CBD, strong owner-occupier and first-home-buyer demand.\n\n" +
      "**Repayment / exit:** Sale of completed units. 30% of Stage 1 pre-sold by value at application; balance expected to sell down during construction based on local absorption rates.\n\n" +
      "**Key strengths:**\n" +
      "- Experienced builder with three completed North Canterbury developments and no history of cost overrun.\n" +
      "- Stage 1 fully consented and ready to start.\n" +
      "- Conservative LVR (64%) against an independent valuation.\n\n" +
      "**Key risks:**\n" +
      "- Stage 2 consent variation not yet granted — facility should be structured to fund Stage 1 first, with Stage 2 drawdown conditional on consent.\n" +
      "- Pre-sales (30%) below the 40% several lenders prefer to see before first drawdown on a residential development.\n\n" +
      "**Missing information:** Updated cost-to-complete schedule from the quantity surveyor; written confirmation of the Stage 2 consent variation timeline from Waimakariri District Council.\n\n" +
      "*This summary was generated from the uploaded valuation, feasibility study and financials, and the details entered in the application form. Review and edit before sending to lenders.*",
    events: [
      { type: "status_change", message: "Application created", to: "draft", daysAgo: 12 },
      { type: "status_change", message: "Deal summary generated", from: "draft", to: "summary_ready", daysAgo: 9 },
      { type: "status_change", message: "Sent to 3 matched lenders", from: "summary_ready", to: "sent_to_lenders", daysAgo: 1 },
      { type: "reminder", message: "Follow up with Longacre Capital on term sheet timing", dueAt: daysFromNow(3), daysAgo: 1 },
    ],
    matches: [
      { name: "Longacre Capital", score: 92, reasons: ["Lends up to $15M in Canterbury", "Comfortable with staged townhouse developments", "65% max LVR comfortably covers this 64% request"], stage: "interested", daysAgo: 1 },
      { name: "Castlepoint Finance", score: 84, reasons: ["Development lending nationwide up to $30M", "Flexible on pre-sales for repeat-track-record builders", "65% max LVR fits"], stage: "contacted", daysAgo: 1 },
      { name: "Beacon Hill Capital", score: 78, reasons: ["Broad development appetite nationwide", "65% max LVR fits", "Accepts either pre-sales position"], stage: "contacted", daysAgo: 1 },
      { name: "Southern Cross Mezzanine", score: 61, reasons: ["Mezzanine layer could bridge the pre-sales shortfall", "75% max LVR gives structuring headroom", "Requires pre-sales evidence, which is partly met at 30%"], stage: "matched", daysAgo: 1 },
    ],
  });

  await addApplication({
    clientName: "Wynyard Property Holdings",
    loanAmount: 4_200_000,
    purpose: "refinance",
    location: "Auckland Central, Auckland",
    propertyValue: 7_000_000,
    preSales: null,
    termMonths: 24,
    notes: "Refinancing an existing bank facility on a fully-leased CBD-fringe office building ahead of a rate reset. Two anchor tenants on leases through to 2029.",
    status: "term_sheet_received",
    createdDaysAgo: 21,
    updatedDaysAgo: 3,
    lvrPct: 60,
    summary:
      "## Deal summary — Wynyard Property Holdings\n\n" +
      "**Loan request:** $4,200,000 refinance facility, 24-month term.\n\n" +
      "**Security:** First mortgage over a fully-leased commercial office building, Auckland Central. Valuation of $7,000,000 (LVR 60%).\n\n" +
      "**Purpose:** Refinance of an existing bank facility ahead of an unfavourable rate reset.\n\n" +
      "**Location:** Auckland Central, CBD-fringe — strong tenant demand corridor.\n\n" +
      "**Repayment / exit:** Ongoing lease income from two anchor tenants (leases to 2029); term-end refinance or sale.\n\n" +
      "**Key strengths:**\n" +
      "- Fully leased with long-dated anchor tenants, low vacancy risk.\n" +
      "- Conservative 60% LVR against a recent independent valuation.\n" +
      "- Clean repayment history on the existing bank facility.\n\n" +
      "**Key risks:**\n" +
      "- Both anchor tenants are in the same sector — some concentration risk if that sector softens.\n\n" +
      "**Missing information:** Certificate of title and most recent rent roll were not included in the uploaded documents — request before sending to further lenders.\n\n" +
      "*This summary was generated from the uploaded valuation and financials, and the details entered in the application form. Review and edit before sending to lenders.*",
    events: [
      { type: "status_change", message: "Application created", to: "draft", daysAgo: 21 },
      { type: "status_change", message: "Deal summary generated", from: "draft", to: "summary_ready", daysAgo: 18 },
      { type: "status_change", message: "Sent to 2 matched lenders", from: "summary_ready", to: "sent_to_lenders", daysAgo: 15 },
      { type: "status_change", message: "Term sheet received from Tussock Lending", from: "sent_to_lenders", to: "term_sheet_received", daysAgo: 3 },
    ],
    matches: [
      { name: "Tussock Lending", score: 90, reasons: ["Strong on investment-grade commercial refinancing", "65% max LVR comfortably covers this 60% request", "Lends in Wellington, Manawatū-Whanganui and Canterbury — confirm Auckland exception"], stage: "interested", daysAgo: 15 },
      { name: "Harbourview Debt Partners", score: 87, reasons: ["Auckland CBD and fringe commercial property specialist", "60% max LVR fits exactly", "$3M–$40M range fits this facility size"], stage: "contacted", daysAgo: 15 },
    ],
  });

  await addApplication({
    clientName: "Trident Engineering Ltd",
    loanAmount: 1_800_000,
    purpose: "business_acquisition",
    location: "Hamilton, Waikato",
    propertyValue: null,
    preSales: null,
    termMonths: 60,
    notes: "Management buyout of an established precision engineering firm. Founder retiring, incoming director has 12 years with the business. Three-year trading history attached.",
    status: "draft",
    createdDaysAgo: 2,
    updatedDaysAgo: 2,
  });

  console.log("Seeded demo adviser demo@mandate.test / demo1234 with 3 sample applications.");
} finally {
  await db.close();
}
