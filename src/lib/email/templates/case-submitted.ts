export interface CaseSubmittedEmailProps {
  tenantName: string;
  caseId: string;
  statutoryDeadline: string; // e.g. "Jun 21, 2026"
  siteUrl: string;
}

export function renderCaseSubmittedEmail({
  tenantName,
  caseId,
  statutoryDeadline,
  siteUrl,
}: CaseSubmittedEmailProps): string {
  const caseUrl = `${siteUrl}/dashboard/case/${caseId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tribune received your case</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #111827;">Tribune received your case</h2>
    <p>Hi ${tenantName},</p>
    <p>
      Thanks for submitting your security deposit case. Tribune is reviewing the
      details you provided and will respond <strong>within a few hours</strong>
      with next steps.
    </p>

    <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Your landlord's legal deadline</p>
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${statutoryDeadline}</p>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
        Under CT § 47a-21. Tribune aims to send a demand letter before this date.
      </p>
    </div>

    <p>What happens next:</p>
    <ol style="color: #4b5563; padding-left: 20px;">
      <li>Tribune reviews your intake and uploaded documents.</li>
      <li>If Tribune can take the case, a demand letter is prepared and sent to your landlord.</li>
      <li>If Tribune is unable to take the case, you'll receive a note explaining why, with links to other Connecticut tenant resources.</li>
    </ol>

    <p>
      <a href="${caseUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Your Case
      </a>
    </p>
  </div>

  <div style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    <p><strong>Legal Information, Not Legal Advice</strong></p>
    <p style="margin-top: 8px;">
      Tribune provides information about Connecticut tenant rights and helps prepare
      documents. Tribune is not a law firm and does not provide legal advice.
    </p>
    <p style="margin-top: 16px;">
      — Tribune<br>
      <a href="${siteUrl}" style="color: #3b82f6; text-decoration: none;">${siteUrl.replace("https://", "")}</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
