import {
  caseLetterDeadline,
  forwardingNoticeAnswer,
  forwardingNoticeAttestationMetadata,
  letterDeadline,
  letterDeadlinePassed,
  parseForwardingNoticeInput,
  forwardingNoticeMessage,
  FORWARDING_NOTICE_ATTESTATION_KIND,
  tenantDeadlineDisplay,
  letterSentDeadlineTitle,
  DEADLINE_RULE_SUMMARY,
  intakeDeadlineNotice,
} from "@/lib/letters/deadline";
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

const notice = (meta: Record<string, unknown>, created_at = "2026-07-01T12:00:00.000Z") => ({
  message_type: "system" as const,
  dispatch_metadata: { attestation: FORWARDING_NOTICE_ATTESTATION_KIND, ...meta } as never,
  created_at,
});

describe("forwardingNoticeAnswer", () => {
  test("none on record is null", () => {
    expect(forwardingNoticeAnswer([])).toBeNull();
  });

  test("reads each kind of answer, round-tripping the metadata builder", () => {
    for (const answer of [
      { answer: "date", notice_date: "2026-06-15" },
      { answer: "not_given", notice_date: null },
      { answer: "unknown", notice_date: null },
    ] as const) {
      const meta = forwardingNoticeAttestationMetadata(answer, "2026-07-01T12:00:00.000Z");
      const m = { message_type: "system" as const, dispatch_metadata: meta, created_at: "2026-07-01T12:00:00.000Z" };
      expect(forwardingNoticeAnswer([m])).toEqual(answer);
    }
  });

  test("the builder drops a date sent with a non-date answer", () => {
    const meta = forwardingNoticeAttestationMetadata(
      { answer: "unknown", notice_date: "2026-06-15" },
      "2026-07-01T12:00:00.000Z"
    );
    expect(meta.notice_date).toBeNull();
  });

  test("the latest answer wins", () => {
    const answers = [
      notice({ answer: "unknown" }, "2026-07-01T12:00:00.000Z"),
      notice({ answer: "date", notice_date: "2026-06-15" }, "2026-07-02T12:00:00.000Z"),
    ];
    expect(forwardingNoticeAnswer(answers)).toEqual({ answer: "date", notice_date: "2026-06-15" });
    expect(forwardingNoticeAnswer([...answers].reverse())).toEqual({ answer: "date", notice_date: "2026-06-15" });
  });

  test.each([
    ["a date answer with no date", { answer: "date" }],
    ["a date answer with an impossible date", { answer: "date", notice_date: "2026-02-30" }],
    ["a date answer with a timestamp", { answer: "date", notice_date: "2026-06-15T00:00:00Z" }],
    ["an unknown kind", { answer: "maybe" }],
  ])("ignores %s", (_label, meta) => {
    expect(forwardingNoticeAnswer([notice(meta)])).toBeNull();
  });

  test("ignores non-system messages and other attestations", () => {
    expect(
      forwardingNoticeAnswer([
        { ...notice({ answer: "unknown" }), message_type: "tenant_message" as never },
        {
          message_type: "system" as const,
          dispatch_metadata: { attestation: "residential_tenancy", residential: true },
          created_at: "2026-07-01T12:00:00.000Z",
        },
      ])
    ).toBeNull();
  });
});

describe("caseLetterDeadline", () => {
  // BACKLOG Now #1 example: move-out 6/1, stored 6/22, notice received 6/15.
  const caseRow = { move_out_date: "2026-06-01", statutory_deadline: "2026-06-22" };

  test("a later forwarding notice moves the deadline past the stored date", () => {
    expect(caseLetterDeadline(caseRow, { answer: "date", notice_date: "2026-06-15" })).toEqual({
      deadline: "2026-06-30",
      forwarding_unknown: false,
    });
  });

  test("an early notice leaves move-out + 21", () => {
    expect(caseLetterDeadline(caseRow, { answer: "date", notice_date: "2026-05-20" })).toEqual({
      deadline: "2026-06-22",
      forwarding_unknown: false,
    });
  });

  test.each([null, { answer: "unknown", notice_date: null }, { answer: "not_given", notice_date: null }] as const)(
    "no notice date (%p) gives move-out + 21, flagged as the earliest possible date",
    (answer) => {
      expect(caseLetterDeadline(caseRow, answer)).toEqual({ deadline: "2026-06-22", forwarding_unknown: true });
    }
  );

  test("never earlier than the stored statutory_deadline", () => {
    expect(
      caseLetterDeadline({ ...caseRow, statutory_deadline: "2026-07-10" }, { answer: "date", notice_date: "2026-06-15" })
        .deadline
    ).toBe("2026-07-10");
  });

  test("an invalid move-out date falls back to the stored date, flagged unknown", () => {
    expect(caseLetterDeadline({ ...caseRow, move_out_date: "not-a-date" }, null)).toEqual({
      deadline: "2026-06-22",
      forwarding_unknown: true,
    });
  });
});

