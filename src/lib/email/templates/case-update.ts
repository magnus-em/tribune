export interface CaseUpdateEmailProps {
  tenantName: string;
  caseId: string;
  messageTitle: string;
  messagePreview: string;
  siteUrl: string;
}

export function renderCaseUpdateEmail({
  tenantName,
  caseId,
  messageTitle,
  messagePreview,
  siteUrl,
}: CaseUpdateEmailProps): string {
  const caseUrl = `${siteUrl}/dashboard/case/${caseId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Update on Your Case</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #111827;">New Update on Your Case</h2>
    <p>Hi ${tenantName},</p>
    <p>There's a new update on your security deposit case:</p>

    <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
      <h3 style="margin-top: 0; font-size: 16px; color: #1f2937;">${messageTitle}</h3>
      <p style="margin-bottom: 0; color: #6b7280;">${messagePreview}</p>
    </div>

    <p>
      <a href="${caseUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Full Update
      </a>
    </p>
  </div>

  <div style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    <p><strong>Legal Information, Not Legal Advice</strong></p>
    <p style="margin-top: 8px;">
      Tribune provides information about Connecticut tenant rights and helps you prepare documents.
      We are not a law firm and do not provide legal advice. You are responsible for reviewing and
      signing all correspondence.
    </p>
    <p style="margin-top: 16px;">
      — Tribune<br>
      <a href="${siteUrl}" style="color: #3b82f6; text-decoration: none;">${siteUrl.replace('https://', '')}</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
