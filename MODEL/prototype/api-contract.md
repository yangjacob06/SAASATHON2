> **Implemented API and preserved draft.** The implemented persistent API is documented in [WORKSPACE_API.md](../../docs/WORKSPACE_API.md). The `/api/v1/deals/analyze` proposal below remains an unimplemented partner-integration draft. Existing browser adapter contracts are preserved. Do not implement a client against this draft without reconciling it with the actual workspace routes.

# Mandate analysis API contract — pre-implementation draft

This document defines the handoff between the adviser interface and a future Mandate backend. It is a contract proposal, not a live API. The current prototype remains browser-only and uses fictional data.

## First endpoint

For the first integration, use one synchronous endpoint:

```http
POST /api/v1/deals/analyze
Authorization: Bearer <session-token>
Content-Type: multipart/form-data
```

The request contains one `deal` JSON part and zero or more `files` parts. The backend processes the submitted synthetic documents, prepares proposed extracted values, generates a summary draft, and compares the deal with its server-managed lender criteria. It returns one response in the shape below. The first integration should not save files or deal records after the request finishes.

This endpoint is intentionally small for the prototype. A later production service may split deal creation, document upload, and analysis into separate endpoints once authentication, persistence, permissions, audit history, and retention rules are designed.

## Request

The `deal` part is JSON using the existing normalized prototype fields. Unknown values are `null` or omitted; do not invent them to fill gaps.

```json
{
  "dealId": "demo-kowhai-950k",
  "updatedAt": "2026-09-26T10:30:00+12:00",
  "company": {
    "name": "Kowhai Contracting Ltd",
    "industry": "Civil construction",
    "location": "Hamilton, New Zealand"
  },
  "funding": {
    "currency": "NZD",
    "amount": 950000,
    "purpose": "Equipment purchase and seasonal working capital",
    "termMonths": 36,
    "preferredTiming": "Within 8 weeks",
    "security": ["Equipment", "Commercial property"]
  },
  "financials": {
    "annualRevenue": { "amount": 2850000, "currency": "NZD", "periodEnd": null },
    "ebitda": { "amount": 390000, "currency": "NZD", "periodEnd": null }
  },
  "documents": [
    { "id": "doc-company-overview", "filename": "kowhai-company-overview.csv", "kind": "company_overview", "status": "provided" },
    { "id": "doc-management-accounts", "filename": "kowhai-management-accounts.csv", "kind": "management_accounts", "status": "provided" },
    { "id": "doc-accountant-summary", "filename": "kowhai-accountant-summary.csv", "kind": "accountant_summary", "status": "provided" },
    { "id": "doc-equipment-quote", "filename": "kowhai-equipment-quote.csv", "kind": "equipment_quote", "status": "provided" },
    { "id": "doc-cash-flow", "filename": null, "kind": "cash_flow_forecast", "status": "missing" }
  ],
  "review": {
    "confirmedFields": ["company.name", "funding.amount", "financials.annualRevenue"],
    "conflicts": [],
    "resolutions": [
      {
        "field": "financials.annualRevenue",
        "chosenValue": 2850000,
        "sourceIds": ["doc-management-accounts"],
        "resolvedAt": "2026-09-26T10:25:00+12:00"
      }
    ]
  },
  "criteriaSetId": "fictional-nz-demo"
}
```

Each uploaded document is sent as a separate `files` part, retaining its filename and content type. The `deal.documents` entries identify the submitted files and the expected documents that are still missing. The browser resubmits all session files when it requests a fresh analysis; it holds the files locally and the first endpoint stores nothing. For this first prototype contract, accept up to five files of 1 MB each and only the agreed synthetic CSV format. PDF, Word, Excel, OCR, and real borrower documents are not part of this contract yet. Lender criteria are selected by the server using `criteriaSetId`; the browser must not supply or override the criteria records.

## Successful response

Return `200 OK` only when the request has been processed. The response is a draft for adviser review, never an approval or offer.

