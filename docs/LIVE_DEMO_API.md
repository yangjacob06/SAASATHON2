# Connect the hosted Southern Manufacturing demo

The integration is prepared locally for **mandate-ollie-software.vercel.app**. It is not live until these files are deployed and the server secrets are configured.

## 1. Configure the product deployment

Use the Vercel project that serves `mandate-ollie-software.vercel.app`, not the separate marketing project.

For the repository layout in this checkout:

| Setting | Value |
| --- | --- |
| Root Directory | `MODEL/prototype` |
| Framework Preset | Other |
| Node.js Version | 22.x |
| Build Command | `node build.mjs` |
| Output Directory | `dist` |
| Install Command | Empty; this demo has no npm dependencies |

`MODEL/prototype/vercel.json` supplies the build/output/function settings. Remove conflicting dashboard overrides. If the deployed repository contains the prototype files at its repository root, leave Root Directory empty instead; keep `api/`, `build.mjs`, `package.json` and `vercel.json` beside `index.html`.

The build copies only browser assets into `dist`. Vercel deploys `api/analyze.js` as a separate server function at `/api/analyze`. Do not upload only `dist` as a static site: it would omit the function.

## 2. Add private server environment variables

In this Vercel project's Settings → Environment Variables, add:

| Name | Value |
| --- | --- |
| `OPENAI_API_KEY` | Your OpenAI project API key with access to Responses and available API credit |
| `MANDATE_DEMO_CODE` | A private, random ASCII access code, 16–256 characters long |
| `OPENAI_MODEL` | Optional. Defaults to `gpt-4o-mini`, matching the existing marketing app's choice |

Select Production, plus Preview if rehearsing on a preview deployment. Redeploy after changing variables. Never prefix these variables with `NEXT_PUBLIC_` or `VITE_`, put their real values in source files, or paste your API key into the demo. The access code entered in the interface is the separate `MANDATE_DEMO_CODE`, not your OpenAI key.

Use an OpenAI project with the existing credit. Check project usage and available rate limits before the pitch. The endpoint caps each request at 32 KiB and each response at 1,800 output tokens. It has a 45-second upstream timeout, a short cache, request deduplication and a per-instance request throttle (5/minute and 50/hour). **The throttle is not a global spending cap across Vercel instances.** Keep the demo code private; use Vercel access/firewall controls and the OpenAI project's supported usage controls for wider access. This is a synthetic pitch integration, not multi-user production authentication.

## 3. Deploy the code

Push the reviewed changes to the branch connected to this Vercel product project, then deploy that revision. Merely adding environment variables to the old static deployment will not connect it. No changes to the marketing app's separate PDF summariser are required.

## 4. Present the live journey

1. Open Overview → Start Southern demo.
2. Create **Southern Manufacturing Demo Ltd** with the $8m acquisition request.
3. Upload the company overview, management accounts and financial history CSVs from `MODEL/prototype/synthetic-data/pitch`.
4. Confirm the nine fields and the annual history, then select **Done · review summary**.
5. Enter the private demo access code and select **Generate live AI summary**. After the first entry, Done automatically drafts for subsequent deals during that browser session.
6. Wait for **Live AI draft ready for review**. Read and edit the summary, check the final acknowledgement, then select **Confirm & view lenders**.
7. Open a lender's report and download its PDF. The PDF contains the reviewed narrative, financial charts and that lender's criteria comparison.

If the API fails, the interface shows the failure. The adviser can retry or explicitly select **Use local summary**. The local option is labelled as a template; it is never described as a successful live AI response. No request automatically contacts a lender.

## Data and review boundaries

- The browser parses the CSVs and retains each field's source. Differences require the existing adviser decision.
- Only the confirmed field values, historical figures, source labels and missing-information notes are sent to the server, then OpenAI. The original CSV files are not uploaded to OpenAI.
- The server validates the payload, computes the small set of narrative ratios and asks the OpenAI Responses API for structured summary sections. It uses `store: false`; this setting is not a promise of zero retention under all OpenAI policies.
- OpenAI drafts the executive summary, financial commentary, repayment considerations, strengths, risks and missing information. It does not set lender fit or alter confirmed figures.
- CSV extraction, charts, fit percentages and PDF generation continue using the existing deterministic application code. AI text requires adviser review and can contain errors.
- Editing fields or files invalidates the previous review. Results that return after a deal has changed are discarded. Reset cancels outstanding requests and clears the remembered demo code.
- Drafts remain browser-session-only. Refreshing loses them. The server does not save borrower files or deal records; its short in-memory response cache is shared within a warm instance for this private synthetic demo.

## Local preview

Copy `MODEL/prototype/.env.example` to `MODEL/prototype/.env.local` and fill in the private values locally. These environment files are gitignored. From the repository root run:

```powershell
node tools/preview.mjs
```

Open `http://127.0.0.1:4318`. Restart the preview after editing source files or environment variables; it prepares the browser build on startup. The separate persistent Express workspace is unchanged.

## Troubleshooting

| Message | Action |
| --- | --- |
| Endpoint unavailable / HTML instead of JSON | Check Root Directory and deploy the API alongside the static build. |
| Live AI is not configured | Add `OPENAI_API_KEY` and a demo code of at least 16 characters to the correct environment, then redeploy. |
| Enter the private demo access code | Use the exact separate demo code. Do not use the OpenAI key. |
| OpenAI busy / usage limit | Check OpenAI project credit, model access and rate limits; retry after waiting. |
| API configuration unavailable | Check the server key, model and Vercel function logs. Logs contain status/request IDs, not uploaded data or keys. |
| Deal changed during generation | Confirm the changed figures and generate a fresh draft. |

## References

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI production guidance](https://developers.openai.com/api/docs/guides/production-best-practices)
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
