import { format } from "date-fns";

export interface FollowUpAvailableEmailProps {
  tenantName: string;
  caseId: string;
  letterNumber: number;
  siteUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function followUpAvailableSubject(letterNumber: number): string {
  return `Letter ${letterNumber} is ready for your review — Tribune`;
}

/** In-app system message shown on the tenant's case timeline. */
export function followUpAvailableMessage(letterNumber: number, now: Date) {
  return {
    title: `Letter ${letterNumber} is ready for your review`,
    body: `As of ${format(now, "MMMM d, yyyy")}, Tribune has not recorded a reply from your landlord since the last letter, so Letter ${letterNumber} is available. Tribune sends it only if you read it and approve it on this page.`,
  };
}

/**
 * Transactional email to the tenant about their own case. It goes only to the
 * tenant, never to the landlord, and sends no letter.
 */
export function renderFollowUpAvailableEmail({
  tenantName,
  caseId,
  letterNumber,
  siteUrl,
}: FollowUpAvailableEmailProps): string {
  const caseUrl = `${siteUrl}/dashboard/case/${encodeURIComponent(caseId)}`;
  const firstName = escapeHtml(tenantName.trim().split(/\s+/)[0] || "there");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Letter ${letterNumber} is ready for your review</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #111827;">Letter ${letterNumber} is ready for your review</h2>
    <p>Hi ${firstName},</p>
    <p>Tribune has not recorded a reply from your landlord since the last letter, so Letter ${letterNumber} in Tribune's sequence is now available on your case page.</p>
    <p><strong>Nothing has been sent.</strong> Tribune sends Letter ${letterNumber} to your landlord only if you read it and approve it in the app.</p>
    <p>If your landlord has already replied to you or paid you directly, record that on your case page instead.</p>
    <p>
      <a href="${caseUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Review Letter ${letterNumber}
      </a>
    </p>
  </div>

  <div style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    <p><strong>Legal Information, Not Legal Advice</strong></p>
    <p style="margin-top: 8px;">
      Tribune is a tenant-advocacy and document-preparation service operating in Connecticut.
      Tribune is not a law firm and does not provide legal advice. Whether to send another
      letter is your decision.
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
