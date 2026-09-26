# Mandate prototype: new-deal data flow brief

## Purpose

This brief aligns the Mandate team on the adviser journey for creating a deal, organising synthetic company information and documents, reviewing a deal summary, and comparing details with recorded lender criteria. It is a product and implementation brief for the static prototype and a guide to a later API/model implementation.

Mandate is an assistant to the adviser. The adviser remains responsible for checking information, editing and approving the summary, deciding what a comparison means, choosing whether to approach a lender, and communicating with that lender. Lender comparisons are illustrative criteria overlaps only; they are not credit decisions, advice, approval predictions, or offers.

## Product context and current prototype

The project is a subscription-software concept for New Zealand commercial finance advisers and brokers arranging private-credit deals. The repository's [README](../../README.md) describes how to open the static demo. [Scope.md](../../Scope.md) sets the SaaSathon prototype boundaries: fictional data, a complete example journey, a small fictional lender list, and no real borrower records, lender integrations, automated credit decisions, or payment processing.

The current prototype is a single static page. [index.html](index.html) contains both the marketing page and adviser workspace shell. [app.js](app.js) contains the sample deal records, page rendering, interactions, summary template, prewritten lender cards, activity list, and stage changes. [styles.css](styles.css) provides base styling and [layout.css](layout.css) adds later workspace layout overrides, including responsive rules. The demo's three deals and lender matches are hard-coded in JavaScript. Changes are held in memory for the page session; the theme preference is saved in local storage. No backend or model call is present.

Current controls labelled New deal do not create a record. Adding a document, editing a deal, and adding a note are placeholders. The current summary is a sentence template and current lender cards are stored labels, not calculated matches. These are the seams the milestones below are intended to replace progressively while keeping the existing sample journey available.

## People and successful outcome

The primary user is a finance adviser or broker organising a business funding request. They may have incomplete information, multiple documents, or figures that disagree. They need to see what is known, where it came from, what needs checking, and what they can do next.

A successful demo lets an adviser create a clearly synthetic draft, review organised details and source notes, see missing or conflicting information, produce an editable draft summary, inspect explainable criteria comparisons, and track the next step. The adviser can stop, correct, or defer at every review point. No communication is sent to a lender.

## Proposed end-to-end user journey

### 1. Start a new deal

The adviser selects **New deal** from the overview or Deals page. The prototype opens a focused intake form and labels it as a synthetic demo. Offer an option to populate the form with a fictional example so a visitor can complete the flow quickly.

The adviser can cancel and return to the previous page without creating a record. Saving creates a draft deal and opens its details. The first milestone should support form entry and fictional autofill; document-based extraction is a later milestone.

### 2. Enter core deal details

Collect the minimum details needed to identify the opportunity and explain the funding request:

- Company name, industry, and New Zealand location.
- Requested amount in NZD, stored as a number.
- Funding purpose.
- Requested term in months, if known.
- Preferred timing, if known.
- Proposed security, if known.
- Annual revenue and EBITDA with their reporting period, if known.

Company name, requested amount, and purpose are required to save a useful initial draft. Other fields may be unknown. Show clear field errors and preserve valid entries after a validation failure. Do not treat an unknown value as zero or invent a default.

### 3. Save and organise the draft

Saving gives the deal a stable unique ID, a `draft` status, timestamps, a synthetic-data marker, and deal-linked activity. Add it to the deals list and make it openable like the existing sample deals. Dashboard counts and deal list counts should come from the data rather than fixed display text.

The initial milestone stores new drafts in browser memory only. Tell the user that refreshing the page clears changes. The supplied fictional sample records remain available. Reset should restore the initial sample records, clear session-created records and activity, and return the interface to its initial state.

### 4. Add synthetic documents (later milestone)

Let the adviser choose from bundled fictional documents or a clearly simulated document pack. Do not ask users to select real borrower documents for the prototype. For each item, show its name, type, status, and whether its details are fixed sample values or simulated extraction. A document can be added, marked missing, or removed from the draft. Do not imply that a real file was uploaded or analysed when it was not.

The later model/API path can accept permitted documents through a backend, extract proposed fields, and return source references. The interface should show each proposed value with its document/source and review status. If sources disagree, retain both values and flag a conflict for adviser resolution; do not silently pick one.

### 5. Review organised information

Show the deal's key fields in a consistent overview. Mark each as confirmed, needs review, missing, or conflicting. Where extraction exists, show the source alongside the proposed value. Let the adviser correct or confirm values. Keep missing information visible so it can become a checklist item.

Changing a field after summary review or criteria comparison should mark those outputs as needing review again. The source deal record remains the canonical working data for all screens.

### 6. Draft and review the deal summary

Create a readable summary from the current structured fields. In the local prototype, use a deterministic template; it needs no API key. Clearly label it as a draft, allow the adviser to edit it, and display missing information or review notes separately from factual claims. Do not fill gaps with assumptions.

