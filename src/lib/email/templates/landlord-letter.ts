// Temporary placeholder — letter design/content to be finalized separately.

export interface LandlordLetterEmailParams {
  caseId: string;
  letterNumber: number;
  letterBody: string;
  tenantName: string;
  landlordName: string;
  propertyAddress: string;
}

export function renderLandlordLetterEmail({
  letterBody,
  tenantName,
  landlordName,
  letterNumber,
}: LandlordLetterEmailParams): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; color: #0a0a08;">
  <p style="font-size: 12px; color: #6e6a5a; margin-bottom: 32px; border-bottom: 1px solid #d9d5cb; padding-bottom: 16px;">
    This correspondence is sent on behalf of our client, <strong>${tenantName}</strong>,
    by Tribune, a Connecticut tenant advocacy service.
  </p>

  <p>Dear ${landlordName},</p>

  <div style="white-space: pre-wrap; line-height: 1.7; font-size: 15px;">
${letterBody}
  </div>

  <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #d9d5cb; font-size: 12px; color: #6e6a5a;">
    <p>
      This letter was prepared and sent by Tribune on behalf of ${tenantName} regarding the property at ${letterNumber > 0 ? `(Letter ${letterNumber})` : ""}.
      Tribune is a legal-information and document-preparation service, not a law firm. This is not legal advice.
    </p>
    <p>To reply, respond directly to this email.</p>
  </div>
</body>
</html>
  `.trim();
}