```json
{
  "requestId": "req_demo_01",
  "dealId": "demo-kowhai-950k",
  "criteriaSetId": "fictional-nz-demo",
  "criteriaSetVersion": "1",
  "extraction": {
    "documents": [
      {
        "documentId": "doc_company_overview",
        "filename": "kowhai-company-overview.csv",
        "status": "processed",
        "proposedFields": [
          {
            "field": "company.name",
            "value": "Kowhai Contracting Ltd",
            "currency": null,
            "periodEnd": null,
            "source": { "documentId": "doc_company_overview", "filename": "kowhai-company-overview.csv", "locator": { "row": 2 } },
            "confidence": 0.99,
            "reviewStatus": "needs_review"
          }
        ],
        "warnings": []
      }
    ],
    "conflicts": []
  },
  "summary": {
    "text": "Kowhai Contracting Ltd is seeking NZ$950,000 over 36 months for equipment purchase and seasonal working capital. The business operates in civil construction from Hamilton, New Zealand. Recorded annual revenue is NZ$2,850,000. Recorded EBITDA is NZ$390,000. Proposed security includes equipment and commercial property.",
    "status": "draft",
    "method": "local_template",
    "missingFields": [],
    "missingDocuments": ["Cash flow forecast"],
    "conflicts": [],
    "reviewItems": ["Documents still needed: Cash flow forecast."],
    "basedOnDealId": "demo-kowhai-950k",
    "basedOnUpdatedAt": "2026-09-26T10:30:00+12:00",
    "adviserReviewRequired": true
  },
  "lenderComparisons": [
    {
      "lenderId": "demo-kauri-capital",
      "lenderName": "Kauri Capital",
      "synthetic": true,
      "criteriaAsAt": "Illustrative demo criteria",
      "overall": "some_criteria_overlap_gaps_to_check",
      "counts": { "matches": 3, "outsideCriteria": 1, "needsCheck": 0 },
      "checks": [
        {
          "criterion": "amountNZD",
          "outcome": "outside_criteria",
          "dealValue": 950000,
          "recordedCriteria": { "currency": "NZD", "minimum": 1000000, "maximum": 5000000 },
          "explanation": "NZ$950,000 is outside the recorded NZ$1,000,000–NZ$5,000,000 range."
        },
        {
          "criterion": "purpose",
          "outcome": "matches",
          "dealValue": "Equipment purchase and seasonal working capital",
          "recordedCriteria": ["business acquisition", "equipment purchase", "business acquisition and equipment"],
          "matchedCriteria": ["equipment purchase"],
          "explanation": "The stated purpose overlaps with this recorded preference: equipment purchase."
        },
        {
          "criterion": "security",
          "outcome": "matches",
          "dealValue": ["Equipment", "Commercial property"],
          "recordedCriteria": ["commercial property", "equipment"],
          "matchedCriteria": ["commercial property", "equipment"],
          "explanation": "Proposed security overlaps with these recorded preferences: commercial property; equipment."
        },
        {
          "criterion": "termMonths",
          "outcome": "matches",
          "dealValue": 36,
          "recordedCriteria": { "minimum": 12, "maximum": 60 },
          "explanation": "36 months is within the recorded 12–60 month range."
        }
      ],
      "explanation": "Some criteria align, and at least one recorded criterion does not. Review the gaps before deciding whether to investigate further."
    }
  ],
  "disclaimer": "Illustrative comparison of supplied deal details with recorded criteria. Not a credit decision, offer, or approval prediction. Adviser review is required; confirm current criteria directly with each lender.",
  "warnings": []
}
```

The response example is abbreviated to one fictional document and one fictional lender for readability. Real responses include all processed documents, extracted facts, conflicts, and lender comparisons selected by the server.

## Field and review rules

- `extraction.documents[].proposedFields[]` contains suggestions only. The backend must not silently replace adviser-entered deal values. Each suggested field includes a source document and a page, row, cell, or other supported locator when available.
- `confidence` is an extraction signal for adviser review, not a probability of funding or correctness guarantee. It may be `null` when unavailable.
- Multiple different values for one field appear in `extraction.conflicts`; affected summary facts and lender checks must be marked for review instead of choosing a value automatically.
- `summary.method` may be `local_template` or a documented model-draft value. `summary.status` begins as `draft`. Only an explicit adviser action in the application can set it to `reviewed`.
- `lenderComparisons[].lenderId` and `criteriaAsAt` identify the profile and version used. Each `checks[]` entry preserves the deal value, recorded criterion, outcome, matched preference, and explanation. Allowed outcomes are `matches`, `outside_criteria`, and `needs_check`.
- Allowed overall labels are `several_criteria_align`, `possible_criteria_overlap`, `some_criteria_overlap_gaps_to_check`, `needs_check`, and `no_recorded_criteria_overlap`.
- No overall score, credit decision, approval prediction, offer, ranking, lender contact, or automatic submission is returned.
- Use safe text rendering for all response strings. Treat model output as untrusted data and validate it against this schema before returning it to the browser.

## Error response

Errors use `application/json` and the same envelope:

```json
{
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "Upload a supported synthetic CSV document.",
    "retryable": false,
    "fieldErrors": []
  },
  "requestId": "req_demo_01"
}
```

Use `400` for malformed requests, `401` for a missing or invalid session, `413` for a file that exceeds the configured size limit, `415` for unsupported file types, `422` for validly formatted but unusable content, `429` for rate limits, and `500` for unexpected server errors. Error messages must not reveal secrets, raw document contents, or internal stack traces.

## Local implementation and handoff

`window.MandateDealAnalysis.analyzeDeal(deal, lenders)` in `deal-analysis.js` is the current deterministic local implementation for the `summary` and `lenderComparisons` parts of this contract. It does not extract arbitrary uploaded files or call a model. `document-upload-ui.js` currently parses the supplied synthetic CSVs in the browser and presents proposed values for adviser confirmation. Keep this as the offline fallback when a backend is later added.

The future UI integration should call one provider interface and choose either the local implementation or a backend implementation. It should not contain an API key. For the first integration, keep the endpoint stateless, use only synthetic files, and validate the response shape before displaying it.

## Not included in this pre-implementation contract

Before real borrower documents are considered, separately decide authentication and workspace access, encrypted storage and transmission, retention and deletion, consent, audit history, server-side key management, logging redaction, and incident handling. This prototype does not settle those operational or legal requirements and must remain on synthetic data until they are designed and reviewed.
