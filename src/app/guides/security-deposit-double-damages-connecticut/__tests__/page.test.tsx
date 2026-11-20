import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import Guide from "../page";
import { STATUTE_DAMAGES_QUOTE, STATUTE_DEADLINE_QUOTE, STATUTE_SOURCES } from "@/lib/statute";
import { PUBLIC_ROUTES } from "@/lib/seo";

const normalize = (s: string) => s.replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
const review = normalize(
  fs.readFileSync(path.join(process.cwd(), "LEGAL_REVIEW_47a-21.md"), "utf8")
);
const flat = (s: string) => s.replace(/\s+/g, " ");

const renderText = () => {
  const { container } = render(<Guide />);
  return flat(container.textContent ?? "");
};

/** Page text with the "not covered" list removed. */
const textOutsideNotCovered = () => {
  const { container } = render(<Guide />);
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelector('[data-testid="not-covered"]')?.remove();
  return flat(clone.textContent ?? "");
};

describe("/guides/security-deposit-double-damages-connecticut", () => {
  it("quotes the statute verbatim, and only text from the legal review", () => {
    const text = renderText();
    expect(review).toContain(STATUTE_DAMAGES_QUOTE);
    expect(review).toContain(STATUTE_DEADLINE_QUOTE);
    expect(screen.getAllByTestId("damages-quote")[0].textContent).toContain(STATUTE_DAMAGES_QUOTE);
    expect(text).toContain(STATUTE_DEADLINE_QUOTE);
  });

  it("every quoted phrase on a card is a verbatim fragment of the liability sentence", () => {
    render(<Guide />);
    const titles = Array.from(screen.getByTestId("statute-phrases").querySelectorAll("h3")).map((h) =>
      (h.textContent ?? "").replace(/^“|”$/g, "")
    );
    expect(titles.length).toBe(5);
    for (const t of titles) expect(STATUTE_DAMAGES_QUOTE).toContain(t);
  });

  it("measures the figure against the deposit paid, never the amount withheld", () => {
    const text = renderText();
    expect(text).toContain("twice the amount of any security deposit paid by such tenant");
    expect(text).toMatch(/measure the first figure against the deposit paid, not against the amount the landlord kept/);
    expect(text).not.toMatch(/twice the amount (wrongfully )?(withheld|kept)/i);
  });

  it("does the deposit arithmetic correctly ($1,400 → $2,800)", () => {
    render(<Guide />);
    const t = flat(screen.getByTestId("example-deposit").textContent ?? "");
    expect(t).toContain("Security deposit paid: $1,400.00");
    expect(t).toContain("Twice that amount is $2,800.00");
  });

  it("applies 'ten dollars or twice the interest, whichever is greater' both ways", () => {
    render(<Guide />);
    const items = screen.getAllByTestId("example-interest").map((e) => flat(e.textContent ?? ""));
    expect(items).toHaveLength(2);
    // $3 interest: twice is $6, ten dollars is greater.
    expect(items[0]).toContain("accrued interest is $3.00");
    expect(items[0]).toContain("greater of ten dollars and $6.00 is $10.00");
    // $8 interest: twice is $16, which is greater than ten dollars.
    expect(items[1]).toContain("accrued interest is $8.00");
    expect(items[1]).toContain("greater of ten dollars and $16.00 is $16.00");
  });

  it("labels the figures as illustrative, not drawn from a case", () => {
    const text = renderText();
    expect(text).toMatch(/made up to show the arithmetic/);
    expect(text).toMatch(/not drawn from any case/);
  });

  it("states both deadline branches with 'whichever is later', never 30 days", () => {
    const text = renderText();
    expect(text).toContain("21 days after the tenancy ends");
    expect(text).toContain("15 days after the landlord receives written notification");
    expect(text).toMatch(/whichever of these is later/);
    expect(text).not.toMatch(/30[- ]day|thirty days/i);
  });

  it("cites no subsection other than (d) and no case law or extra remedies", () => {
    const text = renderText();
    const subsections = text.match(/47a-21\s*\(([a-z])\)/g) ?? [];
    for (const s of subsections) expect(s).toMatch(/\(d\)$/);
    expect(text).not.toMatch(/\bv\.\s|Conn\. App\.|A\.\d?d\b/);
    expect(text).not.toMatch(/attorney'?s fees|forfeit|small claims|treble|punitive/i);
  });

  it("makes no liability conclusion or recovery promise outside the not-covered list", () => {
    const disclaimed =
      "The verified statute text does not say whether amounts already returned are subtracted, or how a court computes an award";
    const all = textOutsideNotCovered();
    expect(all).toContain(disclaimed);
    // The only mention of subtraction is the sentence saying the text is silent on it.
    const text = all.replace(disclaimed, "");
    expect(text).not.toMatch(/good faith|subtract|offset|credit/i);
    expect(text).not.toMatch(/you (are|'re) (owed|entitled)|you will (get|recover|receive)|you can (get|recover|sue)/i);
    expect(text).not.toMatch(/\b(is|are) (illegal|unlawful)\b|automatically/i);
    expect(text).toMatch(/Whether either figure applies depends on the facts of each case/);
  });

  it("lists what it does not cover, including the case-law questions the legal review flags", () => {
    render(<Guide />);
    const nc = flat(screen.getByTestId("not-covered").textContent ?? "");
    expect(nc).toMatch(/violated the subsection, or is liable/);
    expect(nc).toMatch(/already returned are subtracted/);
    expect(nc).toMatch(/good faith/);
    expect(nc).toMatch(/computes an award/);
    expect(nc).toMatch(/Court procedure/);
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
    expect(hrefs).toContain("/guides/itemized-statement-of-damages-connecticut");
    expect(hrefs).toContain("/guides/security-deposit-forwarding-address-connecticut");
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

  it("is in the sitemap", () => {
    expect(PUBLIC_ROUTES.map((r) => r.path)).toContain(
      "/guides/security-deposit-double-damages-connecticut"
    );
  });
});
