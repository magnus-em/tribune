import { generateLetter1, generateLetter2, generateLetter3 } from '../templates';
import type { LetterData } from '../templates';
import { tenantLetterSummary } from '../tenant-summary';

// The case page tells the tenant what each letter says. These tests pin that
// every claim is backed by the letter's own template text. If one fails after
// a template edit, change the summary to match the letter — never the reverse.

const base: LetterData = {
  tenantName: 'Jane Doe',
  tenantAddress: '123 Oak St, New Haven, CT 06511',
  landlordName: 'John Smith',
  propertyAddress: '789 Elm Ave',
  leaseStartDate: '2024-01-01',
  leaseEndDate: '2024-12-31',
  moveOutDate: '2024-12-31',
  depositAmountCents: 150000,
  amountWithheldCents: 50000,
  depositReturnedCents: 100000,
  statutoryDeadline: '2025-01-21',
  daysOverdue: 15,
  itemizedDeductionsReceived: false,
  situationDescription: 'x',
};

// Every combination of the flags that switch template text.
const variants: LetterData[] = [];
for (const itemizedDeductionsReceived of [false, true])
  for (const deadlineIsEarliestPossible of [false, true])
    for (const landlordResponded of [false, true])
      variants.push({ ...base, itemizedDeductionsReceived, deadlineIsEarliestPossible, landlordResponded });

const generate = (n: number, d: LetterData) =>
  n === 1 ? generateLetter1(d) : n === 2 ? generateLetter2(d, '2025-02-01') : generateLetter3(d, '2025-02-01', '2025-02-15');

const numbersIn = (s: string) => s.match(/\d+/g) ?? [];

describe('tenantLetterSummary', () => {
  for (const n of [1, 2, 3]) {
    describe(`Letter ${n}`, () => {
      const bullets = tenantLetterSummary(n);

      it('has letter-specific bullets plus the approval bullet', () => {
        expect(bullets.length).toBeGreaterThan(1);
      });

      it('every quote appears in every variant of the generated letter', () => {
        for (const d of variants) {
          const letter = generate(n, d);
          for (const b of bullets) for (const q of b.quotes) expect(letter).toContain(q);
        }
      });

      it('every number in a bullet comes from one of its quotes', () => {
        for (const b of bullets) {
          const backed = new Set(b.quotes.flatMap(numbersIn));
          // "Letter 2" names the letter; every other number must be quoted.
          const unbacked = numbersIn(b.text.replace(/Letter \d/g, '')).filter((num) => !backed.has(num));
          expect({ bullet: b.text, unbacked }).toEqual({ bullet: b.text, unbacked: [] });
        }
      });

      it('every bullet has at least one quote', () => {
        for (const b of bullets) expect(b.quotes.length).toBeGreaterThan(0);
      });

      it('states the reply window the letter actually sets', () => {
        const days = { 1: 'ten (10) business days', 2: 'seven (7) business days', 3: 'five (5) business days' }[n]!;
        expect(bullets.map((b) => b.text).join(' ')).toContain(days);
      });
    });
  }

  it('never makes the claims the old tactics copy made', () => {
    const all = [1, 2, 3, undefined].flatMap((n) => tenantLetterSummary(n)).map((b) => b.text.toLowerCase()).join(' ');
    for (const banned of ['14-day', '7-day', 'automatically', 'fee shifting', 'fee-shifting', 'summons', 'public record', 'already missed', 'leverage', 'pressure']) {
      expect(all).not.toContain(banned);
    }
  });

  it('says letters go out only after the tenant approves', () => {
    for (const n of [1, 2, 3, undefined]) {
      expect(tenantLetterSummary(n).map((b) => b.text).join(' ')).toContain('only after you approve it');
    }
  });

  it('unknown letter numbers get only the generic bullet', () => {
    expect(tenantLetterSummary(undefined)).toHaveLength(1);
    expect(tenantLetterSummary(4)).toHaveLength(1);
  });
});
