import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandlordReplyStep } from "../_components";

const reply = {
  title: "Re: Security deposit",
  body: "From: landlord@example.com\n\nWe kept the deposit for cleaning.",
  created_at: "2026-10-23T12:00:00.000Z",
};

describe("LandlordReplyStep", () => {
  it("shows the reply and the recovery option", () => {
    render(<LandlordReplyStep reply={reply} nextLetter={{ kind: "none" }} reviewing={false} onReviewLetter={() => {}} />);
    expect(screen.getByText(/We kept the deposit for cleaning/)).toBeTruthy();
    expect(screen.getByText(/report it in/)).toBeTruthy();
    expect(screen.getByText(/information, not legal advice/)).toBeTruthy();
  });

  it("offers to review the next letter, and reviewing sends nothing by itself", async () => {
    const onReview = jest.fn();
    render(
      <LandlordReplyStep reply={reply} nextLetter={{ kind: "offered", letterNumber: 2 }} reviewing={false} onReviewLetter={onReview} />
    );
    expect(screen.getByText(/only if you approve it/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /Review Letter 2/ }));
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /send/i })).toBeNull();
  });

  it("hides the review button once the letter is open", () => {
    render(
      <LandlordReplyStep reply={reply} nextLetter={{ kind: "offered", letterNumber: 2 }} reviewing onReviewLetter={() => {}} />
    );
    expect(screen.queryByRole("button", { name: /Review Letter 2/ })).toBeNull();
  });

  it("says when the next letter becomes available during the cooldown", () => {
    render(
      <LandlordReplyStep
        reply={reply}
        nextLetter={{ kind: "waiting", letterNumber: 2, message: "Letter 2 becomes available on November 3, 2026." }}
        reviewing={false}
        onReviewLetter={() => {}}
      />
    );
    expect(screen.getByText("Letter 2 becomes available on November 3, 2026.")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says Tribune is reviewing when no letter is offered, in Tribune's voice", () => {
    const { container } = render(
      <LandlordReplyStep reply={reply} nextLetter={{ kind: "none" }} reviewing={false} onReviewLetter={() => {}} />
    );
    expect(screen.getByText(/Tribune is reviewing the reply/)).toBeTruthy();
    expect(container.textContent).not.toMatch(/\b(we|our|us|I)\b/);
  });
});
