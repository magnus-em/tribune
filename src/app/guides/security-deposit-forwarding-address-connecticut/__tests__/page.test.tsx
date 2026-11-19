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

describe("/guides/security-deposit-forwarding-address-connecticut", () => {
  it("quotes the statute verbatim, and only text from the legal review", () => {
    const text = renderText();
    expect(review).toContain(STATUTE_DEADLINE_QUOTE);
    expect(review).toContain(STATUTE_DAMAGES_QUOTE);
    expect(screen.getAllByTestId("deadline-quote")[0].textContent).toContain(STATUTE_DEADLINE_QUOTE);
    expect(text).toContain(STATUTE_DAMAGES_QUOTE);
  });

  it("every quoted statute phrase on a card is verbatim from the verified text", () => {
    render(<Guide />);
    const titles = Array.from(
      screen.getByTestId("statute-words").querySelectorAll("h3")
    ).map((h) => (h.textContent ?? "").replace(/^“|”$/g, ""));
    expect(titles.length).toBeGreaterThanOrEqual(4);
    for (const t of titles) expect(STATUTE_DEADLINE_QUOTE).toContain(t);
    expect(titles).toContain(
      "fifteen days after receiving written notification of such tenant's forwarding address"
    );
    expect(titles).toContain("at such forwarding address");
  });

  it("states both deadline branches with 'whichever is later', never 30 days", () => {
    const text = renderText();
    expect(text).toContain("21 days after the tenancy ends");
    expect(text).toContain("15 days after the landlord receives written notification");
    expect(text).toMatch(/whichever of these is\s+later/);
    expect(text).not.toMatch(/30[- ]day|thirty days/i);
  });

  it("worked examples: the later branch wins, in calendar days", () => {
    render(<Guide />);
    const ex = screen.getByTestId("examples").textContent ?? "";
    // Tenancy ends May 31, 2026 → 21-day clock June 21.
    // Notice May 25 → 15-day clock June 9 → deadline June 21 (21-day clock).
    expect(ex).toMatch(
      /receives the written notice May 25, 2026\..*21-day clock: June 21, 2026\..*15-day clock: June 9, 2026\. The later date, June 21, 2026, is the deadline\./
    );
    // Notice June 15 → 15-day clock June 30 → deadline June 30 (forwarding clock).
    expect(ex).toMatch(
      /receives the written notice June 15, 2026\..*15-day clock: June 30, 2026\. The later date, June 30, 2026, is the deadline\./
    );
    // Crossover: May 31 + 21 − 15 = June 6.
    expect(screen.getByTestId("crossover").textContent).toMatch(
      /notice received after June 6, 2026 sets a deadline later than June 21, 2026/
    );
    expect(renderText()).toMatch(/calendar\s+days, not adjusted for weekends or holidays/);
  });

  it("never says an earlier notice shortens the deadline", () => {
    const text = renderText();
    expect(text).toMatch(/does not\s+move it earlier than 21 days after the tenancy ends/);
    expect(text).not.toMatch(/deadline (is|becomes) shorter|shortens the deadline/i);
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

  it("makes no claim about the form, method, or absence of the notice", () => {
    const text = textOutsideNotCovered();
    expect(text).not.toMatch(/certified|email|e-mail|text message|move-out form/i);
    expect(text).not.toMatch(/never (starts|runs)|no forwarding address|clock (never|doesn'?t) start/i);
    expect(text).not.toMatch(/\b(is|are) (illegal|unlawful|void|invalid)\b/i);
    expect(text).not.toMatch(/you (are|'re) (owed|entitled)|you will (get|recover)/i);
    expect(text).toMatch(/does not say what form the written\s+notification takes or how it is sent/);
  });

  it("lists what it does not cover", () => {
    render(<Guide />);
    const nc = screen.getByTestId("not-covered").textContent ?? "";
    expect(nc).toMatch(/What counts as “written notification”/);
    expect(nc).toMatch(/certified mail/);
    expect(nc).toMatch(/How receipt of the notice is shown/);
    expect(nc).toMatch(/no forwarding address is given/);
    expect(nc).toMatch(/How days are counted/);
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
    expect(text).not.toMatch(/\byou should\b|\bwe recommend\b|\byou must\b|\bkeep the\b|\bmake sure\b/i);
  });

  it("sends calls to action to the authenticated intake", () => {
    render(<Guide />);
    const ctas = screen.getAllByRole("link", { name: /free (case )?review|open a case/i });
    expect(ctas.length).toBeGreaterThanOrEqual(2);
    for (const a of ctas) expect(a.getAttribute("href")).toBe("/login?next=/dashboard/new-case");
  });

  it("is in the sitemap", () => {
    expect(PUBLIC_ROUTES.map((r) => r.path)).toContain(
      "/guides/security-deposit-forwarding-address-connecticut"
    );
  });
});
