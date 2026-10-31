import {
  prepareLetterDispatch,
  isDispatchPaused,
  lastDispatchAt,
  buildLetterData,
  DISPATCH_COOLDOWN_DAYS,
  type DispatchInput,
  type LetterCase,
} from '../approve-and-send';
import { generateLetter1 } from '../templates';

// Local-time "now" so date-only comparisons don't depend on the runner's TZ.
const now = new Date(2026, 9, 31, 12); // 2026-10-31 noon

const caseRow: LetterCase = {
  status: 'under_review',
  current_letter_number: 0,
  property_address: '789 Elm Ave, New Haven, CT 06511',
  unit_number: '2B',
  move_out_date: '2026-08-31',
  lease_start_date: '2025-09-01',
  lease_end_date: '2026-08-31',
  landlord_name: 'Pat Landlord',
  landlord_email: 'landlord@example.com',
  landlord_address: '1 Main St, New Haven, CT 06510',
  forwarding_address: '10 Oak St, Hartford, CT 06103',
  deposit_amount_cents: 200000,
  amount_withheld_cents: 80000,
  deposit_returned_cents: 120000,
  statutory_deadline: '2026-09-21',
  itemized_deductions_received: false,
  situation_description: 'Landlord kept part of the deposit.',
  withholding_reason: null,
};

const base: DispatchInput = {
  caseRow,
  profile: { full_name: 'Sam Tenant', email: 'tenant@example.com', phone: null },
  messages: [],
  actions: [],
  hasLease: true,
  letterNumber: 1,
  dispatchPaused: undefined,
  now,
};

const withCase = (patch: Partial<LetterCase>): DispatchInput => ({
  ...base,
  caseRow: { ...caseRow, ...patch },
});

const reason = (input: DispatchInput) => {
  const plan = prepareLetterDispatch(input);
  return plan.ok ? 'ok' : plan.reason;
};

const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('prepareLetterDispatch — eligibility', () => {
  test('a complete, accepted case can send Letter 1', () => {
    expect(reason(base)).toBe('ok');
  });

  test.each(['intake_submitted', 'under_review'] as const)('Letter 1 is allowed in %s', (status) => {
    expect(reason(withCase({ status }))).toBe('ok');
  });

  test.each([
    'correspondence_ready',
    'letter_sent',
    'awaiting_landlord',
    'landlord_responded',
    'resolved',
    'closed',
    'declined',
  ] as const)('Letter 1 is blocked in %s', (status) => {
    expect(reason(withCase({ status }))).toBe('status');
  });

  test('the letter must be the next one in sequence', () => {
    expect(reason(withCase({ current_letter_number: 1 }))).toBe('wrong_letter_number');
  });

  test('Letters 2 and 3 are not offered without dispatch history, and 0 or 4 never are', () => {
    expect(reason({ ...withCase({ current_letter_number: 1, status: 'awaiting_landlord' }), letterNumber: 2 })).toBe('letter_not_offered');
    expect(reason({ ...withCase({ current_letter_number: 2, status: 'awaiting_landlord' }), letterNumber: 3 })).toBe('letter_not_offered');
    expect(reason({ ...base, letterNumber: 4 })).toBe('letter_not_offered');
    expect(reason({ ...base, letterNumber: 0 })).toBe('letter_not_offered');
  });

  test.each([null, '', '   '])('a landlord email is required (%p)', (landlord_email) => {
    expect(reason(withCase({ landlord_email }))).toBe('no_landlord_email');
  });

  test.each([null, '', '   '])('a forwarding address is required for payment instructions (%p)', (forwarding_address) => {
    expect(reason(withCase({ forwarding_address }))).toBe('no_forwarding_address');
  });

  test('triage must accept: no lease on file blocks the send', () => {
    expect(reason({ ...base, hasLease: false })).toBe('triage');
  });

  test('triage must accept: a stored deadline that has not passed blocks the send', () => {
    expect(reason(withCase({ statutory_deadline: '2026-11-15' }))).toBe('triage');
    // The deadline day itself hasn't passed yet.
    expect(reason(withCase({ statutory_deadline: '2026-10-31' }))).toBe('triage');
  });

  test('triage must accept: a property outside Connecticut blocks the send', () => {
    expect(reason(withCase({ property_address: '5 Broadway, New York, NY 10001' }))).toBe('triage');
  });

  test('triage must accept: nothing withheld blocks the send', () => {
    expect(reason(withCase({ amount_withheld_cents: 0 }))).toBe('triage');
  });
});

