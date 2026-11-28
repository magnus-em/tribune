/**
 * What each demand letter says, in plain language, for the tenant's case page.
 *
 * Information, not legal advice: every bullet describes the template in
 * `templates.ts` and nothing else. Each bullet carries `quotes`, exact phrases
 * from that letter's template (present in every variant of it). The tests
 * check that every quote appears in the generated letter and that every number
 * in a bullet's text comes from one of its quotes. If you edit a template,
 * these bullets must change with it.
 */

export interface LetterSummaryBullet {
  text: string;
  /** Exact substrings of the generated letter that back this bullet. */
  quotes: string[];
}

const APPROVAL_BULLET: LetterSummaryBullet = {
  text: "Tribune sends a letter to your landlord only after you approve it in the app. The letter is signed in your name, asks that payment be made out to you, and directs replies to Tribune.",
  quotes: [
    "Tribune at the email address from which this letter was sent",
    "must be made out to",
    "Sincerely,",
  ],
};

const LETTER_SUMMARIES: Readonly<Record<number, LetterSummaryBullet[]>> = {
  1: [
    {
      text: "Letter 1 cites Connecticut General Statutes § 47a-21(d) and recites its deadline: twenty-one (21) days after the termination of the tenancy, or fifteen (15) days after the landlord received written notice of your forwarding address, whichever is later.",
      quotes: [
        "Connecticut General Statutes § 47a-21(d)",
        "twenty-one (21) days after the termination of the tenancy",
        "fifteen (15) days after receiving written notice of my forwarding address, whichever is later",
      ],
    },
    {
      text: "It lists the deposit paid, the amount returned, and the amount still withheld, and addresses the written statement itemizing the nature and amount of any damages.",
      quotes: [
        "Deposit paid:",
        "Amount returned:",
        "Amount still withheld:",
        "itemizing the nature and amount of any damages",
      ],
    },
    {
      text: "It quotes the statute: a landlord who violates the subsection “shall be liable for twice the amount of any security deposit paid by such tenant.”",
      quotes: ["shall be liable for twice the amount of any security deposit paid by such tenant"],
    },
    {
      text: "It asks for the withheld amount within ten (10) business days, and says that if payment isn't received, you may file a Small Claims action in Connecticut Superior Court.",
      quotes: [
        "within ten (10) business days of this letter",
        "I may file a Small Claims action in Connecticut Superior Court",
      ],
    },
  ],
  2: [
    {
      text: "Letter 2 refers to the date of your first demand and says whether the landlord responded.",
      quotes: ["I delivered a demand for the return of my security deposit on"],
    },
    {
      text: "It restates the § 47a-21(d) statutory period and that the withheld amount hasn't been returned.",
      quotes: ["§ 47a-21(d)", "You did not return the withheld amount of"],
    },
    {
      text: "It lists the withheld deposit, statutory damages of up to twice the deposit under § 47a-21(d), and accrued interest and court costs.",
      quotes: [
        "Security deposit withheld:",
        "Statutory damages under § 47a-21(d) — twice the",
        "Accrued interest and court costs",
      ],
    },
    {
      text: "It asks for the withheld amount within seven (7) business days, and says that if payment isn't received, you may file in Connecticut Small Claims Court.",
      quotes: [
        "within seven (7) business days of this letter",
        "I may file in Connecticut Small Claims Court",
      ],
    },
  ],
  3: [
    {
      text: "Letter 3 is titled a final notice before filing and refers to the dates of your first two letters.",
      quotes: ["FINAL NOTICE", "This is my final notice before filing.", "I sent demand letters on"],
    },
    {
      text: "It restates what § 47a-21(d) required within the statutory period: return the deposit or deliver a written statement itemizing the nature and amount of any damages.",
      quotes: [
        "§ 47a-21(d)",
        "return my deposit or deliver a written statement itemizing the nature and amount of any damages",
      ],
    },
    {
      text: "It says that unless the withheld amount is received within five (5) business days, you intend to file in Connecticut Small Claims Court, and lists what you would seek: the withheld deposit, statutory damages of up to twice the deposit, filing and service fees, and statutory interest.",
      quotes: [
        "within five (5) business days of the date of this letter",
        "I intend to file in Connecticut Small Claims Court",
        "Return of the security deposit withheld:",
        "Statutory damages under § 47a-21(d) — twice the",
        "Court filing and service fees",
        "Statutory interest",
      ],
    },
  ],
};

/** Bullets describing Letter N for the tenant. Unknown numbers get the generic bullet only. */
export function tenantLetterSummary(letterNumber?: number): LetterSummaryBullet[] {
  const specific = letterNumber ? LETTER_SUMMARIES[letterNumber] : undefined;
  return [...(specific ?? []), APPROVAL_BULLET];
}
