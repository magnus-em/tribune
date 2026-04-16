export interface InvoiceEmailProps {
  tenantName: string;
  invoiceNumber: string;
  amountDollars: string;       // formatted, e.g. "$225.00"
  dueDate: string;             // formatted, e.g. "April 23, 2026"
  caseId: string;
  propertyAddress: string;
  recoveredDollars: string;    // formatted total recovered
  contingencyPct: number;
  paymentPhone: string;        // e.g. "4243336392"
  siteUrl: string;
}

export function renderInvoiceEmail({
  tenantName,
  invoiceNumber,
  amountDollars,
  dueDate,
  caseId,
  propertyAddress,
  recoveredDollars,
  contingencyPct,
  paymentPhone,
  siteUrl,
}: InvoiceEmailProps): string {
  const caseUrl = `${siteUrl}/dashboard/case/${caseId}`;
  const formattedPhone = paymentPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} — Tribune</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">

  <!-- Header -->
  <div style="background-color: #111827; border-radius: 8px 8px 0 0; padding: 24px 28px; margin-bottom: 0;">
    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">Tribune</p>
    <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Service Invoice</p>
  </div>

  <!-- Invoice card -->
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 28px;">

    <!-- Invoice meta -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #6b7280;">Invoice number</td>
        <td style="font-size: 13px; color: #111827; font-weight: 600; text-align: right;">${invoiceNumber}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #6b7280; padding-top: 6px;">Property</td>
        <td style="font-size: 13px; color: #111827; text-align: right; padding-top: 6px;">${propertyAddress}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #6b7280; padding-top: 6px;">Payment due</td>
        <td style="font-size: 13px; color: #dc2626; font-weight: 600; text-align: right; padding-top: 6px;">${dueDate}</td>
      </tr>
    </table>

    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 0 0 20px;">

    <!-- Line item -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <th style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; text-align: left;">Description</th>
          <th style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 12px 0; font-size: 14px; color: #111827;">
            Security deposit recovery — ${propertyAddress}<br>
            <span style="font-size: 12px; color: #6b7280;">${contingencyPct}% of ${recoveredDollars} recovered</span>
          </td>
          <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right; vertical-align: top;">${amountDollars}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="border-top: 2px solid #111827;">
          <td style="padding-top: 12px; font-size: 15px; font-weight: 700; color: #111827;">Total due</td>
          <td style="padding-top: 12px; font-size: 15px; font-weight: 700; color: #111827; text-align: right;">${amountDollars}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment instructions -->
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 14px; font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">How to Pay</p>

      <p style="margin: 0 0 10px; font-size: 13px; color: #374151;">
        <strong>Venmo</strong> — Send to <strong>${formattedPhone}</strong><br>
        <span style="color: #6b7280;">Include <strong>${invoiceNumber}</strong> in the payment note.</span>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">

      <p style="margin: 0; font-size: 13px; color: #374151;">
        <strong>Zelle</strong> — Send to <strong>${formattedPhone}</strong><br>
        <span style="color: #6b7280;">Include <strong>${invoiceNumber}</strong> in the memo field.</span>
      </p>
    </div>

    <p style="font-size: 13px; color: #374151; margin: 0 0 20px;">
      Hi ${tenantName}, congratulations on recovering your deposit. Per your service agreement,
      Tribune&apos;s ${contingencyPct}% fee of <strong>${amountDollars}</strong> is due by
      <strong>${dueDate}</strong>. Please include your invoice number in the payment note so we
      can match it to your account.
    </p>

    <p style="margin: 0 0 20px;">
      <a href="${caseUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">
        View Case →
      </a>
    </p>

    <!-- Late payment notice -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px 16px;">
      <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5;">
        <strong>Late payment notice:</strong> Fees unpaid after 14 days accrue interest at 1.5%/month.
        Accounts unpaid after 30 days may be referred to collections and reported to credit agencies
        per your service agreement. Questions? Reply to this email or contact
        <a href="mailto:billing@usetribune.org" style="color: #991b1b;">billing@usetribune.org</a>.
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="font-size: 12px; color: #9ca3af; padding: 20px 4px 0; line-height: 1.6;">
    <p style="margin: 0 0 6px;">
      Tribune · Legal-information and document-preparation services · Connecticut
    </p>
    <p style="margin: 0;">
      Tribune is not a law firm and does not provide legal advice.
      <a href="${siteUrl}" style="color: #6b7280; text-decoration: none;">${siteUrl.replace('https://', '')}</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}