Record the summary's generation method, source deal version or update time, draft text, and review status. The adviser must explicitly mark the summary reviewed. If source details change, return the summary to needs-review. Do not send or share the summary with a lender from the demo.

### 7. Compare lender criteria

Keep a small fictional lender criteria catalogue separate from deal records. Each criteria item should name the requirement, its allowed values or range, and any explanatory note. Compare known deal values with these rules and show a result for each lender: matches, outside criteria, or needs checking because the required deal detail is missing or ambiguous.

Each result should explain the specific overlap or gap, such as requested amount falling inside or outside a stated range, or security type matching a recorded preference. Show the criteria alongside the deal value used. Do not rank creditworthiness, predict approval, call a result an offer, or suggest that a lender was contacted. An adviser should verify that criteria are current directly with any lender.

The present cards in `app.js` are illustrative examples only. In particular, hard-coded labels can contradict the example terms (for example, a deal amount can exceed a displayed lender maximum). The criteria milestone should replace these labels with explicit fictional rules and explainable comparisons.

### 8. Show next steps and deal progress

Derive suggested next steps from missing documents, unconfirmed fields, summary review, and criteria questions. Keep suggestions editable and attributable to the deal. The adviser controls stage changes and records activity when they happen.

Use named stages consistently across the deal detail, overview, and list. Suggested stages are `draft`, `adviser_review`, `ready_to_send`, `sent_to_lender`, `more_information_needed`, and `decision_received`. Stages after `ready_to_send` are workflow records only: the demo does not send anything or record an actual lender response unless the adviser enters fictional sample activity. Stage changes must not imply a credit decision.

## Shared deal data shape

Use one deal object as the source for overview, deal details, summary, documents, criteria comparisons, activity, and next steps. Store amounts and terms as numbers, use explicit `null` for unknown values, and format NZD only in the interface. Keep UI labels and formatted strings out of the underlying values.

```js
{
  id: "deal-unique-id",
  synthetic: true,
  createdAt: "ISO-8601 timestamp",
  updatedAt: "ISO-8601 timestamp",
  company: {
    name: "Example Company Limited",
    industry: "Civil construction",
    location: "Wellington, New Zealand"
  },
  funding: {
    currency: "NZD",
    amount: 2400000,
    purpose: "Business acquisition and equipment",
    termMonths: 36,
    preferredTiming: null,
    security: ["Commercial property", "Equipment"]
  },
  financials: {
    annualRevenue: { amount: 5200000, periodEnd: null, sourceIds: [] },
    ebitda: { amount: 820000, periodEnd: null, sourceIds: [] }
  },
  documents: [
    {
      id: "document-id",
      name: "Management accounts",
      kind: "management_accounts",
      sourceType: "synthetic_sample",
      status: "provided",
      extractedFields: [],
      notes: "Fictional sample document; no real file attached."
    }
  ],
  review: {
    fields: {
      "financials.annualRevenue": {
        status: "needs_review",
        sourceIds: []
      }
    },
    conflicts: []
  },
  summary: {
    text: "",
    method: "local_template",
    status: "not_started",
    generatedAt: null,
    reviewedAt: null,
    basedOnUpdatedAt: null
  },
  workflow: {
    stage: "draft",
    nextSteps: [],
    activity: []
  }
}
```

This is a practical prototype shape, not a fixed production API contract. Keep document content, model output, and user-confirmed values distinguishable. A model's proposed value should not overwrite a confirmed value without adviser action.

## Lender criteria data shape

Store lender examples independently so the same criteria can be compared with multiple deals. Keep the data explicitly fictional and versioned or dated in the interface so the user can see it is example information.

```js
{
  id: "fictional-lender-id",
  name: "Kauri Capital",
  synthetic: true,
  criteria: [
    {
      field: "funding.amount",
      operator: "between",
      minimum: 1000000,
      maximum: 5000000,
      explanation: "Example senior secured facility range"
    },
    {
      field: "funding.security",
      operator: "includes_any",
      values: ["Commercial property"],
      explanation: "Example property security preference"
    }
  ]
}
```

Comparison output should preserve its reason and inputs, for example: lender ID, criteria ID, deal field/value, outcome (`matches`, `outside_criteria`, `needs_check`), and a plain-language explanation. Missing or conflicting input produces `needs_check`, not a match by assumption.

## Local prototype and future service boundary

| Capability | Static prototype, no API key | Future backend or model service |
|---|---|---|
| Intake and validation | Browser form and JavaScript validation | Server-side validation and persistence |
| Sample company information | Bundled fictional records and autofill | Adviser-entered records stored with access controls |
| Documents | Bundled fictional examples and simulated extraction | Secure upload, storage, parsing, and retention controls |
| Deal summary | Deterministic template from structured values | Optional model-generated draft with structured output and fallback |
| Lender comparison | Local rules over fictional criteria | Managed criteria catalogue, versioning, and approved data access |
| Deal progress | In-memory stage and activity | Durable history, users, permissions, and audit trail |