describe('prepareLetterDispatch — kill switch', () => {
  test.each(['true', 'TRUE', ' true '])('DISPATCH_PAUSED=%p blocks every send', (value) => {
    expect(isDispatchPaused(value)).toBe(true);
    expect(reason({ ...base, dispatchPaused: value })).toBe('dispatch_paused');
  });

  test.each([undefined, '', 'false', '0'])('DISPATCH_PAUSED=%p does not block', (value) => {
    expect(isDispatchPaused(value)).toBe(false);
    expect(reason({ ...base, dispatchPaused: value })).toBe('ok');
  });

  test('the kill switch wins over every other check', () => {
    expect(reason({ ...withCase({ landlord_email: null, status: 'declined' }), dispatchPaused: 'true' })).toBe('dispatch_paused');
  });
});

describe('prepareLetterDispatch — rate limit', () => {
  test(`a dispatch within ${DISPATCH_COOLDOWN_DAYS} days blocks the send (letter message)`, () => {
    const messages = [{ message_type: 'tribune_letter' as const, dispatch_metadata: { sent_at: daysAgo(4.9) }, created_at: daysAgo(4.9) }];
    expect(reason({ ...base, messages })).toBe('cooldown');
  });

  test(`a dispatch within ${DISPATCH_COOLDOWN_DAYS} days blocks the send (audit log)`, () => {
    const actions = [{ action_type: 'letter_dispatched' as const, metadata: { sent_at: daysAgo(1) }, created_at: daysAgo(1) }];
    expect(reason({ ...base, actions })).toBe('cooldown');
  });

  test('an audit row without sent_at falls back to its created_at', () => {
    const actions = [{ action_type: 'letter_dispatched' as const, metadata: null, created_at: daysAgo(2) }];
    expect(reason({ ...base, actions })).toBe('cooldown');
  });

  test(`a dispatch more than ${DISPATCH_COOLDOWN_DAYS} days ago does not block`, () => {
    const actions = [{ action_type: 'letter_dispatched' as const, metadata: { sent_at: daysAgo(5.1) }, created_at: daysAgo(5.1) }];
    expect(reason({ ...base, actions })).toBe('ok');
  });

  test('staged (unsent) letters and other actions do not count as dispatches', () => {
    const messages = [{ message_type: 'tribune_letter' as const, dispatch_metadata: null, created_at: daysAgo(1) }];
    const actions = [{ action_type: 'resolution_reported' as const, metadata: { sent_at: daysAgo(1) }, created_at: daysAgo(1) }];
    expect(lastDispatchAt(messages, actions)).toBeNull();
    expect(reason({ ...base, messages, actions })).toBe('ok');
  });

  test('lastDispatchAt returns the most recent dispatch', () => {
    const actions = [
      { action_type: 'letter_dispatched' as const, metadata: { sent_at: daysAgo(10) }, created_at: daysAgo(10) },
      { action_type: 'letter_dispatched' as const, metadata: { sent_at: daysAgo(3) }, created_at: daysAgo(3) },
    ];
    expect(lastDispatchAt([], actions)?.toISOString()).toBe(daysAgo(3));
  });
});

describe('prepareLetterDispatch — server-side regeneration', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });
  afterAll(() => jest.useRealTimers());

  test('the body is exactly the Letter 1 template built from the case row', () => {
    const plan = prepareLetterDispatch(base);
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.body).toBe(generateLetter1(buildLetterData(caseRow, base.profile, false, now)));
    expect(plan.title).toBe('Demand Letter 1 — 789 Elm Ave, New Haven, CT 06511');
  });

  test('the letter carries the case facts and the legal invariants', () => {
    const plan = prepareLetterDispatch(base);
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.body).toContain('§ 47a-21(d)');
    expect(plan.body).toContain('$800.00'); // withheld
    expect(plan.body).toContain('$4,000.00'); // twice the full deposit
    expect(plan.body).toContain('September 21, 2026'); // stored deadline, not shifted by TZ
    expect(plan.body).toContain('Payment must be made out to Sam Tenant');
    expect(plan.body).toContain('10 Oak St, Hartford, CT 06103');
    expect(plan.body.trim().endsWith('Sam Tenant')).toBe(true);
  });

  test('the input has no letter-text field; extra fields are ignored', () => {
    const tampered = { ...base, body: 'FORGED', letterBody: 'FORGED', title: 'FORGED' } as DispatchInput;
    const plan = prepareLetterDispatch(tampered);
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.body).not.toContain('FORGED');
    expect(plan.title).not.toContain('FORGED');
  });

  test('a blocked plan carries no letter text', () => {
    const plan = prepareLetterDispatch({ ...base, dispatchPaused: 'true' });
    expect(plan.ok).toBe(false);
    expect(plan).not.toHaveProperty('body');
  });
});

