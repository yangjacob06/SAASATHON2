# Synthetic deal and provider data

Everything here is fictional: businesses, people, lenders, mandates, amounts, dates, documents, events, and scores. These are not verified market facts, actual lender terms, credit decisions, or offers. Registry-style IDs use SYNTH labels and are not NZBNs or Companies Office identifiers.

## Folders and use

- borrower-documents contains five CSV files the current prototype can download and read locally. They use the exact field,value,currency,period_end format and only fields currently supported by document-upload-ui.js. The management accounts and accountant summary intentionally disagree on FY2025 revenue to demonstrate conflict review.
- reference-tables contains organisation, user, company, deal, financial-period, facility, security, ownership, transaction, working-capital, derived-metric, forecast, risk, extraction-evidence, provider, mandate, match, event, and note fixtures. These reflect the wider Deal Profile and Deal Workspace goals, but the current website does not load them. They are future integration fixtures, not another upload format.

Open ../index.html, enter the demo, create a synthetic deal using Fill fictional example, open its deal workspace, and use the five links in the document panel. Only files in borrower-documents are upload examples. The browser reads them locally and does not send their contents to a server. Current parsing supports company name, industry, location, requested NZD amount, purpose, term, security, revenue, and EBITDA. Other data in reference-tables is not extracted or displayed by the website.

The current browser comparator uses three fictional providers from ../synthetic-data.js: Kauri Capital, Harbour Funding, and Tui Credit Partners. The reference tables also include the five fictional providers from the Deal Workspace example. Similar names do not refer to actual lenders. Scores in deal_matches.csv are user-supplied fictional seed values, not output from a production matching engine. This repository has no production extraction service, matching API, database, or authentication system.

## Data design

- Use one row per entity, period, facility, asset, ownership interest, risk fact, mandate, match, or event; stable synthetic IDs join the rows.
- Monetary values are numeric with an explicit currency. Blank means unknown or not supplied, not zero. This prototype dataset starts in NZD.
- period_type distinguishes historical actuals, year-to-date actuals, and forecasts. A forecast must not replace a historical actual.
- Source columns describe fictional supporting records, not real page citations or model confidence measurements.
- Derived metrics are examples only. Blank values mean the calculation is unsupported by the supplied inputs or the definition needs agreement; a metric should not be filled just to complete a profile.
- Mandates are invented only to exercise product screens. A live system needs an adviser-verified source and effective dates because private-credit mandates change and may not be public.
- Do not use these fixtures to rank real borrowers, advise on lending, or claim that a real lender accepts a deal.

## Research basis

The field categories follow the supplied prompt and New Zealand public guidance; there is no single universal lender application checklist. Companies Office register information can help verify entity names, numbers/NZBNs, status, incorporation, addresses, directors, and some shareholding information. Availability varies; source and date such data rather than assuming a register record is complete. Inland Revenue minimum company financial statements include a balance sheet, profit and loss statement, and accounting policies, with comparative and other supporting information in applicable cases. XRB NZ IAS 1 describes complete statements including financial position, performance, changes in equity, cash flows, notes, and comparatives. PPSR searches concern registered personal-property security interests; they do not replace property valuation or legal/security review. Privacy principles govern collection, storage, use, disclosure, and correction of personal information.

Sources: [Companies Register search guide](https://companies-register.companiesoffice.govt.nz/help-centre/getting-support-to-use-the-companies-register/searching-the-companies-register/), [Companies Office bulk-data guide](https://www.companiesoffice.govt.nz/data-services/ways-to-get-our-data/bulk-data-help-guide/), [IRD minimum financial reporting](https://www.ird.govt.nz/managing-my-tax/record-keeping/financial-reporting-for-companies/standards-for-minimum-financial-reporting), [XRB NZ IAS 1](https://standards.xrb.govt.nz/standards-navigator/nz-ias-1/), [Companies Office register information](https://www.companiesoffice.govt.nz/about-us/searching-our-registers/), and [Privacy Commissioner principles](https://www.privacy.org.nz/resources-and-learning/knowledge-base/view/376/).

## Leverage definition to resolve

The supplied prompt defines leverage as net debt divided by EBITDA, with net debt equal to total debt less unrestricted cash. Its Southern Manufacturing e