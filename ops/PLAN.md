# Tribune — Autonomous Operating Plan

**Status:** approved by Magnus 2026-10-28 (plan + delegation charter).
**Revised 2026-10-30:** founder decisions: no attorney, zero cash, revenue first (§0, §4.1).
**Purpose:** run Tribune — launch, acquisition, operations, engineering — with an
autonomous agent loop. Magnus gives high-level guidance every few days.
This file is the agent's north star. Every loop tick reads it first.

---

## 0. TL;DR

- **Core principle: the agent improves the system, and the system runs the cases.**
  Nothing time-sensitive (deadlines, landlord replies, tenant notifications)
  may depend on an agent loop being awake. Cases run on product code, crons
  and the tenant's own approvals. The agent builds and tunes that machinery,
  works the exception queue, and handles growth.
- **The tenant, not Magnus, approves every outbound letter.** That one design
  change takes Magnus out of the per-case loop *and* strengthens the pro-se/UPL
  posture (the tenant authorizes each step).
- **Founder decisions (2026-10-30): no attorney, zero cash, revenue first.**
  Magnus won't book CT counsel and there's no budget for paid services or paid
  acquisition until fees come in. He accepts the open legal questions
  (contingency fee, UPL) as a business risk. The agent's job is to get the first
  paid recovery as fast as possible with free tools only, and to keep every
  free mitigation in place (§4.1).
- **What Magnus does:** a ~20-minute minimum setup (prod email env vars, admin
  flag), one-time posts in his own network that the agent drafts, and at most 3
  decisions per weekly digest.
- **Timing:** don't wait for summer. The intake accepts move-outs from the past
  12 months, so the whole summer-2026 move-out wave (May–Sep, heavy with students)
  is still eligible. Many of those tenants never got their deposits back. They are
  the first-revenue target now. SEO keeps compounding toward summer 2027.

---

## 1. Where things stand (verified 2026-10-28)

| Area | State |
|---|---|
| Prod | Live at usetribune.org, serving the June 11 code (landing copy matches `main`). |
| Inbound email | `reply.usetribune.org` MX → Resend inbound (AWS SES). Root MX → Cloudflare Email Routing. Code uses `case+{id}@reply.usetribune.org`. **Unverified:** Resend webhook is configured and `RESEND_WEBHOOK_SECRET` is in Vercel. |
| Prod env vars | **Unknown.** Vercel CLI token expired. |
| Real usage | **Unknown.** Test data was wiped 2026-06-03; the agent's prod-read was blocked by permissions today. |
| Code health | Lint clean. **21/49 tests fail** (tests predate the June legal rewrite + schema rename). No CI. No E2E. No staging environment. |
| Docs | Drifted: PRODUCT_BRIEF still describes "our client" letter voice (superseded by agent/pro-se framing); TASKS.md describes the old root-domain reply plan. |
| Legal | LEGAL_REVIEW + UPL_POSTURE written. No attorney review, by founder decision (2026-10-30). |
| Copy vs. reality | The case-submitted banner promises a response "within a few hours" — not deliverable by a daily loop. Must change before launch. |

---

## 2. Goals and how we'll know

**North star:** dollars recovered for tenants per month.

| Milestone | Definition | Proves |
|---|---|---|
| M0 — Ready | Prod email verified, tenant approve-and-send shipped | We can run a case without Magnus |
| M1 — First recovery | One real case recovered end to end, fee invoiced | The loop works |
| M2 — 10 recoveries | 10 recovered, unit economics measured | Repeatability; real numbers replace assumptions below |
| M3 — Autonomy | 50 cases/quarter with < 1 hr/week Magnus time | The experiment worked |

**Funnel metrics** (computed weekly from the DB, no PII): visitors → intake
started → submitted → accepted → letter 1 approved → landlord responded →
recovered → fee paid. Plus time-to-recovery and recovery rate.

**Autonomy metrics** (the experiment itself): Magnus minutes/week, escalations
raised vs. answered, PRs merged, reverts/regressions, cases that needed any
human touch.

**Economics — assumptions to replace with real data at M2:** if a typical
withheld amount is ~$500–1,500, 15% is ~$75–225 per case. That only works as
a business if marginal operating cost per case is near zero — which is exactly
what this plan builds — and volume is in the hundreds per year. Double-damages
cases are larger. Treat these numbers as `[uncertain]`.

---

## 3. Hard limits — what the agent can't do, and the route around each

