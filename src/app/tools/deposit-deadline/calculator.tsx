"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { STATUTE_DAYS } from "@/lib/constants";
import {
  FORWARDING_ADDRESS_DAYS,
  computeDepositDeadline,
  daysUntil,
  formatLongDate,
} from "@/lib/deadline-calculator";
import s from "../../landing.module.css";

/**
 * Client-side only: the dates never leave the browser and nothing is stored.
 * Copy describes what the statute's deadline text computes to; it does not say
 * whether a landlord complied.
 */

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: "16px",
  color: "var(--ink)",
  marginBottom: "6px",
};
const fieldHelp: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "var(--ink-light)",
  margin: "6px 0 0",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "260px",
  padding: "10px 12px",
  fontSize: "16px",
  border: "1px solid var(--cream-border)",
  borderRadius: "8px",
  background: "var(--white)",
  color: "var(--ink)",
  fontFamily: "inherit",
};
const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  padding: "10px 0",
  borderTop: "1px solid var(--cream-border)",
  fontSize: "15px",
  color: "var(--ink-mid)",
};

function relative(days: number): string {
  if (days === 0) return "That date is today.";
  if (days > 0) return `That date is ${days} day${days === 1 ? "" : "s"} from today.`;
  const ago = -days;
  return `That date was ${ago} day${ago === 1 ? "" : "s"} ago.`;
}

export function DeadlineCalculator({ intakeHref }: { intakeHref: string }) {
  const [tenancyEnd, setTenancyEnd] = useState("");
  const [forwarding, setForwarding] = useState("");

  const result = tenancyEnd
    ? computeDepositDeadline({
        tenancy_end_date: tenancyEnd,
        forwarding_address_received_date: forwarding || null,
      })
    : null;

  const today = format(new Date(), "yyyy-MM-dd");
  const remaining = result?.ok ? daysUntil(result.deadline, today) : null;

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{ display: "grid", gap: "24px", maxWidth: "720px" }}
        aria-label="Deposit deadline calculator"
      >
        <div>
          <label htmlFor="tenancy_end_date" style={fieldLabel}>
            When did your tenancy end?
          </label>
          <input
            id="tenancy_end_date"
            name="tenancy_end_date"
            type="date"
            value={tenancyEnd}
            onChange={(e) => setTenancyEnd(e.target.value)}
            style={inputStyle}
          />
          <p style={fieldHelp}>
            The {STATUTE_DAYS}-day clock runs from the termination of the tenancy.
          </p>
        </div>
        <div>
          <label htmlFor="forwarding_address_received_date" style={fieldLabel}>
            When did your landlord receive your forwarding address in writing?{" "}
            <span style={{ fontWeight: 400, color: "var(--ink-light)" }}>(optional)</span>
          </label>
          <input
            id="forwarding_address_received_date"
            name="forwarding_address_received_date"
            type="date"
            value={forwarding}
            onChange={(e) => setForwarding(e.target.value)}
            style={inputStyle}
          />
          <p style={fieldHelp}>
            The {FORWARDING_ADDRESS_DAYS}-day clock runs from when the landlord
            received it, which can be later than the day you sent it. Leave this
            blank if you don&apos;t know.
          </p>
        </div>
      </form>

      <div aria-live="polite" style={{ marginTop: "32px", maxWidth: "720px" }}>
        {result && !result.ok && (
          <p role="alert" style={{ color: "var(--red)", fontSize: "15px" }}>
            {result.error}
          </p>
        )}
        {result?.ok && (
          <div
            data-testid="deadline-result"
            style={{
              padding: "24px",
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              borderLeft: "3px solid var(--blue)",
              borderRadius: "8px",
            }}
          >
            <p className={s.label} style={{ marginBottom: "8px" }}>
              {result.forwarding_unknown ? "Earliest possible deadline" : "Deadline under § 47a-21(d)"}
            </p>
            <p
              data-testid="deadline-date"
              style={{
                fontFamily: "var(--display)",
                fontSize: "28px",
                lineHeight: 1.2,
                color: "var(--headline)",
                margin: "0 0 8px",
              }}
            >
              {formatLongDate(result.deadline)}
            </p>
            {remaining !== null && (
              <p style={{ fontSize: "15px", color: "var(--ink-mid)", margin: "0 0 16px" }}>
                {relative(remaining)}
              </p>
            )}

            <div style={rowStyle}>
              <span>{STATUTE_DAYS} days after the tenancy ended</span>
              <strong>{formatLongDate(result.tenancy_branch_date)}</strong>
            </div>
            <div style={rowStyle}>
              <span>
                {FORWARDING_ADDRESS_DAYS} days after the landlord received your forwarding
                address
              </span>
              <strong>
                {result.forwarding_branch_date
                  ? formatLongDate(result.forwarding_branch_date)
                  : "No date entered"}
              </strong>
            </div>

            <p data-testid="deadline-explanation" style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-mid)", margin: "16px 0 0" }}>
              {result.forwarding_unknown ? (
                <>
                  The statute uses whichever date is later. Without a
                  forwarding-address date, this is the earliest the deadline can
                  be. If the landlord received your forwarding address in writing
                  after {formatLongDate(result.forwarding_later_after)}, the{" "}
                  {FORWARDING_ADDRESS_DAYS}-day clock sets a later deadline.
                </>
              ) : result.controlling === "forwarding" ? (
                <>
                  The statute uses whichever date is later. Here that is the{" "}
                  {FORWARDING_ADDRESS_DAYS}-day clock from the forwarding address.
                </>
              ) : result.controlling === "both" ? (
                <>The statute uses whichever date is later. Here both clocks end on the same day.</>
              ) : (
                <>
                  The statute uses whichever date is later. Here that is the{" "}
                  {STATUTE_DAYS}-day clock from the end of the tenancy.
                </>
              )}
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-mid)", margin: "12px 0 0" }}>
              By that date, the statute requires the landlord to deliver either the
              full deposit plus accrued interest, or the balance with a written
              statement itemizing the nature and amount of any damages deducted.
            </p>
            <div style={{ marginTop: "20px" }}>
              <Link href={intakeHref} className={s.btnDark}>
                Start your free case review →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
