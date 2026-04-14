# Tribune

Connecticut security deposit recovery service. Helps tenants recover wrongfully withheld deposits using CT § 47a-21 on a 25% contingency. No attorney is in the loop — the product must stay on the correct side of legal information and document preparation, not practicing law.

**See PRODUCT_BRIEF.md, SPEC.md, ARCHITECTURE.md, TASKS.md for detail. Do not duplicate that content here.**

## Stack
- Next.js 14 (App Router), TypeScript
- Supabase (Postgres + Auth + RLS)
- Tailwind v3 + shadcn/ui (Radix primitives, **not** `@base-ui/react`)
- react-hook-form + zod, date-fns, sonner

## Commands
- `npm run dev` — dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint

## Coding Conventions

- **Money as integer cents.** Never floats. `deposit_amount_cents`, `amount_withheld_cents`, etc.
- **Dates as ISO strings** at the boundary, Postgres `date` in storage, `date-fns` for manipulation.
- **snake_case on the data layer** — DB columns, Zod schemas, form field names. Do not introduce camelCase shims at the boundary.
- **All client components.** Data access is direct from client to Supabase using `@/lib/supabase/client`. Do not introduce server components, server actions, API routes, or a repository layer without explicit discussion.
- **RLS is the authorization boundary.** Middleware is convenience only. Never write code that assumes middleware alone has enforced access.
- **shadcn components via Radix.** CSS variables in HSL (Tailwind v3). Do not migrate to `@base-ui/react`.

## Product Constraints (currently hardcoded, treat as business rules)

- Contingency fee: 25%.
- Statutory deadline: `move_out_date + 30 days`.
- Letter sequence: 1, 2, 3.
- Jurisdiction: Connecticut only.

If any of these change, it's a business decision — update deliberately, do not refactor them away without being asked.

## Legal Stakes

The product drafts legal correspondence. **Citations, deadlines, and damages calculations have legal consequences.** When editing letter templates, statute references, or legal math:
- Draft structure is fine; leave exact statute citations and damages numbers for explicit human verification.
- Do not invent CT case law or subsection numbers from training data.
- Flag any ambiguity rather than guessing.

## Before Acting — Ask First

- Any schema migration (new tables, new columns, RLS changes).
- Adding or removing npm dependencies.
- Integrating a new external service (email, payments, file storage, cron).
- Changing auth or RLS behavior.
- Editing letter templates, statute citations, or damages calculations.
- Reshaping the intake → auth callback flow.

## PII & Security

- Database contains tenant and landlord PII (names, addresses, phones, emails, forwarding addresses).
- Never log PII. Never send PII to third-party analytics. Never transmit to external services without explicit review.

## After Edits

- Run `npm run lint`.
- Run `npm run build` if types, config, or tsconfig paths changed.
- If UI changed, verify in the browser preview — golden path and at least one edge case.

## Known Footguns

- The intake flow carries form data across the magic-link redirect via `sessionStorage["tribune_pending_case"]`. Case creation happens in `/auth/callback`, not at intake submit. Do not "fix" this by moving creation back to submit without planning the server-side replacement (see TASKS.md).
- `current_letter_number` is written inconsistently in `admin/case/[id]/page.tsx`. Known bug — fix as a unit, not as a drive-by.
- Hand-written types in `src/lib/types/database.ts` can drift from the schema. Treat the schema as authoritative.
