# Journal

Newest first. One entry per tick. Counts only — no names, emails, addresses, or
per-case amounts.

## 2026-10-30 — manual — founder decisions recorded; letters fixed; loop live
- Did: recorded Magnus's decisions (no attorney, $0 budget, revenue first) across
  PLAN, CHARTER, SETUP, BACKLOG, and ESCALATIONS. Merged Phase 0 (#2). Fixed the
  three letter defects plus a prior-letter date bug (#4, 70/70 tests). Created the
  build routine (3×/day) and the review routine (Mondays) with connectors stripped.
- Learned: the permission classifier allowed merging #2 but refused #3 ("merge
  without review"), so self-merge isn't reliable. Added the "open PRs are claimed
  work" rule to LOOP.md and to the routine prompts so ticks don't duplicate work.
  Routines auto-attach Gmail, Calendar, and Docs even when created with an empty
  connector list. Cleared them afterwards.
- Next: Magnus merges #3 and #4, does SETUP Part A, and answers E-004. Build ticks
  start with the summer-cohort page; approve-and-send waits on E-004.

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
