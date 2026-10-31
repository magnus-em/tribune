import {
  triageCase,
  propertyInConnecticut,
  residentialAnswer,
  residentialAttestationMetadata,
  RESIDENTIAL_ATTESTATION_KIND,
} from '../triage';
import type { TriageInput, TriageCheckId } from '../triage';

// Local-time "today" so date-only comparisons don't depend on the runner's TZ.
const today = new Date(2026, 9, 30); // 2026-10-30

const base: TriageInput = {
  property_address: '789 Elm Ave, New Haven, CT 06511',
  move_out_date: '2026-08-31',
  landlord_email: 'landlord@example.com',
  amount_withheld_cents: 50000,
  statutory_deadline: '2026-09-21',
  has_lease: true,
  residential: true,
};

const status = (input: TriageInput, id: TriageCheckId) =>
  triageCase(input, today).checks.find((c) => c.id === id)?.status;

describe('propertyInConnecticut', () => {
  test.each([
    ['789 Elm Ave, New Haven, CT 06511', true],
    ['789 Elm Ave, New Haven, CT', true],
    ['789 Elm Ave, New Haven, ct.', true],
    ['12 Main St, Hartford, Connecticut', true],
    ['12 Main St, Hartford 06103', true],
    ['12 Main St, Hartford, CT 06103-1234', true],
    ['5 Broadway, New York, NY 10001', false],
    ['5 Broadway, New York, NY', false],
    ['1 Main St, Springfield, MA 01103', false],
    // ZIP outranks a mistyped state token
    ['789 Elm Ave, New Haven, NY 06511', true],
    ['789 Elm Ave, New Haven, CT 10001', false],
    ['789 Elm Ave', null],
    ['789 Elm Ave, Apt 2B', null],
  ])('%s → %s', (address, expected) => {
    expect(propertyInConnecticut(address)).toBe(expected);
  });
});

describe('triageCase', () => {
  test('a complete CT case past its deadline is accepted', () => {
    const result = triageCase(base, today);
    expect(result.verdict).toBe('accept');
  });

  test('reports every check, in a stable order', () => {
    expect(triageCase(base, today).checks.map((c) => c.id)).toEqual([
      'connecticut',
      'residential',
      'moved_out',
      'landlord_email',
      'amount_withheld',
      'deadline_passed',
      'lease_on_file',
    ]);
  });

  test('a confirmed residential tenancy passes', () => {
    expect(status(base, 'residential')).toBe('pass');
    expect(triageCase(base, today).verdict).toBe('accept');
  });

  test('no residential answer on record goes to review, never accept', () => {
    const input = { ...base, residential: null };
    expect(status(input, 'residential')).toBe('unknown');
    expect(triageCase(input, today).verdict).toBe('review');
  });

  test('a tenancy the tenant says is not residential is declined', () => {
    const input = { ...base, residential: false };
    expect(status(input, 'residential')).toBe('fail');
    expect(triageCase(input, today).verdict).toBe('decline');
  });

  test('not residential declines even when other checks also fail', () => {
    const input = { ...base, residential: false, has_lease: false, landlord_email: null };
    expect(triageCase(input, today).verdict).toBe('decline');
  });

  describe('decline', () => {
    test('property outside Connecticut', () => {
      const input = { ...base, property_address: '5 Broadway, New York, NY 10001' };
      expect(status(input, 'connecticut')).toBe('fail');
      expect(triageCase(input, today).verdict).toBe('decline');
    });

    test('outside CT wins over other failures', () => {
      const input = {
        ...base,
        property_address: '5 Broadway, New York, NY 10001',
        landlord_email: null,
        has_lease: false,
      };
      expect(triageCase(input, today).verdict).toBe('decline');
    });
  });

  describe('review', () => {
    test('state unknown from the address', () => {
      const input = { ...base, property_address: '789 Elm Ave' };
      expect(status(input, 'connecticut')).toBe('unknown');
      expect(triageCase(input, today).verdict).toBe('review');
    });

    test('move-out date in the future', () => {
      const input = { ...base, move_out_date: '2026-11-15', statutory_deadline: '2026-12-06' };
      expect(status(input, 'moved_out')).toBe('fail');
      expect(triageCase(input, today).verdict).toBe('review');
    });

    test('moving out today counts as moved out', () => {
      expect(status({ ...base, move_out_date: '2026-10-30' }, 'moved_out')).toBe('pass');
    });

    test.each([null, '', '   '])('landlord email %p', (email) => {
      const input = { ...base, landlord_email: email };
      expect(status(input, 'landlord_email')).toBe('fail');
      expect(triageCase(input, today).verdict).toBe('review');
    });

    test('nothing withheld', () => {
      const input = { ...base, amount_withheld_cents: 0 };
      expect(status(input, 'amount_withheld')).toBe('fail');
      expect(triageCase(input, today).verdict).toBe('review');
    });

    test('one cent withheld passes (no minimum is set)', () => {
      expect(status({ ...base, amount_withheld_cents: 1 }, 'amount_withheld')).toBe('pass');
    });

    test('stored deadline is today: not yet passed', () => {
      const input = { ...base, statutory_deadline: '2026-10-30' };
      expect(status(input, 'deadline_passed')).toBe('fail');
      expect(triageCase(input, today).verdict).toBe('review');
    });

    test('stored deadline was yesterday: passed', () => {
      expect(status({ ...base, statutory_deadline: '2026-10-29' }, 'deadline_passed')).toBe('pass');
    });

    test('lease not uploaded', () => {
      const input = { ...base, has_lease: false };
      expect(status(input, 'lease_on_file')).toBe('fail');
      expect(triageCase(input, today).verdict).toBe('review');
    });
  });

  test('time of day does not change date-only comparisons', () => {
    const lateEvening = new Date(2026, 9, 30, 23, 59);
    const input = { ...base, statutory_deadline: '2026-10-30' };
    expect(triageCase(input, lateEvening).checks.find((c) => c.id === 'deadline_passed')?.status).toBe('fail');
  });

  test('defaults today to now', () => {
    expect(() => triageCase(base)).not.toThrow();
  });
});

describe('residentialAnswer', () => {
  const msg = (meta: unknown, created_at = '2026-10-01T12:00:00Z', message_type = 'system') =>
    ({ message_type, dispatch_metadata: meta, created_at }) as Parameters<typeof residentialAnswer>[0][number];

  test('no messages → null', () => {
    expect(residentialAnswer([])).toBeNull();
  });

  test('reads the intake marker', () => {
    expect(residentialAnswer([msg(residentialAttestationMetadata(true, '2026-10-01T12:00:00Z'))])).toBe(true);
    expect(residentialAnswer([msg(residentialAttestationMetadata(false, '2026-10-01T12:00:00Z'))])).toBe(false);
  });

  test('the latest answer wins', () => {
    const messages = [
      msg(residentialAttestationMetadata(false, 'x'), '2026-10-02T12:00:00Z'),
      msg(residentialAttestationMetadata(true, 'x'), '2026-10-01T12:00:00Z'),
    ];
    expect(residentialAnswer(messages)).toBe(false);
  });

  test.each([
    ['other system metadata', msg({ notice: 'follow_up_available', letter_number: 2 })],
    ['no metadata', msg(null)],
    ['array metadata', msg([1, 2])],
    ['non-boolean answer', msg({ attestation: RESIDENTIAL_ATTESTATION_KIND, residential: 'yes' })],
    ['not a system message', msg(residentialAttestationMetadata(true, 'x'), undefined, 'tribune_update')],
  ])('ignores %s', (_label, m) => {
    expect(residentialAnswer([m])).toBeNull();
  });
});
