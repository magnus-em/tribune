# Tribune — Questions for Connecticut Counsel

**Prepared:** 2026-10-28 by Tribune (for Magnus Melbourne, founder).
**Purpose:** a short, specific consult. We are not yet serving tenants. We need a
written answer to three questions before sending any letter to a real landlord or
charging any fee. Supporting detail: `LEGAL_REVIEW_47a-21.md`, `UPL_POSTURE.md`.

---

## What Tribune is (one paragraph)

Tribune is a non-lawyer service for Connecticut residential tenants whose security
deposit was withheld. A tenant completes an online intake (lease dates, deposit,
amounts withheld, landlord contact, evidence uploads) and signs a service
agreement. Tribune generates demand letters from fixed templates (three escalating
letters citing CGS § 47a-21(d)), written in the tenant's first-person voice and
signed with the tenant's name. Tribune emails each letter to the landlord from
`hello@usetribune.org`, inside a short cover note identifying Tribune as the
tenant's authorized communications agent, with replies routed back to Tribune.
Before that, the tenant sends the landlord one email from their own inbox
authorizing Tribune to correspond. The landlord pays the tenant directly; Tribune
never holds funds. After recovery Tribune invoices the tenant 15% of the amount
recovered. If the claim escalates, the tenant files in small claims pro se.
No attorney is involved at any stage.

## The three questions

1. **Fee.** Can a non-lawyer service lawfully charge a **15% contingency fee** on
   amounts a tenant recovers under § 47a-21, as structured above? If not, what fee
   structure is permissible (flat fee for document preparation, subscription, none)?

2. **Practice of law.** Is this activity — selecting § 47a-21(d) as the basis,
   generating the demand letters from case facts, and transmitting them to the
   landlord as the tenant's authorized agent — permissible document preparation,
   or the unauthorized practice of law in Connecticut? What changes would make it
   permissible (for example: the tenant reviews and approves each letter in-app
   before it's sent; the tenant sends the letters from their own email; Tribune
   provides forms only)?

3. **Letter content.** Please review the three letters (Appendix A) for accuracy.
   Specific points:
   - **Damages base.** The letters state exposure of up to twice the **full
     deposit** ("twice the amount of any security deposit paid"), not twice the
     amount withheld. Is that the right reading where the landlord returned part
     of the deposit?
   - **Deadline.** The letters recite both branches (21 days after termination, or
     15 days after written notice of the forwarding address, whichever is later).
     The system currently computes the date as move-out + 21 days. Is that
     acceptable when the forwarding-address date is unknown?
   - **Interest.** The letters mention "accrued interest" but compute none.
   - **Court naming.** Letter 1 says "a Small Claims action in Connecticut Superior
     Court"; Letters 2–3 say "Connecticut Small Claims Court". Which is correct?
   - **Defects Tribune has already identified** (fix pending your view):
     a. Letters 2 and 3 always assert the landlord delivered no itemized statement,
        even when the tenant reported receiving one (Letter 1 handles both cases).
     b. Letter 1 says "I will not send a further demand before filing" and Letter 2
        says "I will not send another demand", yet Letters 2 and 3 follow.
     c. Letter 2 opens "You did not respond", which is false if the landlord
        replied with a dispute.

## Also worth a look if time allows

- **Service agreement (Appendix B).** Clause 2 says correspondence will be "signed
  and sent by you in your own name", while Tribune actually transmits it. Clause 3
  limits the fee to amounts recovered "as a direct result of Tribune's services";
  clause 5 applies it to "all amounts recovered", including amounts "credited, or
  forgiven". It also includes 1.5%/month late interest, credit reporting, and
  collections. Are those enforceable and consumer-law compliant?
- **Agent framing.** The cover note presents Tribune as the tenant's "authorized
  communications agent". The tenant's intro email describes Tribune as "a
  Connecticut tenant-advocacy service". Any concern with either phrase?

## If the answer to 1 or 2 is "no"

The fallback is to restructure Tribune as software used by a Connecticut attorney
or legal-aid clinic, where the attorney is the provider and Tribune is paid per case
or by subscription. Is there a compliant structure for that, and would you or
someone you know be interested?

---

## Appendix A — Letters as currently generated (sample data)

Sample: $1,500 deposit, $1,000 returned, $500 withheld, move-out 2026-06-30.
Generated directly from `src/lib/letters/templates.ts`.

## Letter 1 (no itemized statement received)

