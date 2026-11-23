import { letterDeadline, letterDeadlinePassed } from "@/lib/letters/deadline";
import { computeDepositDeadline } from "@/lib/deadline-calculator";

// Legal invariant: the deadline a letter states follows § 47a-21(d),
// "whichever is later" of move-out + 21 and forwarding notice + 15.

const must = (r: ReturnType<typeof letterDeadline>) => {
  if (!r) throw new Error("expected a deadline");
  return r;
};

describe("letterDeadline", () => {
  it("BACKLOG example: move-out 6/1, notice 6/15 → 6/30, not the stored 6/22", () => {
    const d = must(letterDeadline({ move_out_date: "2026-06-01" }, "2026-06-15"));
    expect(d.tenancy_branch_date).toBe("2026-06-22");
    expect(d.forwarding_branch_date).toBe("2026-06-30");
    expect(d.deadline).toBe("2026-06-30");
    expect(d.controlling).toBe("forwarding");
    expect(d.forwarding_unknown).toBe(false);
  });

  it("an early forwarding notice never moves the deadline before move-out + 21", () => {
    const d = must(letterDeadline({ move_out_date: "2026-06-01" }, "2026-05-20"));
    expect(d.forwarding_branch_date).toBe("2026-06-04");
    expect(d.deadline).toBe("2026-06-22");
    expect(d.controlling).toBe("tenancy");
  });

  it("crossover: notice 6 days after move-out lands both branches on the same day", () => {
    const d = must(letterDeadline({ move_out_date: "2026-06-01" }, "2026-06-07"));
    expect(d.tenancy_branch_date).toBe("2026-06-22");
    expect(d.forwarding_branch_date).toBe("2026-06-22");
    expect(d.deadline).toBe("2026-06-22");
    expect(d.controlling).toBe("both");
    // One day later, the forwarding branch controls.
    const next = must(letterDeadline({ move_out_date: "2026-06-01" }, "2026-06-08"));
    expect(next.deadline).toBe("2026-06-23");
    expect(next.controlling).toBe("forwarding");
  });

  it("with no forwarding date, gives move-out + 21 flagged as unknown", () => {
    const d = must(letterDeadline({ move_out_date: "2026-06-01" }, null));
    expect(d.deadline).toBe("2026-06-22");
    expect(d.forwarding_branch_date).toBeNull();
    expect(d.forwarding_unknown).toBe(true);
  });

  it("matches computeDepositDeadline for the same inputs", () => {
    for (const fwd of [null, "2026-05-01", "2026-06-07", "2026-07-04"]) {
      const c = computeDepositDeadline({ tenancy_end_date: "2026-06-01", forwarding_address_received_date: fwd });
      if (!c.ok) throw new Error(c.error);
      expect(must(letterDeadline({ move_out_date: "2026-06-01" }, fwd)).deadline).toBe(c.deadline);
    }
  });

  it("returns null for invalid dates instead of guessing", () => {
    expect(letterDeadline({ move_out_date: "" }, null)).toBeNull();
    expect(letterDeadline({ move_out_date: "2026-02-31" }, null)).toBeNull();
    expect(letterDeadline({ move_out_date: "2026-06-01" }, "06/15/2026")).toBeNull();
  });
});

describe("letterDeadlinePassed", () => {
  const known = must(letterDeadline({ move_out_date: "2026-06-01" }, "2026-06-15")); // 6/30
  const unknown = must(letterDeadline({ move_out_date: "2026-06-01" }, null)); // earliest 6/22

  it("the deadline day itself has not passed", () => {
    expect(letterDeadlinePassed(known, "2026-06-30")).toBe(false);
    expect(letterDeadlinePassed(known, "2026-07-01")).toBe(true);
  });

  it("BACKLOG example: on 6/25 the real deadline (6/30) has not passed", () => {
    expect(letterDeadlinePassed(known, "2026-06-25")).toBe(false);
  });

  it("with no forwarding date, never says the deadline has passed", () => {
    expect(letterDeadlinePassed(unknown, "2026-06-20")).toBe(false);
    expect(letterDeadlinePassed(unknown, "2026-06-22")).toBe(false);
    expect(letterDeadlinePassed(unknown, "2026-06-23")).toBeNull();
    expect(letterDeadlinePassed(unknown, "2027-01-01")).toBeNull();
  });
});
