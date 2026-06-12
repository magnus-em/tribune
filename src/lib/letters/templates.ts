/**
 * Demand Letter Templates
 *
 * These templates generate demand letters for Connecticut security deposit disputes
 * under CT General Statutes § 47a-21.
 *
 * IMPORTANT: These templates provide legal information and document structure,
 * not legal advice. All letters must be reviewed by the tenant before sending.
 */

import { format } from "date-fns";
import { parseDateOnly } from "@/lib/utils/case";

export interface LetterData {
  // Tenant info
  tenantName: string;
  tenantAddress: string;
  tenantPhone?: string;
  tenantEmail?: string;

  // Landlord info
  landlordName: string;
  landlordAddress?: string;

  // Property info
  propertyAddress: string;
  unitNumber?: string;

  // Lease info
  leaseStartDate: string;
  leaseEndDate: string;
  moveOutDate: string;

  // Deposit info
  depositAmountCents: number;
  amountWithheldCents: number;
  depositReturnedCents: number;

  // Dates
  statutoryDeadline: string;
  daysOverdue: number;

  // Case context
  itemizedDeductionsReceived: boolean;
  situationDescription: string;
  withholding_reason?: string;
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  // Date-only columns must be parsed as local dates, or every date in the
  // letter (move-out, lease term, statutory deadline) renders a day early.
  return format(parseDateOnly(dateString), "MMMM d, yyyy");
}

/**
 * Letter 1: Initial Demand Letter
 * Tone: Professional and factual. States the law and requests immediate payment.
 */
export function generateLetter1(data: LetterData): string {
  const todayFormatted = format(new Date(), "MMMM d, yyyy");
  const fullPropertyAddress = data.unitNumber
    ? `${data.propertyAddress}, Unit ${data.unitNumber}`
    : data.propertyAddress;

  const depositAmount = formatMoney(data.depositAmountCents);
  const amountWithheld = formatMoney(data.amountWithheldCents);
  const amountReturned = formatMoney(data.depositReturnedCents);
  const statutoryDeadlineFormatted = formatDate(data.statutoryDeadline);

  const landlordAddressLine = data.landlordAddress
    ? `${data.landlordAddress}\n`
    : "";

  return `${todayFormatted}

${data.landlordName}
${landlordAddressLine}
RE: Security Deposit Demand — ${fullPropertyAddress}

Dear ${data.landlordName}:

I rented ${fullPropertyAddress} under a lease from ${formatDate(data.leaseStartDate)} to ${formatDate(data.leaseEndDate)} and vacated on ${formatDate(data.moveOutDate)}. Under Connecticut General Statutes § 47a-21(d), you were required, not later than twenty-one (21) days after the termination of the tenancy (or fifteen (15) days after receiving written notice of my forwarding address, whichever is later), to deliver either the full security deposit with accrued interest, or the balance with a written statement itemizing the nature and amount of any damages. That deadline was ${statutoryDeadlineFormatted}, and it has passed.

THE FACTS:
• Deposit paid: ${depositAmount}
• Amount returned: ${amountReturned}
• Amount still withheld: ${amountWithheld}
• Statutory deadline: ${statutoryDeadlineFormatted}

${data.itemizedDeductionsReceived ? "You provided a deduction statement, but it does not comply with the itemization requirements of § 47a-21(d). General categories such as “cleaning” or “damages,” without the specific nature and amount of each charge, do not satisfy the statute." : "You did not deliver a written statement itemizing the nature and amount of any damages, as § 47a-21(d) requires. Failing to do so within the statutory period is itself a violation of the subsection."}

STATUTORY DAMAGES
Section 47a-21(d) provides that a landlord who violates the subsection “shall be liable for twice the amount of any security deposit paid by such tenant.” The deposit on this tenancy was ${depositAmount}, so the statute exposes you to liability of up to ${formatMoney(data.depositAmountCents * 2)}, together with accrued interest and court costs. That exposure does not decrease by waiting.

DEMAND
Remit ${amountWithheld} within ten (10) business days of this letter to resolve this matter. If full payment is not received in that window, I may file a Small Claims action in Connecticut Superior Court seeking statutory damages of up to ${formatMoney(data.depositAmountCents * 2)}, plus filing fees, service costs, and statutory interest. I will not send a further demand before filing.

Payment must be made out to ${data.tenantName} and sent to:
${data.tenantAddress}

Direct any correspondence about this matter to Tribune at the email address from which this letter was sent. Tribune is authorized to receive replies on my behalf.

Sincerely,

${data.tenantName}`;
}

/**
 * Letter 2: Follow-up Demand Letter
 * Tone: Firmer. References first letter, emphasizes escalating costs, sets final deadline.
 */