describe("parseForwardingNoticeInput", () => {
  const today = "2026-11-25";

  it("accepts a past date", () => {
    expect(parseForwardingNoticeInput("date", "2026-06-15", today)).toEqual({
      ok: true,
      value: { answer: "date", notice_date: "2026-06-15" },
    });
  });

  it("accepts today", () => {
    expect(parseForwardingNoticeInput("date", today, today).ok).toBe(true);
  });

  it("rejects a future date", () => {
    expect(parseForwardingNoticeInput("date", "2026-11-26", today).ok).toBe(false);
  });

  it.each([null, undefined, "", "2026-02-30", "06/15/2026", "2026-6-15"])("rejects date %p", (d) => {
    expect(parseForwardingNoticeInput("date", d, today).ok).toBe(false);
  });

  it.each(["not_given", "unknown"] as const)("%s carries no date, even if one is sent", (a) => {
    expect(parseForwardingNoticeInput(a, "2026-06-15", today)).toEqual({
      ok: true,
      value: { answer: a, notice_date: null },
    });
  });

  it.each(["", "yes", "DATE"])("rejects unknown answer %p", (a) => {
    expect(parseForwardingNoticeInput(a, "2026-06-15", today).ok).toBe(false);
  });

  it("round-trips through the attestation: the recorded answer drives the letter deadline", () => {
    const parsed = parseForwardingNoticeInput("date", "2026-06-15", today);
    if (!parsed.ok) throw new Error("expected ok");
    const meta = forwardingNoticeAttestationMetadata(parsed.value, "2026-11-25T12:00:00Z");
    const answer = forwardingNoticeAnswer([
      { message_type: "system", dispatch_metadata: meta, created_at: "2026-11-25T12:00:00Z" },
    ]);
    expect(answer).toEqual({ answer: "date", notice_date: "2026-06-15" });
    expect(
      caseLetterDeadline({ move_out_date: "2026-06-01", statutory_deadline: "2026-06-22" }, answer)
    ).toEqual({ deadline: "2026-06-30", forwarding_unknown: false });
  });
});

describe("forwardingNoticeMessage", () => {
  it("states the date the tenant gave, in the tenant's timeline", () => {
    expect(forwardingNoticeMessage({ answer: "date", notice_date: "2026-06-15" }).body).toContain(
      "June 15, 2026"
    );
  });

  it.each([
    { answer: "date", notice_date: "2026-06-15" },
    { answer: "not_given", notice_date: null },
    { answer: "unknown", notice_date: null },
  ] as const)("speaks as Tribune, not a person ($answer)", (a) => {
    const m = forwardingNoticeMessage(a);
    expect(m.body).toMatch(/Tribune/);
    expect(`${m.title} ${m.body}`).not.toMatch(/\b(we|us|our|I)\b/);
  });
});

describe("tenantDeadlineDisplay (Now #1d)", () => {
  const row = { move_out_date: "2026-06-01", statutory_deadline: "2026-06-22" };

  it("no answer on record → earliest possible, not the deadline", () => {
    expect(tenantDeadlineDisplay(row, null)).toEqual({
      date: "2026-06-22",
      exact: false,
      label: "Earliest possible deadline",
    });
  });

  it("'not given' and 'unknown' answers stay earliest possible", () => {
    for (const answer of ["not_given", "unknown"] as const) {
      expect(tenantDeadlineDisplay(row, { answer, notice_date: null }).exact).toBe(false);
    }
  });

  it("BACKLOG example: notice 6/15 → deadline 6/30, labeled as the deadline", () => {
    expect(tenantDeadlineDisplay(row, { answer: "date", notice_date: "2026-06-15" })).toEqual({
      date: "2026-06-30",
      exact: true,
      label: "Statutory deadline",
    });
  });

  it("an early notice keeps move-out + 21, now exact", () => {
    expect(tenantDeadlineDisplay(row, { answer: "date", notice_date: "2026-06-02" })).toEqual({
      date: "2026-06-22",
      exact: true,
      label: "Statutory deadline",
    });
  });

  it("matches the date the letters use", () => {
    const notice = { answer: "date" as const, notice_date: "2026-06-15" };
    expect(tenantDeadlineDisplay(row, notice).date).toBe(caseLetterDeadline(row, notice).deadline);
  });

  it("the rule summary restates both (d) branches and 'whichever is later'", () => {
    expect(DEADLINE_RULE_SUMMARY).toMatch(/21 days after the tenancy ends/);
    expect(DEADLINE_RULE_SUMMARY).toMatch(/15 days after the landlord receives .* forwarding address in writing/);
    expect(DEADLINE_RULE_SUMMARY).toMatch(/whichever is later/);
  });
});

