# S3 Optimizer

AWS S3 Storage Class Cost Optimization Tool. A web-based financial calculator that models the complete Total Cost of Ownership (TCO) across all S3 storage classes and recommends the optimal class for a given workload — including transition costs, retrieval fees, small object penalties, minimum duration charges, and break-even timelines.

No existing AWS-native or third-party tool models the complete S3 cost surface in a single interface. S3 Optimizer fills that gap.

## Live Beta

[YOUR_VERCEL_URL](https://s3-transition.vercel.app/)

## Local Setup

```bash
git clone <repo-url>
cd s3-optimizer
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests

### Unit Tests

```bash
pnpm test
```

Runs 52 Vitest unit tests covering the TCO formula engine — storage costs, request costs, retrieval fees, small object penalties, IT monitoring, EOZ calculations, break-even logic, regional multipliers, and sensitivity analysis.

### E2E Tests

```bash
pnpm test:e2e
```

Runs 16 Playwright tests (8 desktop Chromium + 8 mobile) covering the full user flow: happy path calculations, small object warnings, IT evaluation, EOZ suppression/display, mutable object warnings, mobile responsiveness, and chart rendering.

## How to Update Pricing

All S3 pricing data lives in a single file: `src/lib/pricing.ts`.

When AWS changes rates:

1. Update the relevant values in the `PRICING` constant (storage costs, request costs, retrieval costs)
2. Update regional multipliers in `REGIONAL_MULTIPLIERS` if region pricing changes
3. Update `EOZ_REGIONS` if Express One Zone expands to new regions
4. **Update the `PRICING_LAST_VERIFIED` constant** to the current date — this date is displayed in the tool header so users know when prices were last checked
5. Run `pnpm test` to ensure formula tests still pass with the new values
6. Adjust test assertions if expected outputs change due to price updates

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui
- **State:** Zustand
- **Charts:** Recharts
- **Unit Tests:** Vitest
- **E2E Tests:** Playwright
- **Package Manager:** pnpm

## Known Limitations (V1)

The following are deliberately out of scope for V1:

- **Data transfer OUT costs** (internet egress) — not modeled
- **S3 Replication costs** — not modeled
- **Cross-region access transfer fees** — not modeled
- **NAT Gateway fees** for EC2 access — not modeled (flagged as a caveat in the tool)
- **Lifecycle transition automation costs** — not modeled
- **Versioning cost impact** — not modeled
- **Multipart upload orphan costs** — not modeled
- **Live AWS pricing API integration** — pricing is hardcoded, updated manually via `src/lib/pricing.ts`
- **User accounts and saved scenarios** — V2 feature
- **GovCloud and China regions** — multipliers applied but not fully validated

Each of these is a documented V2 feature candidate.
