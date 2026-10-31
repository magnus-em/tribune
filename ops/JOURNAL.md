# Journal

Newest first. One entry per tick. Counts only — no names, emails, addresses, or
per-case amounts.

## 2026-10-31 — build — admin exception queue (read-only)
- Did: Added `buildExceptionQueue()` (`src/lib/exceptions.ts`, 25 tests) and an
  "Exception queue" panel at the top of `/admin` with four buckets: new intakes,
  landlord replies with no follow-up, stored statutory deadline within 3 days,
  overdue invoices. Two extra client reads under admin RLS (message types/times,
  unsettled invoices). Nothing writes or sends. No open PRs at start; main CI
  green; prod returned 200.
- Learned: "follow-up" is a later `tribune_letter` or `tribune_update`; tenant
  and system messages don't clear a landlord reply. Invoices aren't in the
  generated Supabase types (the client is untyped, so it compiles). The deadline
  bucket inherits the stored-deadline caveat (forwarding-address date not
  captured). Not browser-verified: `/admin` needs an admin login and there's no
  staging.
- Next: SEO foundation, then the CT deposit law guide.

## 2026-10-31 — build — summer-cohort page and outreach drafts
- Did: Added a public `/moved-out` page ("Moved out this summer and never got your
  deposit back?"). It quotes the two verified § 47a-21(d) passages word for word
  from a new `src/lib/statute.ts`, lists what to gather, explains approve-and-send
  and the 15% fee, and carries the disclaimer under the hero and in the footer.
  Every CTA goes to `/login?next=/dashboard/new-case`. 8 tests: the quotes match
  LEGAL_REVIEW_47a-21.md, no "30 days", the disclaimer, the CTA targets, no
  we/us/our, approval before sending. Wrote `ops/outreach/posts.md` with 3
  drafts and the venue rules to check first. No open PRs at start; main CI
  green; prod up.
- Learned: the page is public, so it was checked in a local browser (prod build,
  1280px and 390px, no horizontal scroll). The landing CSS reset strips list
  numbers, so ordered lists need `listStyle: "decimal"`. Nothing links to
  `/moved-out` from the landing page yet; the posts are its only traffic source,
  and SEO (sitemap, metadata) is BACKLOG Now #2. The venue rules in the drafts
  are things to check, not verified copies; the agent can't read logged-in pages.
- Next: the admin exception queue. Magnus: SETUP Part A, then post the drafts.

## 2026-10-31 — build — approve-and-send, tenant UI (slice 2 of 2)
- Did: The tenant case page now asks the server for Letter 1 while the case is in
  setup. If it's ready, it shows the exact server-generated letter, the required
  `APPROVAL_STATEMENT` checkbox, and **Approve & send** (`approveAndSendLetter`).
  If the landlord email or forwarding address is missing, the tenant adds it in
  place through a new `updateLetterContactDetail` action (session client, only
  before Letter 1, audit row without the value). A missing lease routes to the
  upload. Review-banner, headline, and `STATUS_DESCRIPTIONS` copy now say nothing
  is sent without the tenant's approval. Pure `approvalPanelState()` and
  `parseContactDetail()` with tests, plus a render test for the step (button stays
  disabled until the box is ticked). Letter text and citations are unchanged.
- Learned: not browser-verified: the page needs a real login and there's no
  staging, so a jsdom render test stands in. The tenant UPDATE policy on `cases`
  covers every column, so a tenant could edit status or amounts directly. The
  letter still only goes out on their own approval, but it's in BACKLOG "Next".
  The intro step and recovery step still say "us"/"we" (BACKLOG "Next").
  The end-to-end path is now live in code: a real Letter 1 can go out once
  SETUP Part A (email sending) is done.
- Next: the summer-cohort page and outreach drafts.

## 2026-10-31 — build — approve-and-send, server side (slice 1 of 2)
- Did: Split approve-and-send into server side + tenant UI and shipped the server
  side. `prepareLetterDispatch()` is pure: kill switch (`DISPATCH_PAUSED`), Letter 1
  only, next-in-sequence, status `intake_submitted`/`under_review`, landlord email,
  forwarding address, triage `accept`, no dispatch in 5 days, then the letter text
  regenerated from the case row. `approveAndSendLetter(caseId, letterNumber)` takes
  no letter text, checks ownership under the tenant session, then uses the service
  role only for the writes: a conditional update on `current_letter_number` as a
  lock against double sends, the letter message, the send, dispatch metadata, status
  `awaiting_landlord`, a `letter_dispatched` audit row with the tenant's approval
  and time, a tenant-visible timeline entry, a tenant confirmation, and an FYI to
  `ADMIN_EMAIL` with the case id only. A failed or skipped send rolls back the lock
  and the letter row. The admin page now builds LetterData through the same helper.
  No open PRs at start; main CI green; prod up.
- Learned: Letter 1 tells the landlord to send payment to the forwarding address, so
  the send now requires one (the admin flow would have rendered a blank). The
  `action_type` enum has no "approved" value, so approval lives in the
  `letter_dispatched` metadata (no migration, per spec). Letters 2/3 are blocked
  until the follow-up schedule exists. `sendEmail` reports success when Resend
  isn't configured; the new action treats that as not sent. Prod needs
  `SUPABASE_SERVICE_ROLE_KEY` in Vercel (SETUP Part A already asks for it).
- Next: slice 2, the tenant UI (BACKLOG Now #1).

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
