import {
  detailsStepSchema,
  landlordStepSchema,
  depositStepSchema,
  agreementStepSchema,
  intakeSchema,
} from '../intake';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const validDetails = {
  full_name: 'Jane Doe',
  phone: '2035551234',
  fwd_street: '123 Oak St',
  fwd_unit: '',
  fwd_city: 'New Haven',
  fwd_state: 'CT',
  fwd_zip: '06511',
  property_address: '789 Elm Ave, New Haven, CT',
  unit_number: '2B',
  lease_start_date: isoDaysAgo(330),
  lease_end_date: isoDaysAgo(60),
  move_out_date: isoDaysAgo(60),
};

const validLandlord = {
  landlord_name: 'John Smith',
  landlord_email: 'landlord@example.com',
  landlord_phone: '',
  landlord_address: '',
};

const validDeposit = {
  deposit_amount: '1500',
  amount_withheld: '500',
  landlord_stated_reason: 'Cleaning',
  itemized_deductions_received: false,
  notice_given: 'yes' as const,
  notice_given_desc: '',
  preexisting_damage: 'no' as const,
  preexisting_damage_desc: '',
  apartment_condition: 'Left broom-clean, no damage beyond normal wear.',
  landlord_contact_since: 'no' as const,
  landlord_contact_desc: '',
};

const validAgreement = {
  initials_key_clause: 'JD',
  signature_name: 'Jane Doe',
};

const validIntake = { ...validDetails, ...validLandlord, ...validDeposit, ...validAgreement };

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((i) => i.path.join('.')) ?? [];
}

describe('Intake Schemas', () => {
  describe('detailsStepSchema', () => {
    test('accepts valid details', () => {
      expect(detailsStepSchema.safeParse(validDetails).success).toBe(true);
    });

    test('rejects lease end before lease start', () => {
      const result = detailsStepSchema.safeParse({
        ...validDetails,
        lease_start_date: isoDaysAgo(60),
        lease_end_date: isoDaysAgo(300),
      });
      expect(result.success).toBe(false);
      expect(issuePaths(result)).toContain('lease_end_date');
    });

    test('rejects move-out more than a year ago', () => {
      const result = detailsStepSchema.safeParse({ ...validDetails, move_out_date: isoDaysAgo(400) });
      expect(issuePaths(result)).toContain('move_out_date');
    });

    test('rejects move-out in the future', () => {
      const result = detailsStepSchema.safeParse({ ...validDetails, move_out_date: isoDaysAgo(-10) });
      expect(issuePaths(result)).toContain('move_out_date');
    });

    test('rejects an invalid ZIP', () => {
      const result = detailsStepSchema.safeParse({ ...validDetails, fwd_zip: '651' });
      expect(issuePaths(result)).toContain('fwd_zip');
    });

    test('accepts ZIP+4', () => {
      expect(detailsStepSchema.safeParse({ ...validDetails, fwd_zip: '06511-1234' }).success).toBe(true);
    });
  });

  describe('landlordStepSchema', () => {
    test('accepts email only', () => {
      expect(landlordStepSchema.safeParse(validLandlord).success).toBe(true);
    });

    test('accepts phone only', () => {
      const result = landlordStepSchema.safeParse({ ...validLandlord, landlord_email: '', landlord_phone: '2035550000' });
      expect(result.success).toBe(true);
    });

    test('requires at least one contact method', () => {
      const result = landlordStepSchema.safeParse({ ...validLandlord, landlord_email: '  ', landlord_phone: '' });
      expect(issuePaths(result)).toContain('landlord_email');
    });
  });

  describe('depositStepSchema', () => {
    test('accepts valid deposit data', () => {
      expect(depositStepSchema.safeParse(validDeposit).success).toBe(true);
    });

    test('rejects withheld amount exceeding deposit', () => {
      const result = depositStepSchema.safeParse({ ...validDeposit, deposit_amount: '1000', amount_withheld: '1500' });
      expect(issuePaths(result)).toContain('amount_withheld');
    });

    test('rejects non-positive deposit', () => {
      const result = depositStepSchema.safeParse({ ...validDeposit, deposit_amount: '-100' });
      expect(issuePaths(result)).toContain('deposit_amount');
    });

    test('rejects negative withheld amount', () => {
      const result = depositStepSchema.safeParse({ ...validDeposit, amount_withheld: '-1' });
      expect(issuePaths(result)).toContain('amount_withheld');
    });

    test('requires every yes/no question to be answered', () => {
      const result = depositStepSchema.safeParse({
        ...validDeposit,
        notice_given: '',
        preexisting_damage: '',
        landlord_contact_since: '',
      });
      expect(issuePaths(result)).toEqual(
        expect.arrayContaining(['notice_given', 'preexisting_damage', 'landlord_contact_since'])
      );
    });

    test('requires a minimum apartment condition description', () => {
      const result = depositStepSchema.safeParse({ ...validDeposit, apartment_condition: 'fine' });
      expect(issuePaths(result)).toContain('apartment_condition');
    });
  });

  describe('agreementStepSchema', () => {
    test('requires initials and signature', () => {
      const result = agreementStepSchema.safeParse({ initials_key_clause: '', signature_name: '' });
      expect(issuePaths(result)).toEqual(expect.arrayContaining(['initials_key_clause', 'signature_name']));
    });
  });

  // Regression: in zod v4, `.merge()` of the step schemas silently dropped their
  // superRefine checks, so the server-side parse in createCase skipped every
  // cross-field rule. The full schema must enforce all of them itself.
  describe('intakeSchema (server-side authority)', () => {
    test('accepts a complete valid intake', () => {
      expect(intakeSchema.safeParse(validIntake).success).toBe(true);
    });

    test.each([
      ['landlord contact', { landlord_email: '', landlord_phone: '' }, 'landlord_email'],
      ['withheld ≤ deposit', { deposit_amount: '1000', amount_withheld: '1500' }, 'amount_withheld'],
      ['deposit > 0', { deposit_amount: '0' }, 'deposit_amount'],
      ['lease order', { lease_start_date: isoDaysAgo(10), lease_end_date: isoDaysAgo(100) }, 'lease_end_date'],
      ['yes/no answered', { notice_given: '' as const }, 'notice_given'],
    ])('enforces cross-field rule: %s', (_name, override, path) => {
      const result = intakeSchema.safeParse({ ...validIntake, ...override });
      expect(result.success).toBe(false);
      expect(issuePaths(result)).toContain(path);
    });
  });
});
