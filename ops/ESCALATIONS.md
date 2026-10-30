# Escalations

Decisions that need Magnus. Answer inline under **Answer:** — a word is enough.
The next tick applies the answer. 🟡 items take their default on the stated date if
unanswered; 🔴 items never do.

---

## Digest — 2026-10-30

Your direction: no attorney, zero cash, get revenue flowing. Recorded in PLAN.md
§0 and §4.1. Everything is now ordered around the first paid recovery. The
fastest free path: the summer-2026 move-outs who never got their deposits back
(still inside the intake's one-year window), reached through your network and a
dedicated page, and served by a flow where the tenant approves and sends each
letter without you.

Closed:
- **E-002 (attorney)** — declined by Magnus 2026-10-30. Risk accepted; the packet is parked.
- **E-003 (letter defects)** — taken as approved under "keep moving ahead"; fixed in
  its own PR. Shout if you disagree.

Open:

---

### E-001 🔴 Setup Part A (~20 min, free)
**Context:** Prod may not be able to send email at all: `RESEND_API_KEY` in Vercel
is unverified, and that was the cause of "no emails sent" before. Letters,
notifications, and invoices all depend on it. Checklist: `ops/SETUP.md` Part A.
**Recommendation:** do it before anyone signs up from outreach.
**Default:** none.
**Answer:**

### E-004 🔴 Loosen the charter so the loop doesn't wait on you
**Context:** Under the current charter, letter content, RLS, and any service-role
use need your explicit yes. The approve-and-send flow (the feature that removes you
from each case) needs one narrowly scoped service-role write, so it would wait on you.
**Recommendation:** move letter content, RLS/service-role changes, and new kinds
of outbound messages from 🔴 to 🟡 (PR + 72 h veto, flagged in the digest). Keep 🔴
for spending money, posting as you, deleting or rewriting prod data, and pricing.
The tests guarding the letter invariants still have to pass.
**Default:** none (it's a charter change).
**Answer:**
