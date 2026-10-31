import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import Guide from "../page";
import { STATUTE_DAMAGES_QUOTE, STATUTE_DEADLINE_QUOTE, STATUTE_SOURCES } from "@/lib/statute";

const normalize = (s: string) => s.replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
const review = normalize(
  fs.readFileSync(path.join(process.cwd(), "LEGAL_REVIEW_47a-21.md"), "utf8")
);

const renderText = () => {
  const { container } = render(<Guide />);
  return container.textContent ?? "";
};

describe("/guides/connecticut-security-deposit-law", () => {
  it("quotes the statute verbatim, and only text from the legal review", () => {
    const text = renderText();
    expect(review).toContain(STATUTE_DEADLINE_QUOTE);
    expect(review).toContain(STATUTE_DAMAGES_QUOTE);
    expect(text).toContain(STATUTE_DEADLINE_QUOTE);
    expect(text).toContain(STATUTE_DAMAGES_QUOTE);
  });

  it("states both deadline branches with 'whichever is later', never 30 days", () => {
    const text = renderText();
    expect(text).toContain("21 days after the tenancy ends");
    expect(text).toContain("15 days after the landlord receives written notification");
    expect(text).toMatch(/whichever of these is\s+later/);
    expect(text).not.toMatch(/30[- ]day|thirty days/i);
  });

  it("states the damages base as twice the deposit paid, not the amount withheld", () => {
    const text = renderText();
    expect(text).toContain("twice the amount of the security deposit the tenant paid");
    expect(text).toContain("ten dollars or twice the accrued interest, whichever is greater");
    expect(text).not.toMatch(/twice the amount (wrongfully )?withheld/i);
  });

  it("cites no subsection other than (d) and no case law", () => {
    const text = renderText();
    const subsections = text.match(/47a-21\s*\(([a-z])\)/g) ?? [];
    for (const s of subsections) expect(s).toMatch(/\(d\)$/);
    expect(text).not.toMatch(/\bv\.\s|Conn\. App\.|A\.\d?d\b/);
    expect(text).not.toMatch(/attorney'?s fees|forfeit/i);
  });

  it("lists what it does not cover", () => {
    render(<Guide />);
    const nc = screen.getByTestId("not-covered").textContent ?? "";
    expect(nc).toMatch(/interest rate/);
    expect(nc).toMatch(/Court decisions/);
  });

  it("links the authoritative sources", () => {
    render(<Guide />);
    const links = Array.from(screen.getByTestId("sources").querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(links).toEqual(STATUTE_SOURCES.map((s) => s.href));
  });

  it("carries the information-not-advice disclaimer", () => {
    render(<Guide />);
    expect(screen.getByTestId("disclaimer").textContent).toMatch(
      /not a law firm, and nothing on this page is legal advice/
    );
  });

  it("speaks as Tribune, not we/us/our, and gives no advice", () => {
    const text = renderText();
    expect(text).not.toMatch(/\b(we|we'll|we're|us|our)\b/i);
    expect(text).not.toMatch(/\byou should\b|\bwe recommend\b|\byou must\b/i);
  });

  it("sends calls to action to the authenticated intake", () => {
    render(<Guide />);
    const ctas = screen.getAllByRole("link", { name: /free (case )?review|open a case/i });
    expect(ctas.length).toBeGreaterThanOrEqual(2);
    for (const a of ctas) expect(a.getAttribute("href")).toBe("/login?next=/dashboard/new-case");
  });
});
