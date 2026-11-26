import { renderCaseSubmittedEmail } from "../case-submitted";

// Now #1d: at submission Tribune doesn't know when the landlord received the
// forwarding address, so move-out + 21 is only the earliest the § 47a-21(d)
// deadline could be. The email must not call it "the deadline".
describe("case-submitted email deadline wording", () => {
  const html = renderCaseSubmittedEmail({
    tenantName: "Tenant",
    caseId: "case-1",
    earliestDeadline: "Jun 22, 2026",
    siteUrl: "https://usetribune.org",
  });

  it("labels the date as the earliest the deadline could be", () => {
    expect(html).toContain("Earliest your landlord's deadline could be");
    expect(html).toContain("Jun 22, 2026");
  });

  it("restates both (d) branches and 'whichever is later'", () => {
    expect(html).toMatch(/21 days after the tenancy ends/);
    expect(html).toMatch(/forwarding address in writing, whichever is later/);
  });

  it("drops the old 'legal deadline' label and the send-before promise", () => {
    expect(html).not.toMatch(/legal deadline/i);
    expect(html).not.toMatch(/before this date/i);
  });
});