describe("letterSentDeadlineTitle (Now #1d)", () => {
  const exact = { date: "2026-06-30", exact: true, label: "Statutory deadline" };
  const earliest = { date: "2026-06-22", exact: false, label: "Earliest possible deadline" };

  it("counts days past a known deadline", () => {
    expect(letterSentDeadlineTitle(exact, "2026-07-03")).toBe(
      "Tribune sent your letter. The deadline passed 3 days ago"
    );
    expect(letterSentDeadlineTitle(exact, "2026-07-01")).toBe(
      "Tribune sent your letter. The deadline passed 1 day ago"
    );
  });

  it("the deadline day itself has not passed", () => {
    expect(letterSentDeadlineTitle(exact, "2026-06-30")).toBe("Tribune sent your letter. Today is the deadline");
  });

  it("counts days left before a known deadline", () => {
    expect(letterSentDeadlineTitle(exact, "2026-06-25")).toBe(
      "Tribune sent your letter. 5 days left before the deadline"
    );
  });

  it("states no count against an earliest-possible date", () => {
    expect(letterSentDeadlineTitle(earliest, "2026-08-01")).toBe("Tribune sent your letter");
    expect(letterSentDeadlineTitle(earliest, "2026-06-01")).toBe("Tribune sent your letter");
  });

  it("counts across a DST change without drifting a day", () => {
    const nov = { date: "2026-11-10", exact: true, label: "Statutory deadline" };
    expect(letterSentDeadlineTitle(nov, "2026-10-31")).toBe(
      "Tribune sent your letter. 10 days left before the deadline"
    );
  });
});

describe("intakeDeadlineNotice (Now #1e)", () => {
  it("labels move-out + 21 as the earliest possible deadline", () => {
    const n = intakeDeadlineNotice("2026-06-01", "2026-06-10")!;
    expect(n.earliest_date).toBe("2026-06-22");
    expect(n.earliest_label).toBe("Jun 22, 2026");
    expect(n.earliest_passed).toBe(false);
    expect(n.title).toBe("Earliest possible deadline: Jun 22, 2026");
    expect(n.body).toContain(DEADLINE_RULE_SUMMARY);
  });

  it("matches the date the letters use with no forwarding answer", () => {
    const row = { move_out_date: "2026-06-01", statutory_deadline: "2026-06-22" };
    expect(intakeDeadlineNotice("2026-06-01", "2026-06-10")!.earliest_date).toBe(
      caseLetterDeadline(row, null).deadline
    );
  });

  it("BACKLOG example: started 6/25, earliest 6/22 before today, but no claim it passed", () => {
    const n = intakeDeadlineNotice("2026-06-01", "2026-06-25")!;
    expect(n.earliest_passed).toBe(true);
    expect(n.body).toMatch(/actual deadline may be later/);
    const text = `${n.title} ${n.body}`;
    expect(text).not.toMatch(/has passed|have passed|appears to/i);
  });

  it("the deadline day itself is not before today", () => {
    expect(intakeDeadlineNotice("2026-06-01", "2026-06-22")!.earliest_passed).toBe(false);
  });

  it("never calls the date 'the deadline' or promises a send-by date", () => {
    for (const today of ["2026-06-10", "2026-06-25"]) {
      const n = intakeDeadlineNotice("2026-06-01", today)!;
      const text = `${n.title} ${n.body}`;
      expect(text).not.toMatch(/legal deadline|aims to send|send the first|by Jun/i);
      expect(text).not.toMatch(/twice|double/i);
    }
  });

  it("invalid move-out date → null", () => {
    expect(intakeDeadlineNotice("not-a-date", "2026-06-10")).toBeNull();
  });
});
