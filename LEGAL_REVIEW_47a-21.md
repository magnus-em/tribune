# Legal Review — Letter Templates vs. CGS § 47a-21

**Date:** 2026-06-11
**Reviewer:** Claude (NOT a lawyer). This is a fact-check of the letter
templates against the verbatim text of the current statute, plus a list of
items that require a licensed Connecticut attorney before any real letter ships.
It is **not legal advice and does not clear the legal blocker** — it makes the
remaining attorney review fast and targeted.

**Sources (authoritative):** Connecticut General Statutes § 47a-21 (2024),
verified via the CT General Assembly and Justia. Verbatim quotes below were
confirmed across two independent retrievals.
- https://law.justia.com/codes/connecticut/title-47a/chapter-831/section-47a-21/
- https://www.cga.ct.gov/2024/sup/chap_831.htm

Files reviewed: [src/lib/letters/templates.ts](src/lib/letters/templates.ts),
[src/lib/constants.ts](src/lib/constants.ts),
[src/app/admin/case/[id]/page.tsx](src/app/admin/case/[id]/page.tsx).

---

## Verbatim statute text (the two provisions the letters rely on)

**Deadline — subsection (d):**
> "Not later than twenty-one days after termination of a tenancy or fifteen days
> after receiving written notification of such tenant's forwarding address,
> whichever is later, each landlord ... shall deliver to the tenant or former
> tenant at such forwarding address either (A) the full amount of the security
> deposit paid by such tenant plus accrued interest, or (B) the balance of such
> security deposit and accrued interest after deduction for any damages suffered
> by such landlord ... together with a written statement itemizing the nature
> and amount of such damages."

**Double damages:**
> "Any landlord who violates any provision of this subsection shall be liable for
> twice the amount of any security deposit paid by such tenant, except that, if
> the only violation is the failure to deliver the accrued interest, such
> landlord shall be liable for ten dollars or twice the amount of the accrued
> interest, whichever is greater."

---

## Findings

