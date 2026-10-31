import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LetterApprovalStep } from "../_components";
import { APPROVAL_STATEMENT, RESIDENTIAL_STATEMENT } from "@/lib/letters/approve-and-send";

const noop = async () => {};

describe("LetterApprovalStep", () => {
  it("renders nothing when the letter isn't offered", () => {
    const { container } = render(
      <LetterApprovalStep letterNumber={1} state={{ kind: "hidden" }} onApprove={noop} onSaveDetail={noop} onConfirmResidential={noop} />
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
        onConfirmResidential={noop}
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
        onConfirmResidential={noop}
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
        onConfirmResidential={noop}
      />
    );
    expect(screen.queryByRole("button", { name: /approve & send/i })).toBeNull();
    await userEvent.type(screen.getByLabelText("Your forwarding address"), "10 Oak St, Hartford, CT 06103");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSaveDetail).toHaveBeenCalledWith("forwarding_address", "10 Oak St, Hartford, CT 06103");
  });

  it("shows when a follow-up letter becomes available, with no way to send it", () => {
    render(
      <LetterApprovalStep
        letterNumber={2}
        state={{ kind: "waiting", message: "Letter 2 becomes available on November 3, 2026." }}
        onApprove={noop}
        onSaveDetail={noop}
        onConfirmResidential={noop}
      />
    );
    expect(screen.getByText(/Letter 2 becomes available on November 3, 2026\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /approve & send/i })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("labels a ready follow-up with its letter number", () => {
    render(
      <LetterApprovalStep
        letterNumber={3}
        state={{ kind: "ready", title: "Demand Letter 3 — 1 Elm St", body: "FINAL" }}
        onApprove={noop}
        onSaveDetail={noop}
        onConfirmResidential={noop}
      />
    );
    expect(screen.getByText("Approve Letter 3")).toBeTruthy();
  });

  it("asks to confirm a residential tenancy and only confirms after the box is ticked", async () => {
    const onConfirmResidential = jest.fn(noop);
    render(
      <LetterApprovalStep
        letterNumber={1}
        state={{ kind: "needs", need: "residential", message: "Tribune serves residential tenants only." }}
        onApprove={noop}
        onSaveDetail={noop}
        onConfirmResidential={onConfirmResidential}
      />
    );
    expect(screen.queryByRole("button", { name: /approve & send/i })).toBeNull();
    const button = screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await userEvent.click(button);
    expect(onConfirmResidential).not.toHaveBeenCalled();
    await userEvent.click(screen.getByLabelText(RESIDENTIAL_STATEMENT));
    expect(button.disabled).toBe(false);
    await userEvent.click(button);
    expect(onConfirmResidential).toHaveBeenCalledTimes(1);
  });
});
