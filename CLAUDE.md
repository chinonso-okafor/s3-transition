# S3 Optimizer — Claude Code Instructions

## What This Project Is
An AWS S3 storage class cost optimization tool. A web-based financial calculator
that models complete TCO across all S3 storage classes and recommends the optimal
class for a given workload. Built in 7 sequential phases — see the Build
Specification document for the full plan.

## Master Reference
The file `S3_Optimizer_Build_Specification.docx` in this folder is the single
source of truth for all requirements: pricing data, formula logic, UI design,
and the 7-phase build plan. When in doubt, consult the spec before writing code.

---

## Version & SDK Policy
When writing code that uses any external SDK, API, or AI model:
1. STOP before writing any import or install command
2. Search for the latest package version, correct model identifiers,
   and current initialization pattern
3. Use what you find — NOT your training data

---

## Tech Stack (Do Not Deviate)
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript — strict mode, zero errors required at all times
- **Styling:** Tailwind CSS v3 — utility classes only
- **UI Components:** shadcn/ui for all standard UI elements
- **State:** Zustand
- **Charts:** Recharts
- **Unit Tests:** Vitest
- **E2E Tests:** Playwright
- **Package Manager:** pnpm — use pnpm for all installs, never npm or yarn

---

## Design System

### Philosophy
Precision-minimal. Carbon Design System information architecture combined with
Apple-level spatial generosity. The goal is a tool that looks like it was
designed by a team that cared deeply — not generic SaaS, not corporate
enterprise. Reference points: Linear, Stripe Dashboard, Vercel Dashboard.
Clean, fast-feeling, credible.

### Palette
```
Page background:       #fafafa
Card surfaces:         #ffffff
Primary text:          #111827
Secondary/label text:  #6b7280
Border/divider:        #e5e7eb
Interactive accent:    #2563eb
Success:               #16a34a
Warning:               #d97706
Destructive:           #dc2626
Header background:     #111827
Muted background:      #f9fafb
```

### Typography
- **Font:** Inter — imported via `next/font/google`. No other fonts.
- **Body:** 14px / 1.5 line-height / #111827
- **Labels:** 12px / uppercase / tracking-wide / #6b7280
- **Section titles:** 16px / semibold
- **Card headings:** 20px / semibold
- **Hero numbers** (savings, TCO totals): 32px / bold / tabular-nums

### Surfaces & Depth
- **Cards:** white background, 1px #e5e7eb border, 8px border-radius,
  single shadow: `0 1px 3px rgba(0,0,0,0.08)`
- No layered shadows. No colored shadows. No gradients. Ever.
- **Hover states:** background shifts to #f9fafb only — no lift, no movement
- **Border radius:** 8px for cards and inputs, 4px for badges/tags, 2px for
  table rows. Nothing larger than 8px.

### Layout
- **Left input panel:** 400px fixed width, white background, 1px right
  border #e5e7eb, full height, internally scrollable
- **Right results panel:** flex-grow, #fafafa background, 24px padding,
  scrollable
- **Mobile:** single column — inputs above, results below
- **Header height:** 64px
- **Base spacing grid:** 8px — all padding and margins in multiples of 8px

### Data Tables (Carbon-inspired)
- Left-aligned text throughout — never center-aligned
- Column headers: 12px / uppercase / tracking-wide / #6b7280 /
  #f9fafb background
- Row height: 48px minimum
- Zebra striping: alternating #ffffff / #f9fafb rows
- Borders: 1px #e5e7eb
- **Recommended row:** #eff6ff background + 4px #2563eb left border accent
- **Current class row:** #f9fafb background + bold text

### Charts
- **Line colors:** #2563eb for recommended class, #9ca3af for current class
- No chart border/box. Minimal gridlines in #f3f4f6.
- Clean tooltips: white background, 1px #e5e7eb border, Inter font, 8px radius
- No legends with colored squares — use inline labels where possible

### Key Components

**Header**
- Full-width #111827 background, 64px height, 24px horizontal padding
- "S3 Optimizer" in white, 16px semibold, left-aligned
- PRICING_LAST_VERIFIED date right-aligned in #9ca3af with info icon tooltip

