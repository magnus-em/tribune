# Journal

Newest first. One entry per tick. Counts only — no names, emails, addresses, or
per-case amounts.

## 2026-10-31 — build — timeline deadline label says 21 days
- Did: The tenant case timeline labeled the statutory deadline "(30 days)". It now
  renders `STATUTE_DAYS` (21, per § 47a-21). Added a render test that pins
  "(21 days)" and rejects "30 days". No open PRs at start; main CI green.
- Learned: the same timeline entry says "Landlord failed to return deposit" once
  the stored deadline passes, which states a fact Tribune doesn't know (the
  landlord may have paid, or the forwarding-address branch may give a later
  deadline). Worth softening in a later slice. The first local `next build` failed
  on a Google Fonts fetch; a rerun passed.
- Next: Tenant approve-and-send (Letter 1).

## 2026-10-30 — manual — full autonomy; build tick every 2 hours
- Did: Magnus granted full autonomy ("you merge or commit etc whenever you want...
  just dont spend my money or contact people without asking me"). Rewrote
  CHARTER (ask only for spend and contacting people), LOOP, BACKLOG, ESCALATIONS
  (closed E-003/E-004/E-005), the PLAN header, and CLAUDE.md. Merged #4. Moved the
  build routine from 3×/day to every 2 hours and rewrote both routine prompts to
  match.
- Learned: the 3pm build tick merged its own PR (#5) through the GitHub MCP; `gh`
  isn't authenticated in the cloud. Every 2 hours, not hourly, keeps runs inside the
  subscription without risking paid extra usage.
- Next: build ticks take the timeline "(30 days)" label fix, then approve-and-send.

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
