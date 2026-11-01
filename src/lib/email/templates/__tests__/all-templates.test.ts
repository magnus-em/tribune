/**
 * Invariants every outbound email template must hold (CLAUDE.md):
 * - the "information, not legal advice" disclaimer is visible;
 * - Tribune is the actor: no "we", "us", "our", "I", "the team", "the admin";
 * - user and database values are HTML-escaped, so a name, address, or message
 *   can't inject markup into an email Tribune sends;
 * - templates show only what they are given (no tenant email or phone leaks in
 *   through a template).
 */
import { renderCaseUpdateEmail } from "../case-update";
import { renderCaseDeclinedEmail } from "../case-declined";
import { renderCaseSubmittedEmail } from "../case-submitted";
import { renderInvoiceEmail } from "../invoice";
import { renderLandlordLetterEmail } from "../landlord-letter";
import {
  followUpAvailableMessage,
  followUpAvailableSubject,
  renderFollowUpAvailableEmail,
} from "../follow-up-available";
import { escapeHtml } from "@/lib/email/escape";

const SITE = "https://usetribune.org";
const CASE_ID = "123e4567-e89b-12d3-a456-426614174000";
const INJECTION = `<script>alert("x")</script><img src=x onerror=alert(1)>`;

/** A value that is safe to drop into any field: neutral, no first person. */
const NEUTRAL = "Sample text";

interface TemplateCase {
  name: string;
  /** Renders with every free-text field set to `value`. */
  render: (value: string) => string;
  /** Text the template itself is expected to show, for the disclaimer check. */
  tenantFacing: boolean;
}

const TEMPLATES: TemplateCase[] = [
  {
    name: "case-update",
    tenantFacing: true,
    render: (v) =>
      renderCaseUpdateEmail({
        tenantName: v,
        caseId: CASE_ID,
        messageTitle: v,
        messagePreview: v,
        siteUrl: SITE,
      }),
  },
  {
    name: "case-declined",
    tenantFacing: true,
    render: (v) =>
      renderCaseDeclinedEmail({
        tenantName: v,
        caseId: CASE_ID,
        declineMessage: v,
        siteUrl: SITE,
      }),
  },
  {
    name: "case-submitted",
    tenantFacing: true,
    render: (v) =>
      renderCaseSubmittedEmail({
        tenantName: v,
        caseId: CASE_ID,
        statutoryDeadline: v,
        siteUrl: SITE,
      }),
  },
  {
    name: "invoice",
    tenantFacing: true,
    render: (v) =>
      renderInvoiceEmail({
        tenantName: v,
        invoiceNumber: v,
        amountDollars: v,
        dueDate: v,
        caseId: CASE_ID,
        propertyAddress: v,
        recoveredDollars: v,
        contingencyPct: 15,
        paymentPhone: "2035550100",
        siteUrl: SITE,
      }),
  },
  {
    name: "follow-up-available",
    tenantFacing: true,
    render: (v) =>
      renderFollowUpAvailableEmail({
        tenantName: v,
        caseId: CASE_ID,
        letterNumber: 2,
        siteUrl: SITE,
      }),
  },
  {
    name: "follow-up-reminder",
    tenantFacing: true,
    render: (v) =>
      renderFollowUpAvailableEmail({
        tenantName: v,
        caseId: CASE_ID,
        letterNumber: 3,
        siteUrl: SITE,
        kind: "reminder",
      }),
  },
  {
    // The letter body is the tenant's own first-person demand, so it is
    // replaced with neutral text; the voice check covers Tribune's wrapper.
    name: "landlord-letter",
    tenantFacing: false,
    render: (v) =>
      renderLandlordLetterEmail({
        caseId: CASE_ID,
        letterNumber: 1,
        letterBody: v,
        tenantName: v,
        landlordName: v,
        propertyAddress: v,
      }),
  },
];