| Can't | Why | Route around |
|---|---|---|
| Give a legal opinion | Not a lawyer | Risk accepted by Magnus (§4.1); free mitigations only. Open questions parked in `ops/legal-packet.md` |
| Create accounts, enter credentials/API keys, accept ToS | Safety rules | Magnus's one-time setup session (§7) |
| Spend money | Safety rules | Magnus sets budgets/cards; the agent operates within caps through provisioned APIs |
| Post publicly / DM / cold-email under Magnus's identity | Each public post needs explicit approval | Prefer channels Tribune owns (site, SEO, free tools, product emails). Outreach drafts go to a queue Magnus sends in batches |
| Send legal correspondence to real people on its own judgment | High stakes; needs a human authorizer | Tenant approves every outbound letter in-app; letters come from fixed, test-guarded templates, not freeform agent prose |
| Be always on | Loops run when compute is available | Time-sensitive ops live in product code + crons, not in the loop |
| Read prod data without standing permission | Permission classifier blocked it today | Least-privilege read-only DB role + an explicit permission rule (§7) |

---

## 4. Strategy

### 4.1 Legal — decided 2026-10-30: no attorney for now

Magnus decided not to get attorney review until revenue allows it. The open
questions (the 15% contingency for a non-lawyer service; document preparation
vs. UPL; the damages base) are documented in `ops/legal-packet.md` (parked) and
accepted as a business risk. The agent does not re-raise them. It keeps the free
mitigations in place:
- **The tenant approves every letter** before it goes out, and every letter is
  signed in the tenant's own name (pro se).
- **Letters are deterministic and factually accurate.** They come from fixed
  templates, use only facts the tenant reported, and are guarded by tests. No
  freeform agent prose goes to landlords.
- **Information, not advice.** Disclaimers stay everywhere. Tribune never tells
  a tenant what to do in their specific case.
- Revisit when fees come in: a paid consult is the first thing revenue should buy.

### 4.2 Launch shape — first paid cases now

- Open to real cases now, New Haven first. Price is 15%, as in the service
  agreement (a business rule in CLAUDE.md).
- Until the tenant approve-and-send flow ships, any real case runs through the
  existing admin tools (generate from template → send). That's about 5 minutes of
  Magnus's time per letter, batched every couple of days, which is within the
  two-business-day SLA. Once the flow ships, that time goes to zero.
- Fees are collected by Venmo/Zelle, which already works and costs nothing.
- Before the first invoice: the collections clause must be literally true.
  Small-claims action on an unpaid invoice is free to threaten and cheap to file,
  so the copy stays, but no agency or credit reporting until revenue funds it.

### 4.3 Finding users — channels ranked by (autonomy × yield)

0. **The summer-2026 cohort, now.** A "Moved out this summer and never got your
   deposit back?" page, plus ready-to-paste posts for Yale and New Haven groups
   (grad-student lists, r/newhaven, housing groups). The agent writes everything;
   Magnus posts once. This is the fastest free path to the first paid case.
1. **SEO + free tools on usetribune.org** — fully autonomous, compounds, ready by summer.
   - Pages: CT deposit law explainer; "landlord didn't return my deposit in CT";
     "how long does a CT landlord have"; city pages (New Haven, Hartford,
     Bridgeport, Stamford, Waterbury, New London…); deduction pages (normal wear
     and tear, cleaning, painting, carpet).
   - Tools: deadline calculator (21 days / 15 days after forwarding address);
     a "did my landlord comply?" checklist. These are information, not advice.
     Every statute claim is quoted from the verified statute text, cites its
     source, and carries the disclaimer.
   - **"Remind me" capture for tenants who haven't moved out yet:** enter the
     move-out date; Tribune emails on day 22 if the deposit hasn't come back.
     Turns early searchers into cases exactly when the claim ripens. Autonomous
     once built.
2. **Magnus's network: Yale and New Haven renters** — highest early yield, needs
   ~1 hr of Magnus's time near move-out season. The agent drafts the posts and
   newsletter blurbs; Magnus sends them.
3. **Referral partners** — legal aid (they turn away many small cases), the CT
   Fair Housing Center, tenant unions, university off-campus housing offices,
   211 CT. The agent drafts outreach; Magnus sends in batches.
4. **In-product referral** — recovered tenants refer roommates and friends.
   Roommates on one lease share a landlord. Autonomous once built.
5. **Paid search** — parked: zero cash. Revisit once fees cover a small, capped budget.
6. **Community posting** (Reddit, Facebook groups) — low autonomy, strict
   self-promo rules. Helpful answers only, posted by Magnus occasionally. Lowest
   priority.

### 4.4 Making it work — the system is the operator

