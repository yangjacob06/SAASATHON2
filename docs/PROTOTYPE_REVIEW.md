# Prototype review — 27 September 2026

## Delivered

- Overview follows the supplied dashboard reference: live totals, a deal pipeline, next steps, recent activity and a Southern Manufacturing demo shortcut, retaining Direction 02 branding.
- Deals has its own searchable register and All / Needs attention / With lenders filters.
- Lenders is a separate directory of five fictional relationships, with mandate ranges, terms, sectors, security, purposes, appetite, effective dates and linked example deals. No real contact details were supplied.
- Northstar, Harbour & Pine and Ridgeway are preloaded, reviewed submission examples. Original request amounts, FY2025 revenue/EBITDA and outstanding documents are preserved. They have summaries, charts, individual lender reports, notes and local stage controls.
- Southern Manufacturing Demo Ltd remains the NZ$8m acquisition pitch. Its CSV and final-summary checks must be completed before lender reports become available.

## Bugs fixed

1. Overview and Deals shared a renderer. Separate renderers now own the dashboard and register.
2. The global lender tab redirected into the active deal. It now opens a relationship directory; deal comparisons stay under Deals.
3. Reset left pitch pane/filter state behind. Reset clears that state and restores the three preloaded examples, their stages, source data and reviews.
4. The pitch layout hid notes and stage updates. Both controls and deal-linked activity are available again.
5. Sample reports called bundled sources uploaded CSVs. HTML and PDF exports now distinguish bundled documents from uploads, preserve missing documents and identify the single supplied financial year.
6. The inherited HTML renderer interpolated adviser-entered text without escaping. Company details and activity text are escaped before entering HTML; a regression test covers this.
7. The base script declared navigation twice. Removed the obsolete declaration and the obsolete shared pitch overview renderer.
8. Navigation could retain the previous page's scroll position. Tab/deal navigation returns to the top and identifies the current navigation item for assistive technology.
9. Draft creation was absent from the new dashboard's canonical activity records. It is now stored with the deal.
10. Report follow-up text always requested acquisition target accounts. Requests now reflect whether the funding purpose is an acquisition.

## Brief alignment

The adviser remains responsible for review and decisions. Unknowns and missing documents remain visible. Fit is a seven-criterion alignment percentage, never approval probability. Submissions and lender relationships are explicitly simulated; no communication is sent. Records stay in the browser session, and reset/refresh restore the baseline. No OpenAI integration was added.

The three existing companies have only FY2025 revenue and EBITDA in the original fixtures. Earlier years, cash flow and other statements have not been invented. Southern's uploaded pack supplies the multi-year pitch charts. The persistent Express workspace remains a separate implementation, as described at the top of `brief.md`.

## Verification

- Full repository suite: **53 tests passed, 0 failed** (`node --test --test-concurrency=1 tests/*.test.js`). Includes parsing, review invalidation, source provenance, PDF structure, relationship records, tenant boundaries and persistence.
- Declared dependencies installed with `pnpm install --frozen-lockfile --ignore-scripts`; no dependency versions or lockfile changed.
- Updated JavaScript syntax checks and `git diff --check` passed.
- Desktop 1440px and mobile 390px browser inspection, including light/dark themes. No document-level horizontal overflow observed; wide financial tables scroll within their containers.
- Browser interactions: separate tabs, both searches, opening preloaded deals, notes, stage updates, Southern shortcut, three-file upload, both confirmation gates, five 86% Southern comparisons, single-lender report preview and PDF download.
- Reset returned counts to three, removed the temporary Southern draft and adviser note, and restored Northstar's submitted example and lender reports.
- Branded sample PDF rendered and visually inspected. The Southern PDF also downloaded to the browser's Downloads folder.
- Impeccable detector: no findings for the new workspace CSS/JS. Existing legacy styling was retained where outside the changed surfaces.

## Technical quality assessment

| Area | Score / 4 | Evidence and limit |
| --- | ---: | --- |
| Accessibility | 3 | Labelled controls, keyboard interaction, focus styles and current-page state checked; no exhaustive assistive-technology audit |
| Performance | 3 | Local fonts, no new runtime library, small local datasets; no load benchmarking |
| Responsive layout | 3 | Desktop and phone layouts inspected; contained table scrolling |
| Theming | 3 | Shared tokens and both themes checked; inherited components still contain legacy colour declarations |
| Implementation integrity | 4 | Separate page responsibilities, canonical data, explicit synthetic provenance and passing regression coverage |
| **Total** | **16 / 20** | **Good; requested prototype flows checked** |