```
October 28, 2026

John Smith
456 Main St, New Haven, CT 06511

RE: Security Deposit Demand — 789 Elm Ave, Unit 2B

Dear John Smith:

I rented 789 Elm Ave, Unit 2B under a lease from July 1, 2025 to June 30, 2026 and vacated on June 30, 2026. Under Connecticut General Statutes § 47a-21(d), you were required, not later than twenty-one (21) days after the termination of the tenancy (or fifteen (15) days after receiving written notice of my forwarding address, whichever is later), to deliver either the full security deposit with accrued interest, or the balance with a written statement itemizing the nature and amount of any damages. That deadline was July 21, 2026, and it has passed.

THE FACTS:
• Deposit paid: $1,500.00
• Amount returned: $1,000.00
• Amount still withheld: $500.00
• Statutory deadline: July 21, 2026

You did not deliver a written statement itemizing the nature and amount of any damages, as § 47a-21(d) requires. Failing to do so within the statutory period is itself a violation of the subsection.

STATUTORY DAMAGES
Section 47a-21(d) provides that a landlord who violates the subsection “shall be liable for twice the amount of any security deposit paid by such tenant.” The deposit on this tenancy was $1,500.00, so the statute exposes you to liability of up to $3,000.00, together with accrued interest and court costs. That exposure does not decrease by waiting.

DEMAND
Remit $500.00 within ten (10) business days of this letter to resolve this matter. If full payment is not received in that window, I may file a Small Claims action in Connecticut Superior Court seeking statutory damages of up to $3,000.00, plus filing fees, service costs, and statutory interest. I will not send a further demand before filing.

Payment must be made out to Jane Doe and sent to:
123 Oak St, New Haven, CT 06511

Direct any correspondence about this matter to Tribune at the email address from which this letter was sent. Tribune is authorized to receive replies on my behalf.

Sincerely,

Jane Doe
```

## Letter 1 — variant when an itemized statement WAS received (paragraph that changes)

```
I rented 789 Elm Ave, Unit 2B under a lease from July 1, 2025 to June 30, 2026 and vacated on June 30, 2026. Under Connecticut General Statutes § 47a-21(d), you were required, not later than twenty-one (21) days after the termination of the tenancy (or fifteen (15) days after receiving written notice of my forwarding address, whichever is later), to deliver either the full security deposit with accrued interest, or the balance with a written statement itemizing the nature and amount of any damages. That deadline was July 21, 2026, and it has passed.
```

## Letter 2

```
October 28, 2026

John Smith
456 Main St, New Haven, CT 06511

RE: SECOND DEMAND — Security Deposit — 789 Elm Ave, Unit 2B

Dear John Smith:

I delivered a demand for the return of my security deposit on August 3, 2026. You did not respond. I am writing once more before filing.

The statutory period under Connecticut General Statutes § 47a-21(d) closed on July 21, 2026. You did not return the withheld amount of $500.00, and you did not deliver a written statement itemizing the nature and amount of any damages as the statute requires. Each omission is a violation of the subsection.

WHAT THE STATUTE PROVIDES
• Security deposit withheld: $500.00
• Statutory damages under § 47a-21(d) — twice the $1,500.00 deposit: up to $3,000.00
• Accrued interest and court costs

THIS IS THE LAST LETTER BEFORE I FILE.
Remit $500.00 within seven (7) business days of this letter. If full payment is not received in that window, I may file in Connecticut Small Claims Court and seek statutory damages of up to $3,000.00, plus costs and statutory interest. I will not send another demand.

Payment must be made out to Jane Doe and sent to:
123 Oak St, New Haven, CT 06511

Direct any correspondence to Tribune at the email address from which this letter was sent. Tribune is authorized to receive replies on my behalf.

Sincerely,

Jane Doe
```

## Letter 3

```
October 28, 2026

John Smith
456 Main St, New Haven, CT 06511

RE: FINAL NOTICE — Intent to File — 789 Elm Ave, Unit 2B

Dear John Smith:

This is my final notice before filing.

I sent demand letters on August 3, 2026 and August 17, 2026. You have not returned $500.00. You have not responded.

VIOLATION
Under Connecticut General Statutes § 47a-21(d), you were required to return my deposit or deliver a written statement itemizing the nature and amount of any damages within the statutory period. That deadline — July 21, 2026 — has passed. You did neither.

NOTICE OF INTENT TO FILE
Unless $500.00 is received within five (5) business days of the date of this letter, I intend to file in Connecticut Small Claims Court and seek:
1. Return of the security deposit withheld: $500.00
2. Statutory damages under § 47a-21(d) — twice the $1,500.00 deposit: up to $3,000.00
3. Court filing and service fees
4. Statutory interest
5. Any other remedies available under Connecticut law

NO FURTHER CORRESPONDENCE
After the five-day period, I will not write again. The next document you receive from this matter will be a summons.

If you intend to settle, payment must be made out to Jane Doe and sent to:
123 Oak St, New Haven, CT 06511

Direct any reply to Tribune at the email address from which this letter was sent.

Sincerely,

Jane Doe
```

## Appendix B — Service agreement and authorizations

- Service agreement text: `src/app/dashboard/new-case/_steps.tsx` (Step 5, "Tribune
  Service Agreement", clauses 1–9; clause 6 is initialed separately).
- Tenant's intro email to the landlord: `buildIntroEmail()` in
  `src/app/dashboard/case/[id]/_components.tsx`.
- Cover note wrapping each letter: `src/lib/email/templates/landlord-letter.ts`.

Magnus: export these as a PDF (or paste them) when you send the packet. The agent
can produce a clean PDF on request.
