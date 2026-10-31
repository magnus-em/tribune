import { render, screen } from "@testing-library/react";
import { CaseTimeline } from "@/components/case-timeline";

// CT § 47a-21: the landlord has twenty-one days after termination of the tenancy.
describe("CaseTimeline statutory deadline label", () => {
  const renderTimeline = () =>
    render(
      <CaseTimeline
        messages={[]}
        actions={[]}
        moveOutDate="2026-06-01"
        statutoryDeadline="2026-06-22"
      />
    );

  it("labels the deadline as 21 days", () => {
    renderTimeline();
    expect(screen.getByText("Statutory deadline (21 days)")).toBeTruthy();
  });

  it("never shows the outdated 30-day figure", () => {
    const { container } = renderTimeline();
    expect(container.textContent).not.toMatch(/30 days/i);
  });
});
