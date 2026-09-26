# Local pitch walkthrough

Open `MODEL/prototype/index.html` directly in Chrome or Edge. No API key, database, build or running API is needed. The Express workspace under `MODEL/workspace` is separate.

1. **Explore the demo → Start Southern demo** on Overview. This opens the intake form prefilled for Southern Manufacturing Demo Ltd. You can also use **New deal → Fill Southern Manufacturing · pitch example**.
2. Review the NZ$8 million acquisition request and save the draft. Revenue and EBITDA are intentionally blank until the CSVs are reviewed.
3. Upload the three Southern CSV files in `synthetic-data/pitch/`. Download links also appear in **Review files**.
4. In **Compare and confirm**, compare the entered values with the CSV values side by side. Use **Confirm matching fields** for identical values; explicitly choose the management accounts' revenue (NZ$33 million) and EBITDA (NZ$4.3 million). Differences are highlighted, repeated sources are grouped, and each chosen value is recorded.
5. Review the annual financial table, including profit and cash flow, and check its acknowledgement. **Done · review summary** becomes available after every field and the history are reviewed.
6. On **Final check**, review all chosen values and their sources, the annual accounts, the draft narrative and missing information. Edit the narrative if needed. Check the acknowledgement and select **Confirm & view lenders**.
7. Five interactive lender cards appear. **Criteria fit** is aligned checks divided by all seven checks, with unknowns included in the total. Southern's unchanged example gives 6/7 = 86%; leverage remains unconfirmed. This is not approval probability. Expand a card to see each check.
8. Use the individual card's **Preview report** or **Download lender PDF**. Each report includes only that lender's profile, the confirmed summary, revenue/EBITDA/cash-flow/net-profit charts, annual figures, source register and open questions. **Print / Save as PDF** provides another export route.

Editing deal fields, reopening a choice, changing the summary, or uploading more files invalidates final confirmation. Complete the check again before downloading updated reports. For the Kowhai discrepancy demonstration, upload the original five borrower CSVs, then optionally upload `pitch/kowhai-financial-history.csv` in a second batch. The five lender profiles are the manufacturing acquisition set, so Kowhai will show several criteria gaps.

The original company-entry, details editing, supported Kowhai uploads and source-conflict review remain available. The five pitch lender profiles are the manufacturing acquisition set; another borrower may fall outside them. Missing data produces an empty chart or a needs-checking result, never invented history. Refreshing resets this browser-session demo, so keep the CSVs downloaded for the live pitch.

## Where the examples come from

- The five fictional lender profiles in `pitch-data.js` copy ABC Private Credit, Southern Capital, Harbour Credit, Pacific Capital and Kauri Private Credit from `reference-tables/capital_providers.csv` and `provider_mandates.csv`.
- The history CSV copies Southern Manufacturing's annual historical actuals from `reference-tables/financial_periods.csv`: revenue NZ$27m / NZ$30m / NZ$33m; EBITDA NZ$3.5m / NZ$3.9m / NZ$4.3m for FY2024–FY2026.
- The company/request pack uses `companies.csv` and the NZ$8m, 36-month acquisition in `deals.csv`. GSA and plant/equipment are proposed demonstration security, not evidence of collateral value or ranking.
- Headline figures are **standalone borrower FY2026**, not the separate NZ$5.4m combined pro forma EBITDA in Tyler's acquisition scenario. The report explicitly asks for target accounts and transaction assumptions. Target returns in mandates are not quoted interest rates.

## Integration boundary

`pitch-analysis.js` calculates comparisons and parses financial history; `pitch-review.js` tracks field review and invalidates final approval on changes; `pitch-ui.js` supplies report/chart rendering; `pitch-flow.js` manages the three-step interface; `pitch-report.js` makes a vector PDF in the browser. No model, API, outbound lender communication or server storage is implemented here. Summaries are reviewable templates. A later API can replace the analysis layer while retaining this intake and presentation flow.

The financial-history importer accepts a single-company annual-actual NZD CSV with the reference-table headers, up to 12 unique periods. It rejects mixed companies, unsupported period types, missing numbers and duplicate periods. The ordinary borrower parser retains the existing `field,value,currency,period_end` format. Arbitrary financial CSV layouts require the later extraction implementation.

## Workspace tabs

- **Overview:** dashboard totals, current pipeline, outstanding next steps, recent activity and the Southern demo shortcut.
- **Deals:** searchable and filterable register. Northstar, Harbour & Pine and Ridgeway open as simulated submission examples, with reviewed figures, missing documents, charts and individual lender reports already available. Only their recorded FY2025 financials are shown.
- **Lenders:** five fictional working relationships with funding ranges, terms, sectors, security, mandate details and linked example deals. Contact details were not supplied and are not invented.
- **Reset demo:** clears created drafts, uploads, notes and review state, then restores all three examples.