**Recommendation Card**
- Full-width white surface, 4px left border:
  green (#16a34a) = strong, amber (#d97706) = marginal, red (#dc2626) = stay
- Hero savings number: 32px bold, prominent
- Confidence badge: small pill, flat colored background, no outline, 4px radius
- One-sentence rationale: 14px #6b7280 below the number

**Badges / Tags**
- Small pill shape, flat colored background, no border, no shadow
- 4px border-radius, 12px font, semibold

**Empty State**
- Centered in results panel
- Simple monochrome icon (database or layers), 24px, #9ca3af
- Single line: "Enter your workload details to see recommendations"
- Font: 14px #6b7280. No illustrations. No color. No button.

**Warnings Panel**
- Collapsible, #fffbeb background, 1px #fde68a border, 4px left border #d97706
- Warning items: 14px #92400e text, bullet list

**Input Sections**
- Each section separated by 1px #e5e7eb divider
- Section label: 12px uppercase tracking-wide #6b7280, 16px margin-bottom
- Inputs use shadcn/ui components styled to match this palette
- Focus ring: 2px #2563eb offset-1

---

## Critical Architecture Rules
- Formula logic lives in `/lib/calculator.ts` ONLY — never inline calculations
  in components
- Pricing values live in `/lib/pricing.ts` ONLY — never hardcode a price
  anywhere else in the codebase
- All TypeScript must compile with zero errors before any commit
  (`pnpm tsc --noEmit`)
- Unit tests in `/lib/calculator.test.ts` must pass before building any UI
  component that depends on calculator output
- shadcn/ui components must be used for all standard UI elements (inputs,
  selects, cards, badges, tooltips, buttons)
- Tailwind classes only — no inline styles, no CSS modules, no styled-components

---

## Pricing Data
- All S3 pricing lives in `/lib/pricing.ts`
- The `PRICING_LAST_VERIFIED` constant in that file must be displayed in the
  tool header UI so users know when prices were last updated
- Pricing reflects post-April-2025 AWS published rates
- Never hardcode a price or multiplier outside of `/lib/pricing.ts`
- Regional multipliers and the EOZ-eligible regions list also live in this file

---

## Code Quality Standards
- No placeholder data or mock outputs — the calculator must run real formulas
  against real inputs at all times
- No `console.log` statements in production code
- No TypeScript `any` types — use proper types from `/types/index.ts`
- All user-facing inputs must have proper labels and ARIA attributes
- Lighthouse accessibility score must stay at or above 90
- Run `pnpm tsc --noEmit` before every commit — zero errors required

---

## Phase Discipline
This project is built in 10 sequential phases:

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Scaffold & Pricing Constants | Complete |
| 2 | Calculator Engine & Unit Tests | Complete |
| 3 | Input Panel UI | Complete |
| 4 | Results Panel UI | Complete |
| 5 | Layout Integration & Visual Polish | Complete |
| 6 | E2E Testing & Bug Fixes | Complete |
| 7 | Vercel Deployment & Beta Prep | Complete |
| 8 | Mixed Bucket Support | Complete |
| 9 | Learn Tab, FAQ and Inline Tooltips | Complete |
| 10 | Tiered Pricing, Access Speed, Data Transfer, EDP Disclaimer, Tooltip Fix | Complete |

- Complete and validate one phase fully before starting the next
- Each phase has a validation checklist in the Build Specification document —
  every item must pass before committing
- Use the exact git commit message specified in the Build Specification
- Do not combine phases or skip validation steps

---

## Key File Locations
- `/lib/pricing.ts` — all S3 pricing constants and regional multipliers
- `/lib/calculator.ts` — complete TCO formula engine
- `/lib/calculator.test.ts` — unit tests (52 tests, all passing)
- `/types/index.ts` — StorageClass enum, AWSRegion enum, all interfaces
- `/store/calculatorStore.ts` — Zustand store with live derived output
- `/components/InputPanel.tsx` — left panel input form
- `/components/ResultsPanel.tsx` — right panel results compositor
- `/components/results/` — RecommendationCard, CostComparisonTable,
  BreakevenChart, SensitivityTable, WarningsPanel, EOZCard
- `/components/inputs/` — RegionSelect, StorageInput, ObjectCountInput,
  AccessPatternInputs, ConfidenceSelector, RetentionInput,
  MutableToggle, GlacierTierSelect
- `/components/ui/InfoPopover.tsx` — shared tooltip popover used across all input and result labels
- `/components/learn/LearnTab.tsx` — Learn tab content with pricing explainer and FAQ
- `/components/learn/FaqAccordion.tsx` — accordion component for FAQ section
- `/components/layout/TabStrip.tsx` — Calculator / Learn tab navigation strip