### ✅ CONFIRMED CORRECT — the 21-day deadline
`STATUTE_DAYS = 21` is right for the **current** statute. (Note: older versions
said 30 days; we're on the 21-day version. Anyone Googling "30 days CT security
deposit" is reading a stale source.)

### 🔴 MATERIAL — double-damages base is wrong/unverified  *(attorney call)*
The letters say **"twice the amount wrongfully withheld"** and the math uses
`amount_withheld × 2`. The statute says **"twice the amount of any security
deposit paid"** — i.e. twice the **full deposit**.

Example from the test case: $1,400 deposit, $1,200 withheld.
- Letters assert exposure = 2 × $1,200 = **$2,400**.
- Statute's plain text = 2 × $1,400 = **$2,800**.

This is not a rounding nuance — it changes the demand amount and the stated legal
basis on a document that goes to a landlord and into a small-claims filing.
**Do not let me "fix" this by flipping the code to `deposit × 2`** — there is CT
case law on whether/when the full-deposit doubling applies (especially where a
landlord returned part of the deposit or acted in good faith), and that
interpretation is exactly what a non-lawyer must not assert. A CT attorney needs
to decide the damages base. Two honest possibilities:
- The letters are **conservative** (understating the claim) — arguably safer and
  more credible, but then the phrase "twice the amount wrongfully withheld"
  still misstates the statutory text and should be reworded.
- The correct base is the **full deposit**, in which case both the letters and
  the math understate the claim.

**Related code note:** my earlier audit ("fix #6") changed the admin
"statutory exposure" panel from `deposit × 2` to `amount_withheld × 2` to match
the letters. If counsel decides the base is the full deposit, that change should
be reverted and the letters updated. I deliberately did **not** touch the letter
damages math. Flagging so the two stay in sync once the base is settled.

### 🔴 MATERIAL — "forwarding address, whichever is later" is not modeled  *(product + attorney)*
The deadline in the statute is the **later of** (21 days after termination) **or**
(15 days after the landlord receives the tenant's **written** forwarding address).
The product computes the deadline as `move_out_date + 21` only and never
captures the **date the forwarding address was given to the landlord**. So:
- If a tenant gave their forwarding address late, the landlord may still be
  inside the statutory window — and a letter asserting "you missed the deadline,
  you're X days overdue" would be **factually wrong**.
- The statute also keys delivery to "at such forwarding address" and to *written*
  notification of it. Intake collects a forwarding address but not when/whether
  it was sent to the landlord in writing.

Recommendation: capture (a) whether the tenant sent the forwarding address in
writing and (b) the date, then compute the deadline as the later of the two
branches. Until then, a human must sanity-check the "overdue" claim per case.

### 🟠 REVIEW — "forfeits any right to withhold"  *(attorney call)*
Letter 1 states the failure to provide a compliant itemization "forfeits any
right to withhold." The statute's black-letter remedy is the double-damages
liability quoted above; the "forfeiture of the right to retain" framing is a
case-law gloss, not a direct quote. It may be a fair statement of CT law, but it
is an interpretation — confirm it's supported before asserting it as fact.

### 🟠 REVIEW — "reasonable attorney's fees" in a pro-se model  *(attorney call)*
All three letters threaten "reasonable attorney's fees." Two problems:
1. The § 47a-21 double-damages text I retrieved specifies the doubling as the
   remedy and does **not** itself mention attorney's fees. Confirm there is a
   statutory or contractual basis for fees before threatening them.
2. The entire product is **pro se** — the tenant has no attorney, so "attorney's
   fees" are generally $0 and arguably not recoverable. Threatening them is both
   possibly unsupported and internally inconsistent with the model. Recommend
   removing or rewording unless counsel confirms a basis.

### 🟡 NOTE — statutory interest on the deposit is ignored
Subsection (d) requires return of the deposit **plus accrued interest**, and the
statute sets an interest rate/accrual method. The product never computes deposit
interest, so the demand omits money the tenant is actually owed. Minor for a
first demand, but it's part of the lawful claim — worth adding once the rate
method is confirmed with counsel.

### 🟡 NOTE — "itemized, specific, documented" standard
The letters and UI assert that vague categories ("cleaning — $300") are
non-compliant. The statute requires "a written statement itemizing the nature
and amount of such damages." How specific is "itemizing" is partly case-law
driven. The framing is reasonable but the "most landlords don't meet this bar"
claim is advocacy, not statute — fine in marketing, but keep it out of the
factual/legal recitals in the letters unless counsel signs off.

---

## What a CT attorney must resolve before the first real letter
1. **Damages base:** full deposit vs. wrongfully-withheld — and the exact wording
   to use. (Gates the letter math and the admin exposure panel.)
2. **Attorney's-fees language:** remove, or confirm a basis given pro-se posture.
3. **"Forfeits right to withhold":** confirm or soften.
4. **Deadline computation:** confirm the forwarding-address branch handling.
5. A general read of all three letters for any other overstatement of
   black-letter law.

Items 1–3 are wording changes to [templates.ts](src/lib/letters/templates.ts);
item 4 is a product change. None require guessing — they require a licensed CT
attorney's sign-off, which is the actual ship gate here.

---

## Changes applied 2026-06-11 (for attorney review, not final)

At the founder's direction, the copy was updated to track the statute's plain
text. **These still need attorney sign-off** — they are a best-effort accuracy
pass, not a legal opinion.

- **Damages base → full deposit.** All three letters, the admin "exposure"
  panel, the landing "Double damages" card, the intake deadline banner, and the
  tenant "Tribune's play" bullets now state liability of *"up to twice the amount
  of the security deposit"* (quoting § 47a-21(d)), computed as `deposit × 2`
  instead of `withheld × 2`. The demand amount remains the **withheld** principal;
  the statutory **exposure** is twice the full deposit.
- **Attorney's-fees threats removed** from all letters (pro-se model + no clear
  statutory basis). Replaced with "accrued interest and court costs" /
  "statutory interest."
- **"Forfeits any right to withhold" removed.** Replaced with the black-letter
  framing: failing to deliver a compliant itemized statement within the period
  "is itself a violation of the subsection."
- **Forwarding-address rule added** to the recital: deadline is the later of
  21 days after termination or 15 days after written notice of the forwarding
  address. (The system still computes the date as move-out + 21 — capturing the
  forwarding-address date is the open **product** item #4 above.)
- **"Filing fee paid out of recovery"** line removed from Letter 3 (revealed the
  service arrangement inside the tenant's pro-se letter).
- Tenant-facing legal claims reframed from advice ("Let's go after them",
  "you may be entitled to double damages") to information ("the statute provides
  for…, whether it applies depends on the facts"). See
  [UPL_POSTURE.md](UPL_POSTURE.md).

**Still open for the attorney (unchanged by the above):** whether the
full-deposit doubling is the right base in light of CT case law where a landlord
returned part of the deposit; the legality of the 15% contingency model; and
whether preparing these letters is within doc-prep or UPL.
