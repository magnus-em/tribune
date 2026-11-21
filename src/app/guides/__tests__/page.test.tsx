import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import GuidesIndex from "../page";
import { GUIDES, TOOLS } from "@/lib/guides";
import { PUBLIC_ROUTES } from "@/lib/seo";

const appDir = path.join(process.cwd(), "src", "app");
const flat = (s: string) => s.replace(/\s+/g, " ");

describe("/guides", () => {
  it("lists every guide route under src/app/guides", () => {
    const dirs = fs
      .readdirSync(path.join(appDir, "guides"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(appDir, "guides", d.name, "page.tsx")))
      .map((d) => `/guides/${d.name}`)
      .sort();
    expect(GUIDES.map((g) => g.href).sort()).toEqual(dirs);
  });

  it("links only real public pages that are in the sitemap", () => {
    const sitemapPaths = PUBLIC_ROUTES.map((r) => r.path);
    expect(sitemapPaths).toContain("/guides");
    for (const { href } of [...GUIDES, ...TOOLS]) {
      expect(fs.existsSync(path.join(appDir, href, "page.tsx"))).toBe(true);
      expect(sitemapPaths).toContain(href);
    }
  });

  it("renders a card for each guide and tool", () => {
    render(<GuidesIndex />);
    const hrefs = (id: string) =>
      Array.from(screen.getByTestId(id).querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs("guide-list")).toEqual(GUIDES.map((g) => g.href));
    expect(hrefs("tool-list")).toEqual(TOOLS.map((t) => t.href));
  });

  it("carries the not-legal-advice disclaimer", () => {
    render(<GuidesIndex />);
    expect(screen.getByTestId("disclaimer").textContent).toMatch(/not a law firm, and nothing on this page is legal advice/);
  });

  it("speaks as Tribune, and makes no legal claim of its own", () => {
    const { container } = render(<GuidesIndex />);
    const text = flat(container.textContent ?? "");
    expect(text).not.toMatch(/\b(we|we're|we'll|us|our|I|the team|the admin|Magnus)\b/);
    // Descriptions point at the statute; they don't assert outcomes or advice.
    expect(text).not.toMatch(/\b(entitled|you should|you must|you will (get|recover)|guarantee)/i);
    expect(text).not.toMatch(/wear and tear|attorney'?s fees|interest rate is/i);
  });
});
