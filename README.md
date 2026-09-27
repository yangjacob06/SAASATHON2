# Persistent Mandate workspace

Run the new adviser application with `pnpm install`, `pnpm migrate`, `pnpm seed`, then `pnpm start`. Open `http://127.0.0.1:4310`. Node.js 22+ is required. [Full setup, demo walkthrough and deployment boundary](docs/WORKSPACE.md) · [Implemented API](docs/WORKSPACE_API.md) · [Requirements and verification](docs/REQUIREMENTS.md).

The original static prototype remains available as described below, and at `/prototype/index.html` when the server is running.

# SAASATHON2

We’re building subscription software for commercial finance advisers and brokers. It helps them organise private-credit applications, prepare deal summaries, identify possible lenders and track application progress.

## Project scope

See [product scope](docs/product/Scope.md) for the requirements, 30-hour build plan and definition of done. The current visual identity is recorded in the [brand guide](docs/brand/DESIGN.md), with the [verification record](docs/verification/VERIFICATION.md) and [interview guide](docs/research/interview_questions.md) alongside the other project documentation.

## Try the interactive demo

Open `MODEL/prototype/index.html` in a browser. Choose **Explore the demo** to enter the sample adviser workspace. From there, open a deal, review the draft summary and illustrative lender criteria, and move the deal through its sample stages.

The prototype is a static website and does not need an install, API key, or paid AI call. All businesses and lender profiles in the demo are fictional. The lender comparisons are examples of criteria overlap, not credit decisions or offers.
