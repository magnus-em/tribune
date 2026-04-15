import { generateLetter1, generateLetter2, generateLetter3, generateDemandLetter } from '../templates';
import type { LetterData } from '../templates';

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

describe('Letter Templates', () => {
  describe('generateLetter1', () => {
    test('generates valid Letter 1 with all required elements', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('Jane Doe');
      expect(letter).toContain('John Smith');
      expect(letter).toContain('789 Elm Ave, Unit 2B');
      expect(letter).toContain('$1,500.00');
      expect(letter).toContain('$500.00');
      expect(letter).toContain('Connecticut General Statutes § 47a-21');
      expect(letter).toMatch(/double the amount of the security deposit/i); // Case-insensitive
    });

    test('includes statutory deadline information', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toMatch(/January 29, 2025|January 30, 2025/); // Account for timezone
      expect(letter).toContain('15'); // days overdue
    });

    test('mentions itemized deductions when not received', () => {
      const letter = generateLetter1(mockLetterData);

      expect(letter).toContain('I have not received any itemized statement');
    });

    test('mentions itemized deductions when received', () => {
      const dataWithItemization = {
        ...mockLetterData,
        itemizedDeductionsReceived: true,
      };

      const letter = generateLetter1(dataWithItemization);

      expect(letter).toContain('While I received a deduction statement');
      expect(letter).toContain('do not comply with Connecticut law');
    });

    test('calculates double damages correctly', () => {
      const letter = generateLetter1(mockLetterData);

      // $1,500 * 2 = $3,000
      expect(letter).toContain('$3,000.00');
    });

    test('handles property without unit number', () => {
      const dataWithoutUnit = {
        ...mockLetterData,
        unitNumber: undefined,
      };

      const letter = generateLetter1(dataWithoutUnit);

      expect(letter).toContain('789 Elm Ave');
      expect(letter).not.toContain('Unit');
    });
  });

  describe('generateLetter2', () => {
    const firstLetterDate = '2025-02-01';

    test('generates valid Letter 2 with reference to Letter 1', () => {
      const letter = generateLetter2(mockLetterData, firstLetterDate);

      expect(letter).toContain('SECOND DEMAND');
      expect(letter).toMatch(/January 31, 2025|February 1, 2025/); // Account for timezone
      expect(letter).toContain('I sent my first demand letter');
      expect(letter).toContain('to which you have not responded');
    });

    test('emphasizes escalating liability', () => {
      const letter = generateLetter2(mockLetterData, firstLetterDate);

      expect(letter).toContain('currently liable for');
      expect(letter).toContain('Double damages');
      expect(letter).toContain('Court costs');
      expect(letter).toContain('attorney\'s fees');
    });

    test('sets shorter deadline than Letter 1', () => {
      const letter = generateLetter2(mockLetterData, firstLetterDate);

      expect(letter).toContain('seven (7) business days');
    });

    test('states intent to file in court', () => {
      const letter = generateLetter2(mockLetterData, firstLetterDate);

      expect(letter).toContain('file a claim in small claims court');
      expect(letter).toContain('maximum damages available');
    });
  });

  describe('generateLetter3', () => {
    const firstLetterDate = '2025-02-01';
    const secondLetterDate = '2025-02-15';

    test('generates valid Letter 3 with references to previous letters', () => {
      const letter = generateLetter3(mockLetterData, firstLetterDate, secondLetterDate);

      expect(letter).toContain('FINAL NOTICE');
      expect(letter).toContain('Intent to File Legal Action');
      expect(letter).toMatch(/January 31, 2025|February 1, 2025/); // Account for timezone
      expect(letter).toMatch(/February 14, 2025|February 15, 2025/); // Account for timezone
      expect(letter).toContain('two demand letters');
    });

    test('emphasizes immediate legal action', () => {
      const letter = generateLetter3(mockLetterData, firstLetterDate, secondLetterDate);

      expect(letter).toContain('final notice before filing a legal claim');
      expect(letter).toContain('I am prepared to file this claim immediately');
      expect(letter).toContain('without further notice to you');
    });

    test('sets shortest deadline', () => {
      const letter = generateLetter3(mockLetterData, firstLetterDate, secondLetterDate);

      expect(letter).toContain('five (5) business days');
    });

    test('lists specific damages sought', () => {
      const letter = generateLetter3(mockLetterData, firstLetterDate, secondLetterDate);

      expect(letter).toContain('Return of the full security deposit');
      expect(letter).toContain('Double damages');
      expect(letter).toContain('Court costs and filing fees');
      expect(letter).toContain('Interest on the withheld amount');
    });
  });

  describe('generateDemandLetter', () => {
    test('generates Letter 1 when letterNumber is 1', () => {
      const letter = generateDemandLetter(1, mockLetterData);

      expect(letter).toContain('Jane Doe');
      expect(letter).toContain('Connecticut General Statutes § 47a-21');
      expect(letter).not.toContain('SECOND DEMAND');
      expect(letter).not.toContain('FINAL NOTICE');
    });

    test('generates Letter 2 when letterNumber is 2 with previous date', () => {
      const letter = generateDemandLetter(2, mockLetterData, {
        letter1: '2025-02-01',
      });

      expect(letter).toContain('SECOND DEMAND');
      expect(letter).toMatch(/January 31, 2025|February 1, 2025/); // Account for timezone
    });

    test('generates Letter 3 when letterNumber is 3 with previous dates', () => {
      const letter = generateDemandLetter(3, mockLetterData, {
        letter1: '2025-02-01',
        letter2: '2025-02-15',
      });

      expect(letter).toContain('FINAL NOTICE');
      expect(letter).toMatch(/January 31, 2025|February 1, 2025/); // Account for timezone
      expect(letter).toMatch(/February 14, 2025|February 15, 2025/); // Account for timezone
    });

    test('throws error for Letter 2 without Letter 1 date', () => {
      expect(() => {
        generateDemandLetter(2, mockLetterData);
      }).toThrow('Letter 1 date is required');
    });

    test('throws error for Letter 3 without previous dates', () => {
      expect(() => {
        generateDemandLetter(3, mockLetterData, { letter1: '2025-02-01' });
      }).toThrow('Letter 1 and 2 dates are required');
    });

    test('throws error for invalid letter number', () => {
      expect(() => {
        generateDemandLetter(4, mockLetterData);
      }).toThrow('Invalid letter number: 4');
    });
  });

  describe('Money formatting', () => {
    test('formats cents correctly', () => {
      const dataWithOddAmount = {
        ...mockLetterData,
        depositAmountCents: 123456, // $1,234.56
      };

      const letter = generateLetter1(dataWithOddAmount);

      expect(letter).toContain('$1,234.56');
    });

    test('handles zero amounts', () => {
      const dataWithZero = {
        ...mockLetterData,
        depositReturnedCents: 0,
      };

      const letter = generateLetter1(dataWithZero);

      expect(letter).toContain('$0.00');
    });
  });
});
