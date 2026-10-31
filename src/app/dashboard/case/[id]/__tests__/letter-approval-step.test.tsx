import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LetterApprovalStep } from "../_components";
import { APPROVAL_STATEMENT } from "@/lib/letters/approve-and-send";

const noop = async () => {};

describe("LetterApprovalStep", () => {
  it("renders nothing when the letter isn't offered", () => {
    const { container } = render(
      <LetterApprovalStep letterNumber={1} state={{ kind: "hidden" }} onApprove={noop} onSaveDetail={noop} />
    );
    expect(container.textContent).toBe("");
  });

  it("leaves a missing lease to the action banner", () => {
    const { container } = render(
      <LetterApprovalStep
        letterNumber={1}
        state={{ kind: "needs", need: "lease", message: "lease" }}
        onApprove={noop}
        onSaveDetail={noop}
      />
    );
    expect(container.textContent).toBe("");
  });

  it("shows the server letter and only approves after the box is ticked", async () => {
    const onApprove = jest.fn(noop);
    render(
      <LetterApprovalStep
        letterNumber={1}
        state={{ kind: "ready", title: "Demand Letter 1 — 1 Elm St", body: "SERVER LETTER TEXT" }}
        onApprove={onApprove}
        onSaveDetail={noop}
      />
    );
    expect(screen.getByText("SERVER LETTER TEXT")).toBeTruthy();
    expect(screen.getByText(APPROVAL_STATEMENT)).toBeTruthy();

    const button = screen.getByRole("button", { name: /approve & send/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(button);
    expect(onApprove).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("checkbox"));
    expect((button as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(button);
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("asks for a missing detail and saves it", async () => {
    const onSaveDetail = jest.fn(noop);
    render(
      <LetterApprovalStep
        letterNumber={1}
        state={{ kind: "needs", need: "forwarding_address", message: "Tribune needs your forwarding address." }}
        onApprove={noop}
        onSaveDetail={onSaveDetail}
      />
    );
    expect(screen.queryByRole("button", { name: /approve & send/i })).toBeNull();
    await userEvent.type(screen.getByLabelText("Your forwarding address"), "10 Oak St, Hartford, CT 06103");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSaveDetail).toHaveBeenCalledWith("forwarding_address", "10 Oak St, Hartford, CT 06103");
  });
});
