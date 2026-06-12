# UPL Posture & Copy Audit

**Date:** 2026-06-11
**Author:** Claude (NOT a lawyer). This audits how the product currently presents
itself against an unauthorized-practice-of-law (UPL) risk lens, names the
specific exposure surfaces, and gives a concrete fix list. It is **not legal
advice and does not clear the UPL blocker** — the two starred items below
(contingency fee + demand-letter drafting) are genuine state-law questions that
need a licensed CT attorney. Everything else is copy/feature hygiene you can act
on now.

---

## The posture, stated crisply (what you must be able to defend)

Tribune is a **legal-information and document-preparation service**, not a law
firm. The tenant acts **pro se** (on their own behalf). Tribune:
- provides **information** about what CT law says (the statute, deadlines,
  procedures) — never advice about what *this specific tenant* should do;
- **prepares documents** the tenant reviews and authorizes;
- acts as the tenant's **authorized communications agent** with the landlord;
- makes **no decision for the tenant** — the tenant approves every outbound step.

Every surface must be consistent with that. The risk is any place Tribune
crosses from "here is what the law says / here is a document you authorize" into
"here is my legal judgment about your specific case" or "we are handling your
legal matter for you."

---

## Risk surfaces, ranked

### 🔴 1. The contingency fee itself  *(attorney — existential)*
A non-lawyer charging a **15% contingency fee** on the outcome of a legal claim
is the single biggest UPL/championship-and-maintenance question. Many states
treat contingency-fee legal-document services for non-lawyers as UPL and/or
champerty/fee-splitting. This is not a copy fix — it's a "is the business model
lawful in CT as structured" question. **Get a written CT opinion before charging
a real tenant.** Everything else in this doc is moot if this isn't cleared.

### 🔴 2. Drafting demand letters that make legal arguments  *(attorney)*
The letters cite a statute by subsection, assert violations, compute statutory
damages, and threaten litigation. Selecting the legal theory and drafting a
demand on someone's behalf is closer to "practice of law" than filling a form.
Your mitigations (tenant signs in the first person, reviews and authorizes,
disclaimers, pro-se framing) are the right ones — but whether they're *sufficient*
in CT is an attorney question. Tie this to LEGAL_REVIEW_47a-21.md.

### 🟠 3. Tenant-facing copy that reads as advice, not information
Several places lean from "information" toward "advice about your case":
- **Deadline banner** (`_steps.tsx`): "you may be entitled to **double damages**.
  Let's go after them." — that's case-specific encouragement + a legal
  conclusion. Reframe to information: "CT law provides for up to double damages
  when a landlord violates § 47a-21; whether that applies depends on the facts."
- **"Tribune's play" bullets** (case page `tenantLetterTactics`): "cite § 47a-21
  by section and anchor exposure at the statutory maximum — double damages."
  This narrates legal strategy as if advising. Keep it descriptive of process,
  not prescriptive of legal theory for their case.
- **Case calculator / "your estimated net":** presenting a dollar outcome can
  read as a prediction about their specific claim. Label clearly as a generic
  illustration, not an estimate of *their* recovery.
- Landing "Most deduction lists don't hold up" / "potentially void under
  § 47a-21": fine as general education; keep the qualifier ("potentially",
  "most") and out of any individualized assertion.

### 🟠 4. "Autonomous service" voice vs. reality  *(brand + UPL)*
CLAUDE.md intentionally frames Tribune as an autonomous actor ("Tribune", never
"the admin/I/we"). That's fine for brand, but it must not imply Tribune is a
**licensed entity practicing law**. The mitigations: keep the "not a law firm /
not legal advice / you authorize everything" disclaimer visible on every
tenant-facing surface and every outbound email (mostly present — see punch-list),
and never let the autonomous voice say or imply "we represent you" / "our client"
/ "we will win your case."

### 🟡 5. Outbound-to-landlord framing
The landlord letter/email already threads this reasonably: tenant is the
first-person author, Tribune is "authorized to manage communications," footer
says "not a law firm, does not provide legal advice." Keep "our client" and any
counsel-style language out (currently clean). Confirm the agency framing with
counsel as part of risk #2.

---

## Copy / feature punch-list (you can do these now)

- [ ] Deadline banner: replace "Let's go after them" + flat "you **may be**
      entitled to double damages" with information-framed wording.
- [ ] "Tribune's play" bullets: reword from legal-strategy-as-advice to
      process description; remove case-specific damages assertions.
- [ ] Calculator + "estimated net": add a visible "illustration only, not an
      estimate of your specific recovery" qualifier.
- [ ] Audit every tenant-facing page for the standard disclaimer; the landing
      and login have it, confirm `/dashboard`, case page, and new-case all carry
      `<LegalDisclaimer/>` (case page + new-case do; spot-check dashboard list).
- [ ] Confirm every outbound email template has the "not a law firm / not legal
      advice" footer (case-update, submitted, declined, invoice all do; keep it).
- [ ] Service agreement: it already says "not a law firm, no attorney-client
      relationship, legal information not advice, you act pro se" — have counsel
      confirm this language is sufficient for CT and matches the marketing voice.
- [ ] Remove/reword "reasonable attorney's fees" threats (see
      LEGAL_REVIEW_47a-21.md) — also a UPL-adjacent inconsistency (pro se = no
      attorney).

---

## What needs a CT attorney before first real tenant
1. **Is the 15% contingency model lawful** for a non-lawyer doc-prep service in
   CT (UPL / champerty / fee-splitting)? — existential.
2. **Is preparing the demand letters** (legal theory + statutory argument)
   within doc-prep, or UPL, given the pro-se signing and disclaimers?
3. Sufficiency of the **service-agreement disclaimers** and the agency framing in
   the landlord letters.

If 1 or 2 come back unfavorable, that's a model/scope change, not a copy tweak —
which is exactly why this needs to be answered before, not after, the first paid
case.
