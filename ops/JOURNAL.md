# Journal

Newest first. One entry per tick. Counts only — no names, emails, addresses, or
per-case amounts.

## 2026-10-30 — build — triage function, display only (🟢 PR)
- Did: Added a pure `triageCase()` in `src/lib/triage.ts` returning
  `accept | decline | review` with per-check reasons (CT, residential, moved out,
  landlord email, amount withheld, stored deadline passed, lease on file), 31
  tests, and a Triage panel on the admin case page. Nothing acts on the verdict.
  Picked from open PR #3's backlog: approve-and-send (its #1) needs triage `accept`,
  so this is its first slice. PRs #3 and #4 were open and left alone.
- Learned: intake doesn't record residential vs. commercial, so that check is
  informational. No minimum withheld amount exists, so `> 0` passes. The triage
  doesn't compute deadlines; it compares the stored `statutory_deadline`, which
  ignores the forwarding-address branch. The tenant timeline labels the deadline
  "(30 days)" while the statute says 21; that's in BACKLOG as 🔴. `gh` isn't
  authenticated in the cloud env (the GitHub MCP works), and the classifier
  blocked deleting a stray `loop/test-push` branch I created to test push access.
- Next: once #3 merges, approve-and-send (🔴, waits on E-004) or the
  summer-cohort page (🟢).

## 2026-10-28 — manual (Phase 0 kickoff) — plan approved, foundation laid
- Did: Magnus approved PLAN.md and the charter. Rewrote the stale letter and intake
  tests (21 failing → 64 passing) so they guard the legal invariants: 2× full
  deposit, exact deadline dates, no attorney framing, payment to the tenant.
  Added GitHub Actions CI (it builds with placeholder env, verified locally with
  no `.env.local`). Replaced the "within a few hours" SLA with a `REVIEW_SLA`
  constant ("within two business days") in 6 places, and fixed one "We're
  reviewing" voice slip. Wrote CHARTER, LOOP, BACKLOG, ESCALATIONS, SETUP, the
  legal packet, metrics SQL, and the read-only role SQL.
- Learned: prod (usetribune.org) serves the June 11 code. `reply.usetribune.org`
  MX already points at Resend inbound, so the TASKS.md note about root-domain
  replies was stale. Prod DB reads are blocked by the permission classifier
  without a standing rule, so real usage is still unknown. The SLA copy change
  wasn't browser-verified: the authenticated pages need a test login, and with no
  staging that would mean writing to the prod DB. Found three letter defects (E-003).
- Next: the build tick takes BACKLOG "Now" #1 (doc drift). Everything needing
  access waits on E-001.
