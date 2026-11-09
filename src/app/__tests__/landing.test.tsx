import { render } from "@testing-library/react";
import LandingPage from "../page";

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
  }),
}));

beforeAll(() => {
  // jsdom has no IntersectionObserver; the page uses it for reveal animations.
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const renderText = () => {
  const { container } = render(<LandingPage />);
  return container.textContent ?? "";
};

describe("landing page", () => {
  it("speaks as Tribune, not we/us/our", () => {
    expect(renderText()).not.toMatch(/\b(we|we'll|we're|we've|us|our)\b/i);
  });

  it("states no unsourced durations or fee figures", () => {
    const text = renderText();
    expect(text).not.toMatch(/\d+\s*[–-]\s*\d+\s*weeks/i);
    expect(text).not.toMatch(/under \$\d+/i);
    expect(text).not.toMatch(/specialists/i);
  });

  it("states both deadline branches, never 30 days", () => {
    const text = renderText();
    expect(text).toContain("21 days after the tenancy ends");
    expect(text).toContain("15 days after receiving your written forwarding address, whichever is later");
    expect(text).not.toMatch(/30[- ]day|thirty days/i);
  });

  it("states the damages base as twice the deposit paid, not the amount withheld", () => {
    const text = renderText();
    expect(text).toContain("twice the amount of the security deposit paid");
    expect(text).not.toMatch(/twice the amount (wrongfully )?withheld/i);
  });

  it("cites no invented subsection numbers or case law", () => {
    const text = renderText();
    expect(text).not.toMatch(/§\s*\d\b/);
    expect(text).not.toMatch(/47a-21\s*\([a-ce-z]\)/);
    expect(text).not.toMatch(/\bv\.\s|Conn\. App\.|forfeit/i);
  });

  it("carries the information-not-advice disclaimer", () => {
    expect(renderText()).toMatch(/not a law firm, and nothing here is legal advice/);
  });
});