| Stage | Today | Target |
|---|---|---|
| Intake | Magnus reviews | **Auto-triage**: rules (CT, residential, moved out, landlord contact, amount ≥ minimum, deadline status) → accept / decline with resources / flag for the exception queue. Instant response replaces "within a few hours". |
| Evidence | Manual | Readiness checklist + automated tenant nudges for missing docs |
| Letter 1 | Magnus drafts, sends | Generated from the approved template + case facts → **tenant reviews and e-approves** → system dispatches |
| Waiting | Nothing | **Cron**: follow-ups at set days; after N days of silence, propose Letter 2 to the tenant; at-risk alerts |
| Landlord reply | Lands in Gmail, logged by hand | Inbound webhook auto-logs → reply goes to the exception queue → the agent drafts next-step options → tenant chooses. Tenant-facing SLA: "Tribune responds within 2 business days." |
| Escalation | Not built | Small-claims packet prefilled from case data; the tenant files pro se. Use the official court forms only; never invent form numbers. |
| Recovery | Tenant reports | Tenant or landlord reports → **verification** (landlord confirmation link) → invoice |
| Payment | Venmo/Zelle | Stripe payment link + automated reminders → collections policy |

Safety rails built into the product: a global **dispatch kill switch**,
rate limits on outbound landlord email, a recorded tenant approval for every
outbound letter, and an audit log entry for every automated action.

### 4.5 Compounding — the strategic thesis, made concrete

- **Landlord memory:** a landlord entity (normalized name, email, address) with
  response history, time-to-pay and outcomes. It drives letter choice and
  expected timelines.
- **Outcome data:** which letter, timing and evidence package gets paid fastest
  → template and timing experiments (legal-reviewed variants only).
- **Structured deductions:** a taxonomy of deduction types and how landlords
  justify them.

---

## 5. What needs to be built (backlog, in order)

The full live backlog moves to `ops/BACKLOG.md` in Phase 0. Items marked 🔴 need
Magnus's explicit yes under the charter (§6.4).

**Phase 0 — Autonomy foundation (needs §7 setup)**
- [ ] Fix the stale tests; add GitHub Actions CI (lint, typecheck, unit, build)
- [ ] Staging: a second Supabase project + Vercel preview env + a seed script. The agent never tests on prod data.
- [ ] Playwright E2E golden path (tenant intake → admin → dispatch) against preview (🟡 new dev dependency; needs staging)
- [ ] `ops/` operating files: CHARTER, BACKLOG, JOURNAL, ESCALATIONS, METRICS
- [ ] Metrics script: weekly funnel counts from the DB (no PII) → METRICS.md
- [ ] Doc-drift cleanup (PRODUCT_BRIEF UPL/voice section, TASKS reply-to)
- [ ] Replace the "within a few hours" SLA copy
- [x] `ops/legal-packet.md` (parked 2026-10-30: no attorney)

