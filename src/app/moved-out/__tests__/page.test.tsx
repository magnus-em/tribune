import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import MovedOutPage from "../page";
import { STATUTE_DAMAGES_QUOTE, STATUTE_DEADLINE_QUOTE } from "@/lib/statute";

const normalize = (s: string) => s.replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();

describe("statute quotes", () => {
  // The page may restate only verified statute text. Guard that the quotes are
  // word-for-word what LEGAL_REVIEW_47a-21.md recorded.
  const review = normalize(
    fs.readFileSync(path.join(process.cwd(), "LEGAL_REVIEW_47a-21.md"), "utf8")
  );

  it("deadline quote matches the verified text", () => {
    expect(review).toContain(STATUTE_DEADLINE_QUOTE);
  });

  it("damages quote matches the verified text", () => {
    expect(review).toContain(STATUTE_DAMAGES_QUOTE);
  });
});

describe("/moved-out page", () => {
  const renderText = () => {
    const { container } = render(<MovedOutPage />);
    return container.textContent ?? "";
  };

  it("quotes the statute verbatim", () => {
    const text = renderText();
    expect(text).toContain(STATUTE_DEADLINE_QUOTE);
    expect(text).toContain(STATUTE_DAMAGES_QUOTE);
  });

  it("states the 21-day deadline, never 30", () => {
    const text = renderText();
    expect(text).toContain("21 days after the tenancy ends");
    expect(text).not.toMatch(/30[- ]day|thirty days/i);
  });

  it("carries the information-not-advice disclaimer", () => {
    render(<MovedOutPage />);
    expect(screen.getByTestId("disclaimer").textContent).toMatch(
      /not a law firm, and nothing on this page is legal advice/
    );
  });

  it("sends every call to action to the authenticated intake", () => {
    render(<MovedOutPage />);
    const ctas = screen.getAllByRole("link", { name: /free (case )?review|open a case/i });
    expect(ctas.length).toBeGreaterThanOrEqual(3);
    for (const a of ctas) {
      expect(a.getAttribute("href")).toBe("/login?next=/dashboard/new-case");
    }
  });

  it("speaks as Tribune, not we/us/our", () => {
    const text = renderText();
    expect(text).not.toMatch(/\b(we|we'll|we're|us|our)\b/i);
  });

  it("says nothing is sent without the tenant's approval", () => {
    expect(renderText()).toMatch(/approve it in the app before Tribune sends it/);
  });
});