For model-based extraction or drafting, the browser should call Mandate's backend. The backend validates the request, applies access controls, calls the model service using a server-side secret, validates the returned structure, and sends proposed results back for adviser review. Never put API keys or other service secrets in HTML, CSS, browser JavaScript, or client-visible configuration. A model response is untrusted draft data: validate it, retain source references where available, show uncertainty, and require adviser review.

## Implementation milestones

Keep each milestone small enough for the team to review and leave the existing sample deal journey usable.

### Milestone 1: create and reopen a draft

Expected files: `app.js`, `index.html`, `layout.css`, a new `data.js` for initial sample records and shared constants, and this prototype README/brief as needed. Add the New deal form from both existing buttons; support fictional autofill, basic validation, cancel, save to in-memory state, list/detail rendering, and explicit session-only persistence text. Make dashboard/list counts data-driven and make Reset restore all initial data, statuses, and activity. Use safe text rendering for user-entered strings.

Acceptance: a visitor can create a fictional deal with required fields, see validation for missing required fields, cancel without creating it, save and reopen it from the deal list, and reset to the original three records. Unknown optional values remain visibly unknown. Refreshing clears the new record and the UI says so. No existing sample deal flow is lost.

### Milestone 2: synthetic documents and source-aware review

Add a bundled fictional document pack with deterministic sample values. Show source, status, missing values, and conflicts. Allow correcting and confirming extracted sample values. No real file upload or AI call is required.

Acceptance: the adviser can inspect where a sample value came from, resolve a seeded conflict, and see unresolved items remain on the deal checklist.

### Milestone 3: editable summary review

Generate a local template draft from structured fields, allow editing and explicit adviser review, and invalidate review after deal changes. Preserve missing details as review notes rather than inventing values.

Acceptance: the summary reflects the saved deal, can be edited and marked reviewed, is visibly a draft before review, and returns to needs-review when source fields change.

### Milestone 4: explainable fictional criteria comparison

Define lender criteria separately, implement a small set of transparent comparison rules, and render match/gap/needs-check results with the values and reason shown. Include at least one boundary or missing-data example to demonstrate all result states.

Acceptance: each result can be traced to a named fictional criterion and the current deal value. Missing or conflicting values require checking. Every criteria screen says the comparison is illustrative and no lender is contacted.

### Milestone 5: coherent workflow and presentation review

Connect next steps, activity, and named workflow stages across overview, list, and detail pages. Review original sample journeys plus a new draft at desktop and mobile sizes, in light and dark themes. Fix visible navigation, status, count, reset, and review-state inconsistencies.

Acceptance: a visitor can complete the fictional end-to-end demonstration without dead-end controls or contradictory statuses, and the team can explain what is simulated and what is manual.

### Later: API and model exploration

Only after the local flow and review structure are understood, define a backend contract for document intake and proposed extracted fields. Add authentication, authorization, safe file handling, data retention rules, server-side secrets, request validation, error handling, and audit history before using real borrower data. Keep a deterministic local fallback for demos. Never make the model responsible for lender selection, credit decisions, offers, or sending lender communications.

## Team coordination and review

- Keep this brief as the shared description of intended behavior. If scope changes, update it in the same change as the implementation.
- Agree on the fictional sample deal and criteria before implementing comparison logic. Keep all sample companies, documents, and lenders fictional.
- Assign one person to integrate overlapping changes, consistent with `Scope.md`.
- For each milestone, state which files changed, what now works, what remains simulated, and how the team can review it.
- Preserve the marketing page and current sample deals while adding the new flow.
- Keep API keys out of the repository and browser code. If a backend is later introduced, document local setup using a server-side environment variable without committing secret values.
- Use adviser-facing language: “possible criteria overlap” and “needs checking.” Do not describe a match as approval or funding eligibility.

## Decisions to validate with advisers

The repository's [interview guide](../../RESEARCH/interview_questions.md) already asks about the information advisers collect, document types, useful summary sections, missing/conflicting figures, match explanations, trust boundaries, and data concerns. Use interview evidence to refine:

- Which details are essential to capture before a deal can be useful?
- Which documents most often contain the key figures, and how are discrepancies handled?
- What sources and review evidence would an adviser expect beside extracted values?
- What exactly makes a criteria comparison useful without implying a credit decision?
- Which next steps and stages reflect the adviser's real workflow?
- What privacy, access, storage, and deletion controls are required before real data could be used?

Until those questions are validated, treat the data fields, document types, criteria, and workflow stages in this brief as prototype assumptions. Do not request or enter confidential borrower information during the SaaSathon demo.

## Source files

- [Project README](../../README.md)
- [Project scope](../../Scope.md)
- [Prototype page](index.html)
- [Prototype interactions and sample data](app.js)
- [Prototype base styles](styles.css)
- [Prototype layout overrides](layout.css)
- [Adviser interview guide](../../RESEARCH/interview_questions.md)
