# Backlog

The build tick takes the top unblocked item in **Now**. Tiers follow
`ops/CHARTER.md`. `blocked:` means don't start it; the reason says what unblocks it.
Keep items PR-sized. Split anything bigger before starting.

**Priority since 2026-10-30: the first paid recovery.** Zero cash. No attorney.
Anything that doesn't move a real case toward a paid invoice waits.

## Now

1. 🔴 **Tenant approve-and-send (Letter 1)** — the feature that removes Magnus from
   each case. Spec below. 🔴 because it needs a narrowly scoped service-role write;
   becomes 🟡 if E-004 is approved.
2. 🟢 **Summer-cohort page + outreach drafts** — `/moved-out` landing page: "Moved
   out this summer and never got your deposit back?" Restates only verified
   § 47a-21 text, carries the disclaimer, CTA to intake. Plus
   `ops/outreach/posts.md`: 3 ready-to-paste posts (Yale grad lists, r/newhaven,
   New Haven housing groups) with each venue's self-promotion rules noted.
3. 🟢 **Triage function** — pure `triageCase(case)` in `src/lib/triage.ts` →
   `accept | decline | review` with reasons (CT, residential, moved out, landlord
   email present, amount ≥ minimum, deadline status). Exhaustive tests. Admin
   display only at first; approve-and-send uses it to decide when Letter 1 is offered.
4. 🟢 **Admin exception queue** — read-only `/admin` view: new intakes, landlord
   replies with no follow-up, cases within 3 days of a deadline, overdue invoices.
5. 🟢 **SEO foundation** — `sitemap.ts`, `robots.ts`, per-page metadata, Open Graph,
   `LegalService`/`FAQPage` structured data. No new deps.
6. 🟢 **CT deposit law guide** — `/guides/connecticut-security-deposit-law`,
   restating only verified statute text, with sources and the disclaimer.

## Spec — tenant approve-and-send

- **Where:** the tenant case page. When Letter N is due, show the letter
  generated server-side from the template and the case data, a required checkbox
  ("I've read this letter, it's accurate, and I authorize Tribune to send it to
  my landlord in my name"), and an **Approve & send** button.
- **When due:** Letter 1 once intake is complete, the lease is uploaded, and triage
  says `accept`. Letters 2 and 3 come later via the follow-up cron (Next).
- **Server action `approveAndSendLetter(caseId, letterNumber)`:**
  1. Under the tenant's session: load the case (RLS proves ownership). Check the
     status allows it, `letterNumber === current_letter_number + 1`, a landlord
     email exists, `DISPATCH_PAUSED` isn't `true`, and there's been no dispatch on
     this case in the last 5 days.
  2. Regenerate the letter server-side. Never accept letter text from the client.
  3. Scoped privileged write (service-role client, used only in this function):
     insert the `tribune_letter` message, send it through the existing
     landlord-letter wrapper and reply-to, record the dispatch metadata, set status
     `awaiting_landlord`, increment `current_letter_number`, add a `case_actions`
     audit row noting tenant approval and time, and add a tenant-visible system
     message ("You approved Letter N; Tribune sent it").
  4. Send an FYI email to `ADMIN_EMAIL`.
- **No migration.** Approval is recorded in `case_actions` and `case_messages`.
- **Kill switch:** the `DISPATCH_PAUSED` env var stops every automated dispatch.
- **Tests:** eligibility rules, the server-side regeneration (client text
  ignored), the kill switch, the rate limit.

## Next

- 🟡 Follow-up cron (Vercel Cron, free tier): after 10 business days with no reply
  and no recovery, offer the tenant Letter 2; after 7 more, Letter 3. Also
  deadline-risk nudges.
- 🟡 Landlord-reply handling on the tenant page: show the reply and the next-step
  options (report recovery, send the next letter).
- 🟢 Unit tests for email templates (disclaimer present, Tribune voice, no PII leaks).
- 🟢 Doc drift: ARCHITECTURE.md and SPEC.md vs. the code.
- 🟢 More guide pages, then city pages (only verified statute text).
- 🔴 Deadline calculator tool (deadline math).
- 🟢 Migrate `next lint` → ESLint CLI.
- 🟢 Weekly metrics — blocked: read-only role (SETUP Part B).
- 🟡 Staging + Playwright E2E — blocked: staging project (SETUP Part B).

## Later

- 🟡 Referral program (roommates share a landlord)
- 🟡 "Remind me" pre-move-out capture — blocked: staging (needs a table)
- 🔴 Capture the forwarding-address date and correct the deadline math
- 🔴 Stripe payment links (free to start; per-transaction fees only) — after
  Venmo/Zelle proves to be a real problem
- Recovery verification; small-claims packet; landlord memory; LLM reply classification

## Done

- 2026-10-30 — Re-planned around founder decisions (no attorney, $0, revenue first).
- 2026-10-28 — Plan + charter approved; stale tests rewritten around legal
  invariants; CI added; SLA copy made deliverable; ops/ files; setup checklist.