**Phase 1 — System as operator (before the first real case)**
- [ ] Auto-triage on intake
- [ ] Tenant letter approval + e-approval flow (new status) 🔴 (migration, letter flow)
- [ ] Auto-dispatch on approval + dispatch kill switch
- [ ] Follow-up/deadline cron (Vercel Cron) 🔴 (new scheduled job)
- [ ] Verify inbound webhook end to end on staging; then prod
- [ ] Exception queue in admin (everything the system can't decide)
- [ ] Capture the forwarding-address date → correct deadline math 🔴 (legal math, migration)

**Phase 2 — Growth surface (in parallel with the legal wait)**
- [ ] SEO content system + sitemap/metadata/structured data
- [ ] Deadline calculator + compliance checklist tools
- [ ] "Remind me" pre-move-out capture
- [ ] Referral program

**Phase 3 — Money and escalation**
- [ ] Stripe payment links on invoices 🔴 (new service)
- [ ] Recovery verification (landlord confirmation)
- [ ] Small-claims packet generator 🔴 (legal forms)
- [ ] Certified mail (Lob or similar) for landlords without email 🔴 (new service, spend)

**Phase 4 — Compounding**
- [ ] Landlord entity + memory
- [ ] LLM-assisted reply classification and draft responses, tenant-approved 🔴 (new service)
- [ ] Outcome analytics → experiments

---

## 6. The autonomous loop

### 6.1 Principles
- Each tick starts cold. Everything the agent knows lives in the repo (`ops/`),
  not in chat.
- One backlog item per tick, one PR per item. Small blast radius.
- Every change goes through a PR with green CI. Self-merge only within the charter.
- Revert first, debug second, if `main` or prod breaks.
- Decisions that wait on Magnus come with a stated default and a deadline, so
  the loop never blocks on a non-🔴 item.

### 6.2 Three loops

| Loop | Cadence | Runs where | Does |
|---|---|---|---|
| **Ops tick** | Daily | Cloud routine with ops secrets (or a local scheduled task as a fallback) | Health check (prod up, Sentry new issues, CI on main) → exception queue (flagged intakes, landlord replies, failed dispatches) → act within charter → log escalations |
| **Build tick** | Whenever compute is available (2–4×/day) | Cloud routine on the GitHub repo | Top unblocked BACKLOG item → branch → implement → lint/types/unit/E2E on preview → PR → merge per charter → JOURNAL |
| **Review tick** | Weekly | Cloud routine | Metrics + funnel analysis → reprioritize BACKLOG → update this PLAN → write the digest for Magnus (one page, ≤3 decisions, each with a recommendation and a default) |

Mechanics: Claude Code scheduled cloud routines (`/schedule`) for all three,
so nothing depends on Magnus's laptop being open. The ops tick needs a
least-privilege secret set in the cloud environment (§7).

### 6.3 Tick protocol (the loop prompt, in brief)
1. Pull `main`. Read `ops/CHARTER.md`, this PLAN, `ops/BACKLOG.md`, the last 5 JOURNAL entries, and any answered ESCALATIONS.
2. Health first: if prod, CI or Sentry is red, fixing that *is* the tick.
3. (Ops tick) Work the exception queue.
4. (Build tick) Take one item and size it to one PR.
5. Verify: lint, typecheck, unit, E2E on preview. UI changes get a screenshot in the PR.
6. Merge or escalate per the charter.
7. JOURNAL: what changed, what was learned, what's next. Update BACKLOG/TASKS.
8. Stop.

### 6.4 Delegation charter (Magnus approves once; replaces CLAUDE.md "Ask First")

- **🟢 Green — the agent does it and merges:** bug fixes, tests, refactors, docs;
  admin-only features; non-legal UI copy within the voice rules; SEO pages that
  restate already-verified statute text; PII-scrubbed analytics events.
- **🟡 Yellow — the agent does it, opens a PR, and merges after 72 h unless Magnus
  vetoes:** additive migrations tested on staging; new dev dependencies; prod
  dependencies from a pre-approved list; cron jobs; changes to tenant-facing flows.
- **🔴 Red — needs Magnus's explicit yes:** letter templates, statute
  citations, damages or deadline math; RLS/auth changes; destructive migrations
  or deleting data; new paid services or spend; pricing and fee terms; the
  first time any new kind of message goes to real third parties; anything
  public under Magnus's identity; changes to legal posture.

### 6.5 Talking to Magnus
- `ops/ESCALATIONS.md`, mirrored as GitHub issues labeled `magnus`: context,
  recommendation, and the default action plus the date it takes effect.
- Weekly digest (review tick). Push notifications only for red alerts: prod
  down, a data or legal incident, a dispatch misfire.

---

## 7. Magnus's setup

See `ops/SETUP.md`. Part A (~20 min, free) is the minimum before the first real
case: prod email env vars, the webhook secret, and the admin flag. Part B
(staging, read-only role, observability, cloud env) is free and makes the loop
safer and smarter, but doesn't block revenue.

## 8. Rough timeline

| When | What |
|---|---|
| This week | Letter defects fixed; tenant approve-and-send built; summer-cohort page + posts drafted; Magnus does SETUP Part A and posts once |
| Weeks 2–4 | First real cases (via admin tools if approve-and-send isn't merged yet); follow-up cron; SEO guide pages |
| First recovery | M1: invoice by Venmo/Zelle; the first fees fund nothing until there are a few |
| Q1 2027 | Automate replies and recovery verification; SEO scaled for the season |
| May–Sep 2027 | Peak season — the real test of volume and autonomy |

## 9. Risks

- **Legal (existential, accepted by Magnus 2026-10-30)** — no attorney review;
  free mitigations in §4.1. If a regulator, bar, or landlord's lawyer raises
  UPL, stop dispatch with the kill switch and escalate URGENT.
- **Wrong letter → real harm to a tenant** — templates are deterministic,
  letter generation has heavy test coverage, the tenant approves every letter,
  and there's a kill switch. No attorney review, so the tests are the main guard.
- **Agent drift / bad merges** — CI + E2E + small PRs + revert-first + weekly review.
- **Credential blast radius** — scoped, read-only where possible; no service-role key in the loop except for narrowly scoped jobs.
- **Seasonality** — off-season now; SEO lead time is months, so start immediately.
- **Promises the system can't keep** — every SLA and every threat in the copy
  (response time, collections) must be literally true for an autonomous system.
