# Tribune

Connecticut security deposit recovery service. Helps residential tenants recover wrongfully withheld deposits using CT § 47a-21 on a 15% contingency. No attorney is in the loop — the product is a legal-information and document-preparation service, not a law firm. Tenants sign all correspondence (pro se); Tribune prepares and mails on their behalf.

**See PRODUCT_BRIEF.md, SPEC.md, ARCHITECTURE.md, TASKS.md for detail. Do not duplicate that content here.**

## Stack
- Next.js 15 (App Router), React 19, TypeScript
- Supabase (Postgres + Auth + RLS + Storage)
- Tailwind v3 + shadcn/ui (Radix UI primitives)
- react-hook-form + zod, date-fns, sonner
- @tanstack/react-table for admin DataTable
- Sentry (error tracking), PostHog (analytics), Resend (email + inbound webhook)

## Commands
- `npm run dev` — dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint

## Coding Conventions

- **Money as integer cents.** Never floats. `deposit_amount_cents`, `amount_withheld_cents`, etc.
- **Dates as ISO strings** at the boundary, Postgres `date` in storage, `date-fns` for manipulation.
- **snake_case on the data layer** — DB columns, Zod schemas, form field names. Do not introduce camelCase shims at the boundary.
- **Client reads, server-action writes.** Reads go direct from client components to Supabase via `@/lib/supabase/client`. Writes that need server-side integrity (intake submission, file uploads, letter post, case resolution, any write that produces an audit entry) use Next.js server actions. Do not introduce API routes, a repository layer, or server components for reads without explicit discussion.
- **RLS is the authorization boundary.** Middleware is convenience only. Never write code that assumes middleware alone has enforced access. Server actions must still run under the user's session — do not use the service role key to bypass RLS except in clearly scoped, reviewed admin jobs.
- **shadcn components via Radix.** CSS variables in HSL (Tailwind v3). Do not migrate to `@base-ui/react`.
- **No PII in logs or analytics.** Sentry and PostHog must scrub names, emails, phone numbers, addresses, and deposit amounts. Anonymized user ids and event names only. Centralize scrubbing in the analytics wrapper.
- **"Information, not legal advice."** Every tenant-facing page and outbound email carries a visible disclaimer. Tenant-facing copy describes statutory rights and procedures; it does not advise on which action to take in a specific case.

## Product Constraints (currently hardcoded, treat as business rules)

- Contingency fee: 15% of amount recovered.
- Tenant covers hard costs at cost: certified mailing, court filing fees if the case escalates. Tribune does not mark these up.
- Settlement money never flows through Tribune. Landlord pays the tenant directly; the tenant owes Tribune the 15% afterward. If the tenant does not pay, the debt enters collections.
- Statutory deadline: `move_out_date + 21 days` (CT § 47a-21; 15 days after forwarding address received if later).
- Letter sequence: 1, 2, 3.
- Jurisdiction: Connecticut only (New Haven focus initially). Residential tenants only.

If any of these change, it's a business decision — update deliberately, do not refactor them away without being asked. Historical cases keep the rate stored on their row; do not rewrite existing case records when the default changes.

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

- Intake is at `/dashboard/new-case` (authenticated). The old `/intake` route and `pending_cases` pipeline are removed. Do not recreate them.
- `current_letter_number` incremented only when a letter is posted; status changes never touch it.
- Hand-written types in `src/lib/types/database.ts` will be replaced by `supabase gen types typescript` output. Treat the schema as authoritative.
- shadcn components were installed from v4 (uses `@base-ui/react`). Some Tailwind v4 syntax (`w-(--var)`, `rounded-[min(...)]`) had to be converted to v3 equivalents (`w-[var(--var)]`, `rounded-lg`). Check for this if installing new shadcn components.
- Sentry DSN is hardcoded in config files (not env var) — this is intentional per the Sentry wizard setup. Auth token is in Vercel env vars for source map uploads.
