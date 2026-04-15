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
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), "MMMM d, yyyy");
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
RE: Security Deposit Return — ${fullPropertyAddress}

Dear ${data.landlordName}:

I am writing regarding the security deposit for the property located at ${fullPropertyAddress}, which I rented under a lease agreement from ${formatDate(data.leaseStartDate)} to ${formatDate(data.leaseEndDate)}. I vacated the premises on ${formatDate(data.moveOutDate)}.

SECURITY DEPOSIT FACTS:
• Deposit paid: ${depositAmount}
• Amount returned: ${amountReturned}
• Amount withheld: ${amountWithheld}
• Statutory deadline for return: ${statutoryDeadlineFormatted}
• Days overdue: ${data.daysOverdue}

Under Connecticut General Statutes § 47a-21(d), a landlord must return a tenant's security deposit within thirty (30) days of lease termination, or provide a written itemized statement of deductions. ${data.itemizedDeductionsReceived ? "While I received a deduction statement, the charges listed do not comply with Connecticut law." : "I have not received any itemized statement explaining the withholding."}

The statute is clear. If you fail to return the deposit within the statutory period, you may be liable for:
1. Return of the full security deposit, AND
2. Double the amount of the security deposit as damages, AND
3. Reasonable attorney's fees and court costs.

Based on the amount withheld (${amountWithheld}), your potential liability under Connecticut law is ${formatMoney(data.depositAmountCents * 2)} plus costs.

I am providing you an opportunity to resolve this matter before I pursue formal legal action. I request that you return the withheld amount of ${amountWithheld} within ten (10) business days of the date of this letter.

If I do not receive payment within ten (10) business days, I will proceed with filing a claim in small claims court and will seek the full remedies available under Connecticut law, including double damages and costs.

Please remit payment to:
${data.tenantName}
${data.tenantAddress}

You may contact me at ${data.tenantPhone || data.tenantEmail || "the address above"} if you wish to discuss this matter.

This letter is not intended as legal advice. It describes my understanding of Connecticut law as it applies to this situation.

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
RE: SECOND DEMAND — Security Deposit Return — ${fullPropertyAddress}

Dear ${data.landlordName}:

This is my second demand for return of my security deposit. I sent my first demand letter on ${firstLetterFormatted}, to which you have not responded.

As stated in my previous letter, Connecticut General Statutes § 47a-21(d) required you to return my security deposit of ${depositAmount} within thirty (30) days of my move-out date (${formatDate(data.moveOutDate)}). That deadline was ${formatDate(data.statutoryDeadline)} — now ${data.daysOverdue} days overdue.

Your failure to comply with Connecticut law means you are currently liable for:
• Double damages: ${potentialDamages}
• Court costs and filing fees
• Interest on the withheld amount
• Reasonable attorney's fees if I must retain counsel

The longer this matter remains unresolved, the greater your liability becomes.

FINAL OPPORTUNITY TO RESOLVE:
I am providing you one final opportunity to return the withheld amount of ${amountWithheld} before I file a claim in small claims court. If I receive payment within seven (7) business days of the date of this letter, I will consider this matter closed.

If I do not receive payment within seven (7) business days, I will:
1. File a complaint in Connecticut small claims court,
2. Seek the maximum damages available under § 47a-21 (double the deposit amount),
3. Request court costs, filing fees, and any other remedies available under Connecticut law.

I strongly encourage you to resolve this matter now to avoid further liability.

Payment should be sent to:
${data.tenantName}
${data.tenantAddress}

You may contact me at ${data.tenantPhone || data.tenantEmail || "the address above"}.

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
RE: FINAL NOTICE — Intent to File Legal Action — ${fullPropertyAddress}

Dear ${data.landlordName}:

This is my final notice before filing a legal claim against you.

I have now sent you two demand letters (dated ${firstLetterFormatted} and ${secondLetterFormatted}) requesting the return of my security deposit. You have not returned the withheld amount of ${amountWithheld}, nor have you responded to my demands.

SUMMARY OF VIOLATION:
You have violated Connecticut General Statutes § 47a-21(d) by failing to:
1. Return my security deposit of ${depositAmount} within 30 days of my move-out (${formatDate(data.moveOutDate)}), AND
2. Provide a legally compliant itemized statement of deductions.

The statutory deadline was ${formatDate(data.statutoryDeadline)}. It is now ${data.daysOverdue} days overdue.

NOTICE OF INTENT TO FILE LEGAL ACTION:
Unless I receive payment of ${amountWithheld} within five (5) business days of the date of this letter, I will file a complaint in Connecticut small claims court. I will seek:

1. Return of the full security deposit: ${depositAmount}
2. Double damages as provided by § 47a-21: ${doubleDamages}
3. Court costs and filing fees
4. Interest on the withheld amount
5. Any other remedies available under Connecticut law

I am prepared to file this claim immediately upon expiration of the five-day period.

FINAL PAYMENT INSTRUCTIONS:
If you wish to avoid court proceedings, send a check or money order for ${amountWithheld} to:

${data.tenantName}
${data.tenantAddress}

Payment must be received within five (5) business days. After that, I will proceed with filing a legal claim without further notice to you.

You may contact me at ${data.tenantPhone || data.tenantEmail || "the address above"} if you intend to remit payment.

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
