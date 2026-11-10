import fs from "fs";
import path from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import Page from "../page";
import { STATUTE_DEADLINE_QUOTE, STATUTE_SOURCES } from "@/lib/statute";

const normalize = (s: string) => s.replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
const review = normalize(fs.readFileSync(path.join(process.cwd(), "LEGAL_REVIEW_47a-21.md"), "utf8"));

const setDate = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("/tools/deposit-deadline", () => {
  it("quotes the verified deadline text verbatim", () => {
    const { container } = render(<Page />);
    expect(review).toContain(STATUTE_DEADLINE_QUOTE);
    expect(container.textContent).toContain(STATUTE_DEADLINE_QUOTE);
  });

  it("shows no result until a tenancy end date is entered", () => {
    render(<Page />);
    expect(screen.queryByTestId("deadline-result")).toBeNull();
  });

  it("computes tenancy end + 21 and labels it the earliest possible deadline without a forwarding date", () => {
    render(<Page />);
    setDate(/tenancy end/i, "2026-08-31");
    const result = screen.getByTestId("deadline-result").textContent ?? "";
    expect(screen.getByTestId("deadline-date").textContent).toBe("Monday, September 21, 2026");
    expect(result).toMatch(/Earliest possible deadline/);
    expect(result).toMatch(/after Sunday, September 6, 2026/);
  });

  it("moves the deadline to the forwarding-address branch when it is later", () => {
    render(<Page />);
    setDate(/tenancy end/i, "2026-08-31");
    setDate(/forwarding address in writing/i, "2026-09-20");
    expect(screen.getByTestId("deadline-date").textContent).toBe("Monday, October 5, 2026");
    expect(screen.getByTestId("deadline-explanation").textContent).toMatch(/15-day clock from the forwarding address/);
  });

  it("does not tell the tenant whether the landlord violated the statute", () => {
    const { container } = render(<Page />);
    setDate(/tenancy end/i, "2020-01-01");
    const text = container.textContent ?? "";
    expect(text).toMatch(/That date was \d+ days ago/);
    expect(text).not.toMatch(/landlord (is|was) (late|in violation)|missed the deadline|you are owed|entitled to/i);
  });

  it("cites only subsection (d), no case law, no 30-day rule, no first person", () => {
    const { container } = render(<Page />);
    setDate(/tenancy end/i, "2026-08-31");
    const text = container.textContent ?? "";
    for (const m of text.match(/47a-21\s*\(([a-z])\)/g) ?? []) expect(m).toMatch(/\(d\)$/);
    expect(text).not.toMatch(/\bv\.\s|Conn\. App\.|attorney'?s fees|forfeit/i);
    expect(text).not.toMatch(/30[- ]day|thirty days/i);
    expect(text).not.toMatch(/\b(we|we're|we'll|us|our|I)\b/);
  });

  it("states its limits, links sources, and carries the disclaimer", () => {
    render(<Page />);
    const limits = screen.getByTestId("limits").textContent ?? "";
    expect(limits).toMatch(/calendar days/);
    expect(limits).toMatch(/does not say whether a landlord complied/);
    const links = Array.from(screen.getByTestId("sources").querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(links).toEqual(STATUTE_SOURCES.map((s) => s.href));
    expect(screen.getByTestId("disclaimer").textContent).toMatch(/not a law firm, and nothing on this page is legal advice/);
  });
});
