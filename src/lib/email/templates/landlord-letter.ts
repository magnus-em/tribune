// Outbound demand-letter email sent to the landlord.
//
// Framing note (legal posture for MVP — verify with CT counsel before scaling):
// The demand BODY is the tenant's own, in the tenant's first-person voice, and is
// signed by the tenant. Tribune is presented as the tenant's authorized
// communications agent (the debt-negotiator posture), NOT as counsel. We never
// say "our client" and never assert that Tribune itself is enforcing the law —
// the legal position belongs to the tenant, who is asserting their own statutory
// rights pro se. Tribune is the conduit. This keeps us out of "our client"
// attorney language while still looking organized and competent.

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
  propertyAddress,
}: LandlordLetterEmailParams): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; color: #0a0a08; background: #ffffff;">

  <!-- Tribune masthead -->
  <table width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="font-family: Georgia, serif; font-size: 20px; font-weight: 700; letter-spacing: 0.02em; color: #0a0a08;">
        TRIBUNE
      </td>
      <td style="text-align: right; font-size: 11px; color: #6e6a5a; letter-spacing: 0.04em;">
        Connecticut Tenant Advocacy &amp; Deposit Recovery
      </td>
    </tr>
  </table>

  <!-- Authorization / agency notice -->
  <div style="font-size: 13px; line-height: 1.65; color: #44413a; border-top: 2px solid #0a0a08; border-bottom: 1px solid #d9d5cb; padding: 16px 0; margin-bottom: 28px;">
    <p style="margin: 0 0 10px 0;">
      Tribune sends this correspondence on behalf of <strong>${tenantName}</strong>,
      tenant of <strong>${propertyAddress}</strong>, regarding the return of their
      security deposit under Connecticut General Statutes &sect; 47a-21. Tribune
      is authorized to manage all communications on this matter.
    </p>
    <p style="margin: 0;">
      Direct your reply to this email address. The demand set out below is made
      by ${tenantName}.
    </p>
  </div>

  <!-- The tenant's letter, verbatim -->
  <div style="white-space: pre-wrap; line-height: 1.7; font-size: 15px; color: #0a0a08;">
${letterBody}
  </div>

  <!-- Footer -->
  <div style="margin-top: 44px; padding-top: 16px; border-top: 1px solid #d9d5cb; font-size: 11px; line-height: 1.6; color: #6e6a5a;">
    <p style="margin: 0 0 8px 0;">
      Tribune prepared and transmitted this letter at the direction of and on behalf of
      ${tenantName}, and is authorized to receive correspondence regarding this matter.
      Tribune is a tenant-advocacy and document-preparation service, not a law firm, and
      does not provide legal advice.
    </p>
    <p style="margin: 0;">To respond, reply directly to this email.</p>
  </div>
</body>
</html>
  `.trim();
}
