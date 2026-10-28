import { generateLetter1, generateLetter2, generateLetter3, generateDemandLetter } from '../templates';
import type { LetterData } from '../templates';

// These tests pin the legally load-bearing invariants of the demand letters
// (see LEGAL_REVIEW_47a-21.md). If one fails after a template edit, that edit
// changed legal content and needs explicit human sign-off — do not just update
// the assertion.

const mockLetterData: LetterData = {
  tenantName: 'Jane Doe',
  tenantAddress: '123 Oak St, New Haven, CT 06511',
  tenantPhone: '(203) 555-1234',
  tenantEmail: 'jane@example.com',
  landlordName: 'John Smith',
  landlordAddress: '456 Main St, New Haven, CT 06511',
  propertyAddress: '789 Elm Ave',
  unitNumber: '2B',
  leaseStartDate: '2024-01-01',
  leaseEndDate: '2024-12-31',
  moveOutDate: '2024-12-31',
  depositAmountCents: 150000, // $1,500
  amountWithheldCents: 50000, // $500
  depositReturnedCents: 100000, // $1,000
  statutoryDeadline: '2025-01-30',
  daysOverdue: 15,
  itemizedDeductionsReceived: false,
  situationDescription: 'Landlord withheld deposit without justification',
};

const firstLetterDate = '2025-02-01';
const secondLetterDate = '2025-02-15';

const allLetters = () => [
  generateLetter1(mockLetterData),
  generateLetter2(mockLetterData, firstLetterDate),
  generateLetter3(mockLetterData, firstLetterDate, secondLetterDate),
];

