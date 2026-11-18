import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import Guide from "../page";
import {
  STATUTE_DAMAGES_QUOTE,
  STATUTE_DEADLINE_QUOTE,
  STATUTE_ITEMIZATION_QUOTE,
  STATUTE_SOURCES,
} from "@/lib/statute";
import { PUBLIC_ROUTES } from "@/lib/seo";

const normalize = (s: string) => s.replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
const review = normalize(
  fs.readFileSync(path.join(process.cwd(), "LEGAL_REVIEW_47a-21.md"), "utf8")
);

const renderText = () => {
  const { container } = render(<Guide />);
  return container.textContent ?? "";
};

/** Page text with the "not covered" list removed. */
const textOutsideNotCovered = () => {
  const { container } = render(<Guide />);
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelector('[data-testid="not-covered"]')?.remove();
  return clone.textContent ?? "";
};

describe("/guides/itemized-statement-of-damages-connecticut", () => {
  it("quotes the statute verbatim, and only text from the legal review", () => {
    const text = renderText();
    expect(review).toContain(STATUTE_DEADLINE_QUOTE);
    expect(review).toContain(STATUTE_DAMAGES_QUOTE);
    expect(STATUTE_DEADLINE_QUOTE).toContain(STATUTE_ITEMIZATION_QUOTE);
    expect(text).toContain(STATUTE_DEADLINE_QUOTE);
    expect(text).toContain(STATUTE_DAMAGES_QUOTE);
    expect(screen.getAllByTestId("itemization-quote")[0].textContent).toContain(
      STATUTE_ITEMIZATION_QUOTE
    );
  });

  it("every quoted statute phrase on a card appears in the verified text", () => {
    render(<Guide />);
    const titles = Array.from(
      screen.getByTestId("statute-words").querySelectorAll("h3")
    ).map((h) => (h.textContent ?? "").replace(/^“|”$/g, ""));
    expect(titles.length).toBeGreaterThanOrEqual(5);
    for (const t of titles) {
      for (const part of t.split(/\s*…\s*/).filter(Boolean)) {
        expect(STATUTE_DEADLINE_QUOTE).toContain(part);
      }
    }
  });

  it("states both deadline branches with 'whichever is later', never 30 days", () => {
    const text = renderText();
    expect(text).toContain("21 days after the tenancy ends");
    expect(text).toContain("15 days after the landlord receives written notification");
    expect(text).toMatch(/whichever of\s+these is later/);
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
    expect(text).not.toMatch(/attorney'?s fees|forfeit|small claims/i);
  });

  it("makes no claim about which charges count or what a statement must attach", () => {
    const text = textOutsideNotCovered();
    expect(text).not.toMatch(/wear and tear|cleaning|painting/i);
    // "a receipt" for the deposit paid (records) is fine; claims about what a
    // statement must attach are not.
    expect(text).not.toMatch(/\b(receipts|invoices?|estimates?|photos?)\b/i);
    expect(text).not.toMatch(/\b(is|are) (illegal|unlawful|void|invalid)\b|not deductible|never deductible/i);
    expect(text).not.toMatch(/you (are|'re) (owed|entitled)|you will (get|recover)/i);
    expect(text).toMatch(/does not say how detailed a statement must\s+be/);
    expect(text).toMatch(/Whether a statement complies\s+depends on the facts/);
  });

  it("lists what it does not cover", () => {
    render(<Guide />);
    const nc = screen.getByTestId("not-covered").textContent ?? "";
    expect(nc).toMatch(/Whether a particular statement complies/);
    expect(nc).toMatch(/How detailed/);
    expect(nc).toMatch(/wear and tear/);
    expect(nc).toMatch(/receipts/);
    expect(nc).toMatch(/interest rate/);
    expect(nc).toMatch(/court decisions/);
  });

  it("links the authoritative sources", () => {
    render(<Guide />);
    const links = Array.from(screen.getByTestId("sources").querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(links).toEqual(STATUTE_SOURCES.map((s) => s.href));
  });

  it("links the deadline calculator and the other guides", () => {
    render(<Guide />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/tools/deposit-deadline");
    expect(hrefs).toContain("/guides/connecticut-security-deposit-law");
    expect(hrefs).toContain("/guides/landlord-kept-security-deposit-connecticut");
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
    expect(text).not.toMatch(/\byou should\b|\bwe recommend\b|\byou must\b|\bkeep the\b/i);
  });

  it("sends calls to action to the authenticated intake", () => {
    render(<Guide />);
    const ctas = screen.getAllByRole("link", { name: /free (case )?review|open a case/i });
    expect(ctas.length).toBeGreaterThanOrEqual(2);
    for (const a of ctas) expect(a.getAttribute("href")).toBe("/login?next=/dashboard/new-case");
  });

  it("is in the sitemap", () => {
    expect(PUBLIC_ROUTES.map((r) => r.path)).toContain(
      "/guides/itemized-statement-of-damages-connecticut"
    );
  });
});
