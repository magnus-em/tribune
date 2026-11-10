import fs from "fs";
import path from "path";
import {
  FORWARDING_ADDRESS_DAYS,
  computeDepositDeadline,
  daysUntil,
  formatLongDate,
} from "@/lib/deadline-calculator";
import { STATUTE_DAYS } from "@/lib/constants";

// Legal invariant: the day counts come from the verified § 47a-21(d) text.
const review = fs.readFileSync(path.join(process.cwd(), "LEGAL_REVIEW_47a-21.md"), "utf8");

const ok = (r: ReturnType<typeof computeDepositDeadline>) => {
  if (!r.ok) throw new Error(r.error);
  return r;
};

describe("computeDepositDeadline (§ 47a-21(d))", () => {
  it("uses 21 and 15 days, as the verified statute text says", () => {
    expect(STATUTE_DAYS).toBe(21);
    expect(FORWARDING_ADDRESS_DAYS).toBe(15);
    expect(review).toContain(
      "Not later than twenty-one days after termination of a tenancy or fifteen days"
    );
    expect(review).toMatch(/forwarding address,\s+whichever is later/);
  });

  it("with no forwarding date, gives tenancy end + 21 as the earliest deadline", () => {
    const r = ok(computeDepositDeadline({ tenancy_end_date: "2026-08-31" }));
    expect(r.deadline).toBe("2026-09-21");
    expect(r.tenancy_branch_date).toBe("2026-09-21");
    expect(r.forwarding_branch_date).toBeNull();
    expect(r.forwarding_unknown).toBe(true);
    expect(r.controlling).toBe("tenancy");
    // A notice received after Sept 6 makes 15 days land after Sept 21.
    expect(r.forwarding_later_after).toBe("2026-09-06");
  });

  it("treats a blank forwarding date as unknown", () => {
    const r = ok(computeDepositDeadline({ tenancy_end_date: "2026-08-31", forwarding_address_received_date: "  " }));
    expect(r.forwarding_unknown).toBe(true);
  });

  it("takes the later branch when the forwarding address arrives late", () => {
    const r = ok(
      computeDepositDeadline({ tenancy_end_date: "2026-08-31", forwarding_address_received_date: "2026-09-20" })
    );
    expect(r.forwarding_branch_date).toBe("2026-10-05");
    expect(r.deadline).toBe("2026-10-05");
    expect(r.controlling).toBe("forwarding");
    expect(r.forwarding_unknown).toBe(false);
  });

  it("keeps the 21-day branch when the forwarding address arrives early", () => {
    const r = ok(
      computeDepositDeadline({ tenancy_end_date: "2026-08-31", forwarding_address_received_date: "2026-08-25" })
    );
    expect(r.forwarding_branch_date).toBe("2026-09-09");
    expect(r.deadline).toBe("2026-09-21");
    expect(r.controlling).toBe("tenancy");
  });

  it("reports both when the branches land on the same day", () => {
    const r = ok(
      computeDepositDeadline({ tenancy_end_date: "2026-08-31", forwarding_address_received_date: "2026-09-06" })
    );
    expect(r.deadline).toBe("2026-09-21");
    expect(r.controlling).toBe("both");
  });

  it("never returns a deadline earlier than tenancy end + 21", () => {
    for (const fwd of ["2026-01-01", "2026-06-15", "2026-06-30", "2026-07-20", "2026-12-31"]) {
      const r = ok(computeDepositDeadline({ tenancy_end_date: "2026-06-30", forwarding_address_received_date: fwd }));
      expect(r.deadline >= "2026-07-21").toBe(true);
      expect(r.deadline >= (r.forwarding_branch_date ?? "")).toBe(true);
    }
  });

  it("counts calendar days across month, year, leap-day, and DST boundaries", () => {
    expect(ok(computeDepositDeadline({ tenancy_end_date: "2026-12-20" })).deadline).toBe("2027-01-10");
    expect(ok(computeDepositDeadline({ tenancy_end_date: "2028-02-15" })).deadline).toBe("2028-03-07");
    expect(ok(computeDepositDeadline({ tenancy_end_date: "2027-02-15" })).deadline).toBe("2027-03-08");
    expect(ok(computeDepositDeadline({ tenancy_end_date: "2026-10-25" })).deadline).toBe("2026-11-15");
    expect(ok(computeDepositDeadline({ tenancy_end_date: "2026-03-01" })).deadline).toBe("2026-03-22");
  });

  it("rejects missing and invalid dates instead of guessing", () => {
    expect(computeDepositDeadline({ tenancy_end_date: "" }).ok).toBe(false);
    expect(computeDepositDeadline({ tenancy_end_date: "2026-02-31" }).ok).toBe(false);
    expect(computeDepositDeadline({ tenancy_end_date: "08/31/2026" }).ok).toBe(false);
    expect(
      computeDepositDeadline({ tenancy_end_date: "2026-08-31", forwarding_address_received_date: "2026-13-01" }).ok
    ).toBe(false);
  });
});

describe("daysUntil / formatLongDate", () => {
  it("counts whole calendar days, negative once passed", () => {
    expect(daysUntil("2026-09-21", "2026-09-21")).toBe(0);
    expect(daysUntil("2026-09-21", "2026-09-20")).toBe(1);
    expect(daysUntil("2026-09-21", "2026-11-10")).toBe(-50);
    expect(daysUntil("bad", "2026-11-10")).toBeNull();
  });

  it("formats a long date without shifting the day", () => {
    expect(formatLongDate("2026-11-10")).toBe("Tuesday, November 10, 2026");
  });
});
