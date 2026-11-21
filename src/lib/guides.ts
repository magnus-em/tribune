/**
 * The public guides and tools listed on /guides. Descriptions say which part
 * of § 47a-21(d) each page reads; they make no legal claim of their own.
 * Every guide route under src/app/guides must be listed (tested).
 */

export type GuideLink = { href: string; title: string; body: string };

export const GUIDES: ReadonlyArray<GuideLink> = [
  {
    href: "/guides/connecticut-security-deposit-law",
    title: "Connecticut security deposit law",
    body: "Walks through § 47a-21(d) section by section: the deadline, what the landlord delivers, and what the statute says a landlord who violates it is liable for.",
  },
  {
    href: "/guides/landlord-kept-security-deposit-connecticut",
    title: "Landlord kept your security deposit?",
    body: "Sets four situations (nothing arrived, part with no statement, part with a list of deductions, the deposit without interest) next to the statute’s words.",
  },
  {
    href: "/guides/itemized-statement-of-damages-connecticut",
    title: "Itemized statement of damages",
    body: "Reads the statute’s requirement of a written statement itemizing the nature and amount of damages, phrase by phrase.",
  },
  {
    href: "/guides/security-deposit-forwarding-address-connecticut",
    title: "Your forwarding address",
    body: "Reads the two deadline clocks and “whichever is later”, with two worked date examples.",
  },
  {
    href: "/guides/security-deposit-double-damages-connecticut",
    title: "Double damages",
    body: "Reads the liability sentence phrase by phrase and works through its arithmetic with example figures.",
  },
];

export const TOOLS: ReadonlyArray<GuideLink> = [
  {
    href: "/tools/deposit-deadline",
    title: "Deposit deadline calculator",
    body: "Enter the date the tenancy ended, and optionally when the landlord received your forwarding address in writing. It computes the § 47a-21(d) deadline in calendar days. Runs in your browser and stores nothing.",
  },
];
