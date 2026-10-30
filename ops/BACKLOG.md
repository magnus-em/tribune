# Backlog

The build tick takes the top unblocked item in **Now**. Tiers follow
`ops/CHARTER.md`. `blocked:` means don't start it; the reason says what unblocks it.
Keep items PR-sized. Split anything bigger before starting.

## Now

1. 🟢 **Doc drift** — ARCHITECTURE.md and SPEC.md: reconcile with the code (reply-to
   subdomain, agent framing, `declined` status, statuses in use). Label anything
   uncertain `[uncertain]`.
2. 🟢 **Admin exception queue** — a `/admin` view listing what needs a decision: new
   intakes, landlord replies with no follow-up, cases within 3 days of the
   deadline, overdue invoices. Read-only. This becomes the ops tick's worklist.
3. 🟢 **SEO foundation** — `sitemap.ts`, `robots.ts`, per-page metadata, Open Graph,
   and `LegalService`/`FAQPage` structured data on the landing page. No new deps.
4. 🟢 **CT deposit law guide page** — `/guides/connecticut-security-deposit-law`.
   Restates only the verified statute text in LEGAL_REVIEW_47a-21.md, cites
   sources, carries the disclaimer, and links to intake.
5. 🔴 **Deadline calculator** — public tool at `/tools/deposit-deadline`. Implements
   the 21-day / 15-days-after-forwarding-address rule. Build it, open the PR, and
   escalate; it involves deadline math.
6. 🟢 **Migrate `next lint` → ESLint CLI** (deprecated in Next 16).

## Next

- 🟢 More guide pages: "landlord didn't return deposit CT", "how long does a CT
  landlord have", deduction topics (normal wear and tear, cleaning, painting,
  carpet), then city pages. Each one only restates verified text.
- 🟢 Unit tests for email templates (disclaimer present, Tribune voice, no PII leakage).
- 🟢 Weekly metrics via `ops/sql/metrics.sql` — blocked: read-only role (SETUP §4).
- 🟡 Staging: apply migrations, seed script, wire Vercel preview to staging —
  blocked: staging project (SETUP §4).
- 🟡 Playwright E2E golden path against preview — blocked: staging.
- 🟡 Verify the inbound webhook end to end on staging, then prod — blocked: staging + SETUP §5.
- 🔴 Fix the letter defects in ESCALATIONS E-003 — blocked: Magnus/attorney.
- 🔴 Tenant case timeline labels the statutory deadline "(30 days)"
  (`src/components/case-timeline.tsx`); the statute and `STATUTE_DAYS` say 21.
  Deadline copy, so it needs Magnus's yes.
- 🟢 Triage follow-ups: a per-case residential field at intake (🟡, tenant flow),
  and a minimum withheld amount if Magnus wants one (business decision).

## Later — Phase 1 (system as operator; mostly blocked on staging)

- 🟡 Tenant letter approval + e-approval flow (new status, migration)
- 🟡 Auto-dispatch on approval + global dispatch kill switch
- 🟡 Follow-up/deadline cron (Vercel Cron)
- 🟡 Auto-triage acting on its verdict (accept → next step; decline → resources)
- 🔴 Capture the forwarding-address date and correct the deadline math

## Later — Phase 2+ (see PLAN.md §5)

- 🟡 "Remind me" pre-move-out capture (table + cron + reminder email)
- 🟡 Referral program
- 🔴 Stripe payment links; recovery verification; small-claims packet; certified mail
- Landlord entity + memory; LLM-assisted reply classification; outcome analytics

## Done

- 2026-10-30 — Triage function: `triageCase()` in `src/lib/triage.ts` with 31 tests,
  verdict shown on the admin case page (display only).

- 2026-10-28 — Plan + charter approved; stale tests rewritten around legal
  invariants; CI added; SLA copy made deliverable; ops/ files; legal packet; setup checklist.