export function generateLetter2(data: LetterData, firstLetterDate: string): string {
  const todayFormatted = format(new Date(), "MMMM d, yyyy");
  const firstLetterFormatted = formatDate(firstLetterDate);
  const fullPropertyAddress = data.unitNumber
    ? `${data.propertyAddress}, Unit ${data.unitNumber}`
    : data.propertyAddress;

  const depositAmount = formatMoney(data.depositAmountCents);
  const amountWithheld = formatMoney(data.amountWithheldCents);
  const potentialDamages = formatMoney(data.depositAmountCents * 2);

  const landlordAddressLine = data.landlordAddress
    ? `${data.landlordAddress}\n`
    : "";

  return `${todayFormatted}

${data.landlordName}
${landlordAddressLine}
RE: SECOND DEMAND — Security Deposit — ${fullPropertyAddress}

Dear ${data.landlordName}:

I delivered a demand for the return of my security deposit on ${firstLetterFormatted}. You did not respond. I am writing once more before filing.

The statutory period under Connecticut General Statutes § 47a-21(d) closed on ${formatDate(data.statutoryDeadline)}. You did not return the withheld amount of ${amountWithheld}, and you did not deliver a written statement itemizing the nature and amount of any damages as the statute requires. Each omission is a violation of the subsection.

WHAT THE STATUTE PROVIDES
• Security deposit withheld: ${amountWithheld}
• Statutory damages under § 47a-21(d) — twice the ${depositAmount} deposit: up to ${potentialDamages}
• Accrued interest and court costs

THIS IS THE LAST LETTER BEFORE I FILE.
Remit ${amountWithheld} within seven (7) business days of this letter. If full payment is not received in that window, I may file in Connecticut Small Claims Court and seek statutory damages of up to ${potentialDamages}, plus costs and statutory interest. I will not send another demand.

Payment must be made out to ${data.tenantName} and sent to:
${data.tenantAddress}

Direct any correspondence to Tribune at the email address from which this letter was sent. Tribune is authorized to receive replies on my behalf.

Sincerely,

${data.tenantName}`;
}

/**
 * Letter 3: Final Notice Before Legal Action
 * Tone: Final warning. Direct statement of intent to file in court, specific timeline.
 */
export function generateLetter3(
  data: LetterData,
  firstLetterDate: string,
  secondLetterDate: string
): string {
  const todayFormatted = format(new Date(), "MMMM d, yyyy");
  const firstLetterFormatted = formatDate(firstLetterDate);
  const secondLetterFormatted = formatDate(secondLetterDate);
  const fullPropertyAddress = data.unitNumber
    ? `${data.propertyAddress}, Unit ${data.unitNumber}`
    : data.propertyAddress;

  const depositAmount = formatMoney(data.depositAmountCents);
  const amountWithheld = formatMoney(data.amountWithheldCents);
  const doubleDamages = formatMoney(data.depositAmountCents * 2);

  const landlordAddressLine = data.landlordAddress
    ? `${data.landlordAddress}\n`
    : "";

  return `${todayFormatted}

${data.landlordName}
${landlordAddressLine}
RE: FINAL NOTICE — Intent to File — ${fullPropertyAddress}

Dear ${data.landlordName}:

This is my final notice before filing.

I sent demand letters on ${firstLetterFormatted} and ${secondLetterFormatted}. You have not returned ${amountWithheld}. You have not responded.

VIOLATION
Under Connecticut General Statutes § 47a-21(d), you were required to return my deposit or deliver a written statement itemizing the nature and amount of any damages within the statutory period. That deadline — ${formatDate(data.statutoryDeadline)} — has passed. You did neither.

NOTICE OF INTENT TO FILE
Unless ${amountWithheld} is received within five (5) business days of the date of this letter, I intend to file in Connecticut Small Claims Court and seek:
1. Return of the security deposit withheld: ${amountWithheld}
2. Statutory damages under § 47a-21(d) — twice the ${depositAmount} deposit: up to ${doubleDamages}
3. Court filing and service fees
4. Statutory interest
5. Any other remedies available under Connecticut law

NO FURTHER CORRESPONDENCE
After the five-day period, I will not write again. The next document you receive from this matter will be a summons.

If you intend to settle, payment must be made out to ${data.tenantName} and sent to:
${data.tenantAddress}

Direct any reply to Tribune at the email address from which this letter was sent.

Sincerely,

${data.tenantName}`;
}

/**
 * Generate the appropriate letter based on letter number
 */
export function generateDemandLetter(
  letterNumber: number,
  data: LetterData,
  previousLetterDates?: { letter1?: string; letter2?: string }
): string {
  switch (letterNumber) {
    case 1:
      return generateLetter1(data);
    case 2:
      if (!previousLetterDates?.letter1) {
        throw new Error("Letter 1 date is required to generate Letter 2");
      }
      return generateLetter2(data, previousLetterDates.letter1);
    case 3:
      if (!previousLetterDates?.letter1 || !previousLetterDates?.letter2) {
        throw new Error("Letter 1 and 2 dates are required to generate Letter 3");
      }
      return generateLetter3(data, previousLetterDates.letter1, previousLetterDates.letter2);
    default:
      throw new Error(`Invalid letter number: ${letterNumber}. Must be 1, 2, or 3.`);
  }
}
