# Tribune — Autonomous Operating Plan

**Status:** approved by Magnus 2026-10-28 (plan + delegation charter).
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
- **One gate only Magnus can clear: legal.** No real letter goes to a real
  landlord, and no fee is charged, until a CT attorney has answered the two
  existential questions (contingency fee legality; document prep vs. UPL) —
  or Magnus explicitly decides to accept that risk. Everything else proceeds in
  parallel.
- **What Magnus does:** one ~2-hour setup session (credentials, the delegation
  charter, attorney booking), then ~15 minutes every few days answering ≤3
  decisions in the weekly digest.
- **Timing:** it's late October — off-season. CT move-out volume peaks
  May–September (students especially). The next 6 months are for building the
  autonomous machine and SEO that compounds into summer 2027.

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
| Legal | LEGAL_REVIEW + UPL_POSTURE written; attorney review **not done**. |
| Copy vs. reality | The case-submitted banner promises a response "within a few hours" — not deliverable by a daily loop. Must change before launch. |

---

## 2. Goals and how we'll know

**North star:** dollars recovered for tenants per month.

| Milestone | Definition | Proves |
|---|---|---|
| M0 — Ready | Legal gate cleared, Phase 0–1 shipped, staging E2E green | We're allowed to and able to run a case |
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
| Give a legal opinion | Not a lawyer; existential questions | Magnus books a CT attorney; the agent prepares a short packet with the exact questions (`ops/legal-packet.md`) |
| Create accounts, enter credentials/API keys, accept ToS | Safety rules | Magnus's one-time setup session (§7) |
| Spend money | Safety rules | Magnus sets budgets/cards; the agent operates within caps through provisioned APIs |
| Post publicly / DM / cold-email under Magnus's identity | Each public post needs explicit approval | Prefer channels Tribune owns (site, SEO, free tools, product emails). Outreach drafts go to a queue Magnus sends in batches |
| Send legal correspondence to real people on its own judgment | High stakes; needs a human authorizer | Tenant approves every outbound letter in-app; letters come from attorney-reviewed templates, not freeform agent prose |
| Be always on | Loops run when compute is available | Time-sensitive ops live in product code + crons, not in the loop |
| Read prod data without standing permission | Permission classifier blocked it today | Least-privilege read-only DB role + an explicit permission rule (§7) |

---

## 4. Strategy

### 4.1 Gate 0 — legal (weeks 0–3, Magnus)

The questions (from UPL_POSTURE.md and LEGAL_REVIEW_47a-21.md):
1. Can a non-lawyer service lawfully charge a 15% contingency on a § 47a-21 recovery in CT?
2. Is preparing these demand letters, as the tenant's authorized agent, document preparation or practice of law?
3. Sign-off on letter bodies: damages base (2× full deposit), the forwarding-address deadline branch, the agent framing.

Plan for each answer:
- **Cleared as-is** → launch the concierge beta (§4.2).
- **Cleared with changes** (e.g., flat fee instead of contingency, tenant sends letters themselves, different framing) → the agent implements the changes; Magnus approves pricing.
- **Not viable without an attorney** → pivot to *Tribune as software for a CT attorney or clinic*. The attorney is the provider; Tribune is paid per case or by subscription, not by fee-split (fee-splitting rules — attorney to confirm). Possible partners worth asking: New Haven legal aid, a Yale Law clinic, a solo landlord-tenant practitioner `[uncertain — Magnus to qualify]`.

While waiting, build everything that doesn't touch a real landlord: Phase 0–2.

### 4.2 Launch shape — concierge beta, New Haven

- First ~10 cases. Tenant approves every letter. Templates are attorney-reviewed.
  Magnus gets a daily digest but doesn't have to act on it.
- Pricing in beta is Magnus's call: 15% if cleared, or free in exchange for
  feedback/testimonial.
- Before the first invoice: decide the collections path. The PRODUCT_BRIEF says
  the collections threat must be literally true — either contract an agency or
  soften the copy.

### 4.3 Finding users — channels ranked by (autonomy × yield)

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
5. **Paid search** — high-intent queries, small capped budget. Only after M1
   proves the funnel converts. Magnus sets up the account; the agent manages
   copy and keywords.
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
| Escalation | Not built | Small-claims packet prefilled from case data; the tenant files pro se. Forms must be attorney-verified. |
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
- [ ] `ops/legal-packet.md` for the attorney

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

## 7. Magnus's one-time setup (~2 hrs)

1. **Legal:** book a CT attorney consult; send `ops/legal-packet.md`.
2. **Approve the charter** (§6.4) and beta pricing.
3. **Access for the agent** — least privilege, scoped tokens:
   - Vercel: refresh `vercel login` locally and issue a project-scoped token for the loops. Fill the launch-blocker env vars from TASKS.md.
   - GitHub: branch protection on `main` with required CI; allow the loop to merge its own PRs.
   - Supabase: a staging project; a **read-only** prod DB role for metrics and the exception queue; plus the Claude Code permission rule that allows prod reads through it.
   - Sentry auth token (read), PostHog personal API key (read) or authorize the PostHog MCP, Resend API key (confirm the inbound webhook + `RESEND_WEBHOOK_SECRET`).
   - Google Search Console for usetribune.org (SEO feedback), with read access for the agent.
   - The cloud environment for routines, holding the secrets above.
4. Later (Phase 3): a Stripe account and a spending cap for any paid channel.

---

## 8. Rough timeline

| When | What |
|---|---|
| Week 1 | Phase 0; legal packet; Magnus's setup session |
| Weeks 2–6 | Phase 1 + Phase 2 in parallel; attorney consult |
| After legal clears | Concierge beta, first 5–10 cases (network + early SEO) |
| Q1 2027 | Phase 3; SEO content scaled for the season |
| May–Sep 2027 | Peak season — the real test of volume and autonomy |

---

## 9. Risks

- **Legal (existential)** — gated in §4.1; pivot path defined.
- **Wrong letter → real harm to a tenant** — templates are deterministic and
  attorney-reviewed, letter generation has heavy test coverage, the tenant
  approves every letter, and there's a kill switch.
- **Agent drift / bad merges** — CI + E2E + small PRs + revert-first + weekly review.
- **Credential blast radius** — scoped, read-only where possible; no service-role key in the loop except for narrowly scoped jobs.
- **Seasonality** — off-season now; SEO lead time is months, so start immediately.
- **Promises the system can't keep** — every SLA and every threat in the copy
  (response time, collections) must be literally true for an autonomous system.
