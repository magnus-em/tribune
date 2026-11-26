import { render, screen } from "@testing-library/react";
import { CaseTimeline } from "@/components/case-timeline";
import { tenantDeadlineDisplay, DEADLINE_RULE_SUMMARY } from "@/lib/letters/deadline";

// CT § 47a-21(d): twenty-one days after termination of the tenancy, or fifteen
// days after the landlord receives the forwarding address in writing,
// whichever is later. The stored move-out + 21 date is not "the deadline"
// unless the forwarding-notice answer makes it so (BACKLOG Now #1d).
const caseRow = { move_out_date: "2026-06-01", statutory_deadline: "2026-06-22" };

const renderTimeline = (
  notice: Parameters<typeof tenantDeadlineDisplay>[1],
  today = "2026-06-10"
) =>
  render(
    <CaseTimeline
      messages={[]}
      actions={[]}
      moveOutDate="2026-06-01"
      deadline={tenantDeadlineDisplay(caseRow, notice)}
      today={today}
    />
  );

describe("CaseTimeline deadline milestone", () => {
  it("with no forwarding answer, labels move-out + 21 as the earliest possible deadline (21 days)", () => {
    renderTimeline(null);
    expect(screen.getByText("Earliest possible deadline (21 days after move-out)")).toBeTruthy();
    expect(screen.getByText(DEADLINE_RULE_SUMMARY)).toBeTruthy();
    expect(screen.queryByText(/^Statutory deadline/)).toBeNull();
    expect(screen.getByText("Jun 22, 2026")).toBeTruthy();
  });

  it("never shows the outdated 30-day figure", () => {
    const { container } = renderTimeline(null);
    expect(container.textContent).not.toMatch(/30 days/i);
  });

  it("with a later forwarding notice, shows the forwarding-branch date as the deadline", () => {
    renderTimeline({ answer: "date", notice_date: "2026-06-15" });
    expect(screen.getByText("Statutory deadline")).toBeTruthy();
    expect(screen.getByText("Jun 30, 2026")).toBeTruthy();
    expect(screen.queryByText("Jun 22, 2026")).toBeNull();
  });

  it("BACKLOG example: on 6/25 with notice 6/15, does not say the deadline passed", () => {
    const { container } = renderTimeline({ answer: "date", notice_date: "2026-06-15" }, "2026-06-25");
    expect(container.textContent).not.toMatch(/has passed/i);
  });

  it("says a known deadline has passed only after it", () => {
    const { container } = renderTimeline({ answer: "date", notice_date: "2026-06-15" }, "2026-07-01");
    expect(container.textContent).toMatch(/This deadline has passed\./);
  });

  it("never says an earliest-possible date has passed, or that the landlord failed", () => {
    const { container } = renderTimeline({ answer: "unknown", notice_date: null }, "2026-08-01");
    expect(container.textContent).not.toMatch(/has passed|failed/i);
  });
});
