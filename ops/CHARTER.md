# Delegation Charter

**Approved by Magnus 2026-10-28.** This is the authority the operating agent acts
under. It replaces the "Before Acting — Ask First" list in CLAUDE.md. All other
CLAUDE.md rules (money as cents, RLS as the boundary, no PII in logs, voice rules,
legal-stakes rules) still apply in full.

When a change spans tiers, the highest tier wins. When unsure, go up a tier.

## 🟢 Green — do it, merge when CI is green

- Bug fixes, tests, refactors, docs, and `ops/` files
- Admin-only (`/admin/*`) features and UI
- Non-legal tenant-facing copy that follows the voice rules (no statute claims, no
  damages or deadline numbers, no promises the system can't keep)
- SEO and content pages that restate **already-verified** statute text, with the
  source cited and the "information, not legal advice" disclaimer
- PII-scrubbed analytics events
- CI and tooling configuration

## 🟡 Yellow — open a PR, log it in ESCALATIONS.md, merge after 72 h unless vetoed

- Additive schema migrations (new tables, new nullable columns, new enum values),
  tested on staging first. **Until staging exists, migrations are 🔴.**
- New dev dependencies
- New prod dependencies from the allowlist below
- New cron or scheduled jobs
- Changes to tenant-facing flows (new steps, new statuses, new emails to tenants)

Prod dependency allowlist (pre-approved): none yet. Magnus adds packages here.

## 🔴 Red — needs Magnus's explicit yes (in an ESCALATIONS answer or a PR comment)

- Letter templates, statute citations, damages math, deadline math
- RLS policies, auth behavior, the service-role key's usage
- Destructive migrations; deleting or rewriting any production data
- New external services, anything that costs money, and spending caps
- Pricing, fee terms, the service agreement, collections
- The first time any new kind of message goes to real third parties (landlords,
  partners, the public)
- Anything posted publicly under Magnus's identity
- Changes to the legal posture (UPL framing, disclaimers, agent framing)
- Sending any real letter to a real landlord before the legal gate in PLAN.md §4.1 clears

## Standing rules for every tier

- One item per PR. CI must be green. UI changes carry a screenshot or say why not.
- `main` broken or prod down → revert first, then investigate.
- Never weaken a test that guards legal content to make a change pass.
- Never touch production data from a build tick. Prod reads go through the read-only
  role only, and only aggregate or case-scoped as the task requires.
- Every 🟡/🔴 item states a recommendation and, for 🟡, the date the default applies.