describe('prepareLetterDispatch — Letters 2 and 3 follow the follow-up schedule', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });
  afterAll(() => jest.useRealTimers());

  // Letter 1 sent Thu 2026-10-01; 10 business days later is Thu 2026-10-15.
  const letter1 = { action_type: 'letter_dispatched' as const, metadata: { letter_number: 1, sent_at: '2026-10-01T15:00:00.000Z' }, created_at: '2026-10-01T15:00:00.000Z' };
  // Letter 2 sent Mon 2026-10-19; 7 business days later is Wed 2026-10-28.
  const letter2 = { action_type: 'letter_dispatched' as const, metadata: { letter_number: 2, sent_at: '2026-10-19T15:00:00.000Z' }, created_at: '2026-10-19T15:00:00.000Z' };

  const awaiting = (current_letter_number: number, letterNumber: number, actions: DispatchInput['actions'] = [letter1]): DispatchInput => ({
    ...withCase({ status: 'awaiting_landlord', current_letter_number }),
    letterNumber,
    actions,
  });

  test('Letter 2 is offered once the wait has passed, and cites the Letter 1 date', () => {
    const plan = prepareLetterDispatch(awaiting(1, 2));
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.title).toBe('Demand Letter 2 — 789 Elm Ave, New Haven, CT 06511');
    expect(plan.body).toContain('SECOND DEMAND');
    expect(plan.body).toContain('on October 1, 2026');
    expect(plan.body).toContain('$4,000.00'); // twice the full deposit
  });

  test('Letter 3 is offered after Letter 2 and cites both dates', () => {
    const plan = prepareLetterDispatch(awaiting(2, 3, [letter1, letter2]));
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.body).toContain('FINAL NOTICE');
    expect(plan.body).toContain('October 1, 2026 and October 19, 2026');
  });

  test('Letter 2 is not offered before the wait ends', () => {
    const early = { ...letter1, metadata: { letter_number: 1, sent_at: '2026-10-20T15:00:00.000Z' }, created_at: '2026-10-20T15:00:00.000Z' };
    const plan = prepareLetterDispatch(awaiting(1, 2, [early]));
    expect(plan.ok ? 'ok' : plan.reason).toBe('letter_not_offered');
    if (!plan.ok) expect(plan.message).toContain('November 3, 2026');
  });

  test('a landlord reply since the last letter stops the offer', () => {
    const messages = [{ message_type: 'landlord_reply' as const, dispatch_metadata: null, created_at: '2026-10-05T12:00:00.000Z' }];
    expect(reason({ ...awaiting(1, 2), messages })).toBe('letter_not_offered');
  });

  test('a reported recovery stops the offer', () => {
    const recovered = { action_type: 'resolution_reported' as const, metadata: null, created_at: '2026-10-10T12:00:00.000Z' };
    expect(reason(awaiting(1, 2, [letter1, recovered]))).toBe('letter_not_offered');
  });

  test.each(['landlord_responded', 'resolved', 'closed', 'declined', 'under_review'] as const)(
    'Letter 2 is blocked in %s',
    (status) => {
      expect(reason({ ...awaiting(1, 2), caseRow: { ...caseRow, status, current_letter_number: 1 } })).toBe('status');
    }
  );

  test('the kill switch and the other checks still apply to Letters 2 and 3', () => {
    expect(reason({ ...awaiting(1, 2), dispatchPaused: 'true' })).toBe('dispatch_paused');
    expect(reason({ ...awaiting(1, 2), caseRow: { ...caseRow, status: 'awaiting_landlord', current_letter_number: 1, landlord_email: null } })).toBe('no_landlord_email');
    expect(reason({ ...awaiting(1, 2), hasLease: false })).toBe('triage');
    expect(reason(awaiting(1, 3))).toBe('wrong_letter_number');
  });
});