/** Visible text: strip tags, comments, and the <head>, decode a few entities. */
function visibleText(html: string): string {
  return html
    .replace(/<head>[\s\S]*?<\/head>/i, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

// First person or a hint at a person behind the service.
const NON_TRIBUNE_VOICE: RegExp[] = [
  /\bwe\b/i,
  /\bwe'(ll|re|ve|d)\b/i,
  /\bus\b/i,
  /\bour(s)?\b/i,
  /\bI\b/,
  /\bI'(m|ll|ve|d)\b/,
  /\bme\b/i,
  /\bmy\b/i,
  /\bthe team\b/i,
  /\bthe admin\b/i,
  /\bMagnus\b/i,
];

describe.each(TEMPLATES)("$name email template", ({ render, tenantFacing }) => {
  const html = render(NEUTRAL);
  const text = visibleText(html);

  test("carries the not-a-law-firm, not-legal-advice disclaimer", () => {
    expect(text).toMatch(/not a law firm/i);
    expect(text).toMatch(/does not provide legal advice/i);
    if (tenantFacing) {
      expect(text).toMatch(/Tribune/);
    }
  });

  test("keeps Tribune as the actor (no first person, no named operator)", () => {
    for (const pattern of NON_TRIBUNE_VOICE) {
      expect({ pattern: String(pattern), match: text.match(pattern)?.[0] ?? null }).toEqual({
        pattern: String(pattern),
        match: null,
      });
    }
  });

  test("escapes interpolated values", () => {
    const injected = render(INJECTION);
    expect(injected).not.toContain("<script>");
    expect(injected).not.toContain("<img");
    expect(injected).toContain(escapeHtml("<script>").slice(0, 10));
  });

  test("renders a complete HTML document", () => {
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("</html>");
  });

  test("shows no contact details it wasn't given", () => {
    // Templates get a name, never the tenant's email or phone.
    expect(html).not.toMatch(/[A-Za-z0-9._%+-]+@(?!usetribune\.org)[A-Za-z0-9.-]+\.[a-z]{2,}/);
  });
});

describe("case links", () => {
  test("case id is URL-encoded in the link", () => {
    const html = renderCaseUpdateEmail({
      tenantName: NEUTRAL,
      caseId: `x"><script>`,
      messageTitle: NEUTRAL,
      messagePreview: NEUTRAL,
      siteUrl: SITE,
    });
    expect(html).not.toContain(`x"><script>`);
    expect(html).toContain(`/dashboard/case/x%22%3E%3Cscript%3E`);
  });
});

describe("landlord letter", () => {
  test("letter text survives escaping unchanged when rendered", () => {
    const body = "Dear Landlord,\n\nUnder C.G.S. § 47a-21 & the lease, return $1,200.\n\nSincerely,\nA Tenant";
    const html = renderLandlordLetterEmail({
      caseId: CASE_ID,
      letterNumber: 1,
      letterBody: body,
      tenantName: "A Tenant",
      landlordName: "Landlord",
      propertyAddress: "1 Main St",
    });
    expect(html).toContain(escapeHtml(body));
    expect(visibleText(html)).toContain(body.replace(/\s+/g, " "));
  });
});

describe("follow-up subject and timeline message", () => {
  test("subject carries no tenant data and names Tribune", () => {
    for (const kind of ["available", "reminder"] as const) {
      const subject = followUpAvailableSubject(2, kind);
      expect(subject).toMatch(/Tribune$/);
      expect(subject).not.toMatch(/@|\d{3}.?\d{3}.?\d{4}/);
    }
  });

  test("timeline messages keep Tribune as the actor", () => {
    const now = new Date("2026-11-01T12:00:00Z");
    for (const kind of ["available", "reminder"] as const) {
      const { title, body } = followUpAvailableMessage(2, now, kind);
      for (const pattern of NON_TRIBUNE_VOICE) {
        expect(`${title} ${body}`).not.toMatch(pattern);
      }
    }
  });
});

describe("escapeHtml", () => {
  test("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
    );
  });
});