describe('Letter Templates', () => {
  describe('invariants shared by every letter', () => {
    test('cites CGS § 47a-21(d)', () => {
      for (const letter of allLetters()) {
        expect(letter).toContain('Connecticut General Statutes § 47a-21(d)');
      }
    });

    test('statutory damages are twice the FULL deposit, not twice the withheld amount', () => {
      for (const letter of allLetters()) {
        expect(letter).toContain('up to $3,000.00'); // 2 × $1,500 deposit
        expect(letter).not.toContain('up to $1,000.00'); // 2 × $500 withheld
        expect(letter).not.toMatch(/twice the amount (wrongfully )?withheld/i);
      }
    });

    test('renders the statutory deadline on the exact date (no UTC off-by-one)', () => {
      for (const letter of allLetters()) {
        expect(letter).toContain('January 30, 2025');
        expect(letter).not.toContain('January 29, 2025');
      }
    });

    test('makes no attorney-fee claims and no attorney framing (pro se model)', () => {
      for (const letter of allLetters()) {
        expect(letter).not.toMatch(/attorney/i);
        expect(letter).not.toMatch(/our client/i);
      }
    });

    test('directs payment to the tenant, never to Tribune', () => {
      for (const letter of allLetters()) {
        expect(letter).toMatch(/[Pp]ayment must be made out to Jane Doe and sent to:\n123 Oak St/);
        expect(letter).not.toMatch(/made out to Tribune/i);
      }
    });

    test('is signed by the tenant in the first person', () => {
      for (const letter of allLetters()) {
        expect(letter.trimEnd()).toMatch(/Sincerely,\s+Jane Doe$/);
      }
    });

    test('routes replies to Tribune as the authorized agent', () => {
      for (const letter of allLetters()) {
        expect(letter).toMatch(/Direct any (correspondence|reply).* to Tribune/);
      }
    });
  });

  describe('generateLetter1', () => {
    test('includes parties, property, and amounts', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('Dear John Smith:');
      expect(letter).toContain('789 Elm Ave, Unit 2B');
      expect(letter).toContain('Deposit paid: $1,500.00');
      expect(letter).toContain('Amount returned: $1,000.00');
      expect(letter).toContain('Amount still withheld: $500.00');
    });

    test('recites both deadline branches (21 days / 15 days after forwarding address)', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('twenty-one (21) days after the termination of the tenancy');
      expect(letter).toContain('fifteen (15) days after receiving written notice of my forwarding address, whichever is later');
    });

    test('renders lease and move-out dates on the exact date', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('from January 1, 2024 to December 31, 2024');
      expect(letter).toContain('vacated on December 31, 2024');
    });

    test('states no itemized statement was delivered when none was received', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('You did not deliver a written statement itemizing');
      expect(letter).not.toContain('You provided a deduction statement');
    });

    test('challenges the itemization when a statement was received', () => {
      const letter = generateLetter1({ ...mockLetterData, itemizedDeductionsReceived: true });

      expect(letter).toContain('You provided a deduction statement, but it does not comply');
      expect(letter).not.toContain('You did not deliver a written statement itemizing');
    });

    test('demands the withheld amount within ten business days', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('Remit $500.00 within ten (10) business days');
    });

    test('handles property without unit number', () => {
      const letter = generateLetter1({ ...mockLetterData, unitNumber: undefined });

      expect(letter).toContain('789 Elm Ave');
      expect(letter).not.toContain('Unit');
    });

    test('omits the landlord address line when unknown', () => {
      const letter = generateLetter1({ ...mockLetterData, landlordAddress: undefined });

      expect(letter).not.toContain('456 Main St');
      expect(letter).toContain('Dear John Smith:');
    });
  });

  describe('generateLetter2', () => {
    test('is marked as the second demand and references Letter 1 by exact date', () => {
      const letter = generateLetter2(mockLetterData, firstLetterDate);

      expect(letter).toContain('SECOND DEMAND');
      expect(letter).toContain('on February 1, 2025');
    });

    test('demands the withheld amount within seven business days', () => {
      const letter = generateLetter2(mockLetterData, firstLetterDate);

      expect(letter).toContain('Remit $500.00 within seven (7) business days');
      expect(letter).toContain('Connecticut Small Claims Court');
    });
  });

  describe('generateLetter3', () => {
    test('is marked as final notice and references both prior letters by exact date', () => {
      const letter = generateLetter3(mockLetterData, firstLetterDate, secondLetterDate);

      expect(letter).toContain('FINAL NOTICE');
      expect(letter).toContain('on February 1, 2025 and February 15, 2025');
    });

    test('sets a five business day deadline and lists the relief sought', () => {
      const letter = generateLetter3(mockLetterData, firstLetterDate, secondLetterDate);

      expect(letter).toContain('within five (5) business days');
      expect(letter).toContain('Return of the security deposit withheld: $500.00');
      expect(letter).toContain('twice the $1,500.00 deposit: up to $3,000.00');
      expect(letter).toContain('Statutory interest');
    });
  });

  describe('generateDemandLetter', () => {
    test('generates Letter 1 when letterNumber is 1', () => {
      const letter = generateDemandLetter(1, mockLetterData);

      expect(letter).toContain('RE: Security Deposit Demand');
      expect(letter).not.toContain('SECOND DEMAND');
      expect(letter).not.toContain('FINAL NOTICE');
    });

    test('generates Letter 2 when letterNumber is 2 with previous date', () => {
      const letter = generateDemandLetter(2, mockLetterData, { letter1: firstLetterDate });

      expect(letter).toContain('SECOND DEMAND');
    });

    test('generates Letter 3 when letterNumber is 3 with previous dates', () => {
      const letter = generateDemandLetter(3, mockLetterData, {
        letter1: firstLetterDate,
        letter2: secondLetterDate,
      });

      expect(letter).toContain('FINAL NOTICE');
    });

    test('throws for Letter 2 without Letter 1 date', () => {
      expect(() => generateDemandLetter(2, mockLetterData)).toThrow('Letter 1 date is required');
    });

    test('throws for Letter 3 without both previous dates', () => {
      expect(() => generateDemandLetter(3, mockLetterData, { letter1: firstLetterDate })).toThrow(
        'Letter 1 and 2 dates are required'
      );
    });

    test('throws for an invalid letter number', () => {
      expect(() => generateDemandLetter(4, mockLetterData)).toThrow('Invalid letter number: 4');
    });
  });

  describe('Money formatting', () => {
    test('formats cents correctly', () => {
      const letter = generateLetter1({ ...mockLetterData, depositAmountCents: 123456 });

      expect(letter).toContain('$1,234.56');
      expect(letter).toContain('$2,469.12'); // doubled
    });

    test('handles zero amounts', () => {
      const letter = generateLetter1({ ...mockLetterData, depositReturnedCents: 0 });

      expect(letter).toContain('Amount returned: $0.00');
    });
  });
});
