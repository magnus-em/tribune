import {
  tenantInfoSchema,
  propertySchema,
  depositSchema,
} from '../intake';

describe('Intake Schemas', () => {
  describe('tenantInfoSchema', () => {
    test('validates correct tenant info', () => {
      const validData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '2035551234',
        forwarding_address: '123 Main St, New Haven, CT',
      };

      const result = tenantInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('normalizes email to lowercase', () => {
      const data = {
        full_name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        forwarding_address: '123 Main St',
      };

      const result = tenantInfoSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    test('rejects invalid phone numbers', () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '123', // Too short
        forwarding_address: '123 Main St',
      };

      const result = tenantInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('accepts optional phone number', () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        forwarding_address: '123 Main St',
      };

      const result = tenantInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('propertySchema', () => {
    test('validates correct property data', () => {
      // Use a recent date within the past year
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const moveOutDate = threeMonthsAgo.toISOString().split('T')[0];

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const leaseStartDate = oneYearAgo.toISOString().split('T')[0];

      const validData = {
        property_address: '456 Oak Ave, New Haven, CT',
        unit_number: '2B',
        lease_start_date: leaseStartDate,
        lease_end_date: moveOutDate,
        move_out_date: moveOutDate,
      };

      const result = propertySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('rejects lease end before lease start', () => {
      const data = {
        property_address: '456 Oak Ave',
        lease_start_date: '2024-12-31',
        lease_end_date: '2024-01-01', // Before start
        move_out_date: '2024-12-31',
      };

      const result = propertySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('rejects move-out date too far in the past', () => {
      const data = {
        property_address: '456 Oak Ave',
        lease_start_date: '2020-01-01',
        lease_end_date: '2020-12-31',
        move_out_date: '2020-12-31', // More than a year ago
      };

      const result = propertySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('depositSchema', () => {
    test('validates correct deposit data', () => {
      const validData = {
        deposit_amount: '1500',
        amount_withheld: '500',
        withholding_reason: 'Cleaning and repairs',
        itemized_deductions_received: true,
        situation_description: 'My landlord withheld $500 from my $1500 deposit for cleaning charges that seem excessive.',
        contingency_agreed: true,
      };

      const result = depositSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('rejects withheld amount exceeding deposit', () => {
      const data = {
        deposit_amount: '1000',
        amount_withheld: '1500', // More than deposit
        itemized_deductions_received: false,
        situation_description: 'Landlord withheld more than the deposit.',
        contingency_agreed: true,
      };

      const result = depositSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('rejects negative amounts', () => {
      const data = {
        deposit_amount: '-100',
        amount_withheld: '50',
        itemized_deductions_received: false,
        situation_description: 'Valid description of the situation.',
        contingency_agreed: true,
      };

      const result = depositSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('requires contingency agreement', () => {
      const data = {
        deposit_amount: '1000',
        amount_withheld: '500',
        itemized_deductions_received: false,
        situation_description: 'Valid description of the situation.',
        contingency_agreed: false, // Not agreed
      };

      const result = depositSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('requires minimum description length', () => {
      const data = {
        deposit_amount: '1000',
        amount_withheld: '500',
        itemized_deductions_received: false,
        situation_description: 'Too short', // Less than 20 chars
        contingency_agreed: true,
      };

      const result = depositSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
