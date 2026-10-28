# Escalations

Decisions that need Magnus. Answer inline under **Answer:** — a word is enough.
The next tick applies the answer. 🟡 items take their default on the stated date if
unanswered; 🔴 items never do.

---

## Digest — 2026-10-28

Phase 0 is mostly done. Tests are green (64/64) and now guard the legal invariants
of the letters. CI runs on every PR. The "within a few hours" promise is now
"within two business days", which the loop can keep. The `ops/` operating system
is in place. What's left of Phase 0 (staging, E2E, metrics) waits on your setup
session. Three decisions:

---

### E-001 🔴 Do the one-time setup session
**Context:** Staging, E2E tests, metrics, the ops tick, and the cloud routines
all need credentials only you can create. Checklist: `ops/SETUP.md` (~1.5–2 hrs).
**Recommendation:** do sections 1–4 first; they unblock the most.
**Default:** none. Until then the loop works only on items that need no access
(SEO pages, triage logic, admin queue, docs).
**Answer:**

### E-002 🔴 Legal gate — book the attorney
**Context:** No real letter or fee until a CT attorney answers whether the 15%
contingency is lawful and whether this is document preparation or UPL. The packet
with the exact questions and the rendered letters is `ops/legal-packet.md`.
**Recommendation:** book this week. The answer decides whether we launch as-is,
adjust, or pivot to the attorney-software model (PLAN.md §4.1).
**Default:** none. The loop keeps building everything that doesn't touch a real landlord.
**Answer:**

### E-003 🔴 Letter defects found while rewriting tests
**Context:** Three factual problems in the letter templates (they're also in the
attorney packet):
  a. Letters 2 and 3 always say the landlord delivered no itemized statement, even
     when the tenant reported receiving one. Letter 1 handles both cases. A real
     letter could state something false.
  b. Letter 1 says "I will not send a further demand before filing", and Letter 2
     says "I will not send another demand", yet Letters 2 and 3 follow. That
     undercuts credibility.
  c. Letter 2 opens "You did not respond", which is false if the landlord replied
     with a dispute.
**Recommendation:** let the agent fix (a)–(c) now, as a PR you approve: branch 2
and 3 on itemization like Letter 1, drop the "no further demand" lines from
Letters 1–2, and make Letter 2's opening conditional on whether a reply exists.
The attorney then reviews the corrected version.
**Default:** none (letter content is 🔴).
**Answer:**
