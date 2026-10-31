# Delegation Charter

**Full autonomy, granted by Magnus 2026-10-30:** "please stop asking me for any
more permission. you merge or commit etc whenever you want, full autonomy. just
dont spend my money or contact people without asking me."

This replaces the 🟢/🟡/🔴 charter approved 2026-10-28. Two things need Magnus's
yes. Everything else the agent does and merges on its own. All CLAUDE.md
conventions still apply: money as cents, RLS as the boundary, no PII in logs,
Tribune voice, and the information-not-advice disclaimer.

## 🔴 Ask Magnus first (an ESCALATIONS entry, then wait)

1. **Spending money.** Paid plans or upgrades, ads, domains, paid APIs, usage past
   a free tier, certified mail, filing fees. The budget is $0 until revenue.
   Prefer free tiers and the tools already in place.
2. **Contacting people.** The agent never sends a message to a real person
   itself. That covers emails, DMs, social or forum posts, public comments,
   messages from the admin tools, and any letter or message on a real case.
   Outreach is drafted into `ops/outreach/` for Magnus to send.

## 🟢 Everything else: do it, merge when CI is green

This includes letter templates, statute citations, deadline and damages math,
RLS and auth, scoped service-role use, migrations, new dependencies, crons,
tenant-facing flows and copy, pricing copy, and docs. Don't ask. Ship it, and
list anything notable in the next digest so Magnus can read it afterwards.

Building a product feature that sends messages isn't "contacting people", as
long as a user's own action is behind each message:
- A letter goes to a landlord only after the tenant approves it in the app. Never
  without that recorded approval.
- Transactional email to a tenant about their own case is fine: status changes,
  reminders, invoices.
- Marketing or cold messages to anyone are 🔴.

## Rules that hold without asking

- **Legal content:** restate only verified statute text (LEGAL_REVIEW_47a-21.md).
  Never invent case law, subsections, or citations. Never weaken a test that
  guards a legal invariant; add tests, don't loosen them. Flag ambiguity in the
  PR and the digest instead of guessing. Every change to letters, citations, or
  deadline/damages math goes in the digest's "Legal changes" list.
- **Production data:** never delete or rewrite it. Migrations are additive
  (nullable columns, new tables, new enum values). Cloud ticks have no prod
  credentials. Prod reads use the read-only role only.
- **Secrets and PII:** never commit secrets. No PII in logs, analytics, JOURNAL,
  commits, or PR text.
- **Shipping:** one item per PR. CI green before merge. If `main` or prod breaks,
  revert first, then investigate.
- **Kill switch:** anything that dispatches automatically respects `DISPATCH_PAUSED`.
- **Accounts:** the agent can't create accounts or enter credentials. Anything
  that needs one goes in `ops/SETUP.md` for Magnus. That's a to-do, not a
  permission request.
