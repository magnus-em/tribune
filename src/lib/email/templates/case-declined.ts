export interface CaseDeclinedEmailProps {
  tenantName: string;
  caseId: string;
  declineMessage: string; // tenant-visible explanation from admin
  siteUrl: string;
}

export function renderCaseDeclinedEmail({
  tenantName,
  caseId,
  declineMessage,
  siteUrl,
}: CaseDeclinedEmailProps): string {
  const caseUrl = `${siteUrl}/dashboard/case/${caseId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tribune is unable to take your case</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #111827;">Tribune is unable to take your case</h2>
    <p>Hi ${tenantName},</p>
    <p>
      Thanks for the time you put into your intake. After reviewing the details,
      Tribune isn't able to take this case on.
    </p>

    <div style="background-color: white; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Why</p>
      <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${declineMessage}</p>
    </div>

    <p style="margin-top: 24px;">
      <strong>You may still have a strong claim on your own.</strong> Connecticut
      tenants have real rights under CT § 47a-21, and there are free resources
      that can help you pursue this directly:
    </p>
    <ul style="color: #4b5563; padding-left: 20px;">
      <li>
        <strong>New Haven Legal Assistance Association (NHLAA)</strong> —
        free civil legal help for low-income CT tenants.<br>
        <a href="https://nhlegal.org" style="color: #3b82f6;">nhlegal.org</a>
        &middot; (203)&nbsp;946-4811
      </li>
      <li style="margin-top: 8px;">
        <strong>Connecticut Fair Housing Center</strong> —
        statewide tenant resources and referrals.<br>
        <a href="https://www.ctfairhousing.org" style="color: #3b82f6;">ctfairhousing.org</a>
      </li>
      <li style="margin-top: 8px;">
        <strong>CT § 47a-21 statutory text</strong> — what the law says about
        security deposits, deadlines, and damages.<br>
        <a href="https://www.cga.ct.gov/current/pub/chap_831.htm#sec_47a-21" style="color: #3b82f6;">Connecticut General Statutes, Chapter 831</a>
      </li>
    </ul>

    <p>
      <a href="${caseUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 8px;">
        View Your Case
      </a>
    </p>
  </div>

  <div style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    <p><strong>Legal Information, Not Legal Advice</strong></p>
    <p style="margin-top: 8px;">
      Tribune provides information about Connecticut tenant rights. Tribune is not
      a law firm and does not provide legal advice. Declining to take a case is not
      a legal opinion on the merits of your claim.
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
