import {
  followUpOffer,
  followUpBlockMessage,
  letterDispatchDates,
  FOLLOW_UP_WAIT_BUSINESS_DAYS,
  type FollowUpInput,
} from '../follow-up';

const dispatched = (letter_number: number, sent_at: string) => ({
  action_type: 'letter_dispatched' as const,
  metadata: { letter_number, sent_at },
  created_at: sent_at,
});

// Letter 1 sent Thursday 2026-10-01 at 15:00 UTC.
const L1 = '2026-10-01T15:00:00.000Z';
// Letter 2 sent Monday 2026-10-19 at 15:00 UTC.
const L2 = '2026-10-19T15:00:00.000Z';

const base: FollowUpInput = {
  caseRow: { status: 'awaiting_landlord', current_letter_number: 1 },
  messages: [],
  actions: [dispatched(1, L1)],
  now: new Date('2026-10-31T12:00:00.000Z'),
};

const at = (iso: string): FollowUpInput => ({ ...base, now: new Date(iso) });

describe('followUpOffer — waits', () => {
  test('the waits are 10 business days for Letter 2 and 7 for Letter 3', () => {
    expect(FOLLOW_UP_WAIT_BUSINESS_DAYS).toEqual({ 2: 10, 3: 7 });
  });

  test('Letter 2 is due 10 business days after Letter 1, skipping weekends', () => {
    // Thu Oct 1 + 10 business days = Thu Oct 15, same time of day.
    expect(followUpOffer(at('2026-10-15T14:59:59.000Z'))).toMatchObject({ due: false, reason: 'not_yet', letterNumber: 2 });
    expect(followUpOffer(at('2026-10-15T15:00:00.000Z'))).toMatchObject({ due: true, letterNumber: 2 });
  });

  test('a not-yet offer says when it becomes due', () => {
    const offer = followUpOffer(at('2026-10-08T12:00:00.000Z'));
    if (offer.due) throw new Error('expected not due');
    expect(offer.dueOn?.toISOString()).toBe('2026-10-15T15:00:00.000Z');
    expect(followUpBlockMessage(offer)).toBe('Letter 2 becomes available on October 15, 2026.');
  });

  test('Letter 3 is due 7 business days after Letter 2', () => {
    const input: FollowUpInput = {
      ...base,
      caseRow: { status: 'awaiting_landlord', current_letter_number: 2 },
      actions: [dispatched(1, L1), dispatched(2, L2)],
    };
    // Mon Oct 19 + 7 business days = Wed Oct 28.
    expect(followUpOffer({ ...input, now: new Date('2026-10-28T14:00:00.000Z') })).toMatchObject({ due: false, reason: 'not_yet', letterNumber: 3 });
    const offer = followUpOffer({ ...input, now: new Date('2026-10-28T15:00:00.000Z') });
    expect(offer).toMatchObject({ due: true, letterNumber: 3 });
    if (offer.due) {
      expect(offer.letterDates[1].toISOString()).toBe(L1);
      expect(offer.letterDates[2].toISOString()).toBe(L2);
    }
  });
});

describe('followUpOffer — what stops an offer', () => {
  test('no letter after Letter 3', () => {
    expect(followUpOffer({ ...base, caseRow: { status: 'awaiting_landlord', current_letter_number: 3 } })).toMatchObject({ due: false, reason: 'no_more_letters', letterNumber: null });
  });

  test('nothing is offered before Letter 1 (that is the tenant approval flow)', () => {
    expect(followUpOffer({ ...base, caseRow: { status: 'under_review', current_letter_number: 0 } })).toMatchObject({ due: false, reason: 'no_more_letters' });
  });

  test.each(['intake_submitted', 'under_review', 'correspondence_ready', 'letter_sent', 'landlord_responded', 'resolved', 'closed', 'declined'] as const)(
    'status %s blocks the offer',
    (status) => {
      expect(followUpOffer({ ...base, caseRow: { status, current_letter_number: 1 } })).toMatchObject({ due: false, reason: 'status' });
    }
  );

  test('a reported recovery blocks the offer', () => {
    const actions = [...base.actions, { action_type: 'resolution_reported' as const, metadata: null, created_at: '2026-10-10T00:00:00.000Z' }];
    expect(followUpOffer({ ...base, actions })).toMatchObject({ due: false, reason: 'recovery_reported' });
  });

  test.each(['landlord_reply', 'tenant_landlord_reply'] as const)('a %s after the last letter blocks the offer', (message_type) => {
    const messages = [{ message_type, created_at: '2026-10-02T00:00:00.000Z' }];
    expect(followUpOffer({ ...base, messages })).toMatchObject({ due: false, reason: 'landlord_replied' });
  });

  test('a reply before the last letter does not block the next offer', () => {
    const input: FollowUpInput = {
      ...base,
      caseRow: { status: 'awaiting_landlord', current_letter_number: 2 },
      actions: [dispatched(1, L1), dispatched(2, L2)],
      messages: [{ message_type: 'landlord_reply', created_at: '2026-10-05T00:00:00.000Z' }],
    };
    expect(followUpOffer(input)).toMatchObject({ due: true, letterNumber: 3 });
  });

  test('tenant and system messages do not count as landlord replies', () => {
    const messages = [
      { message_type: 'tenant_response' as const, created_at: '2026-10-02T00:00:00.000Z' },
      { message_type: 'system' as const, created_at: '2026-10-02T00:00:00.000Z' },
      { message_type: 'tribune_update' as const, created_at: '2026-10-02T00:00:00.000Z' },
    ];
    expect(followUpOffer({ ...base, messages })).toMatchObject({ due: true });
  });

  test('a missing dispatch record for an earlier letter blocks the offer', () => {
    expect(followUpOffer({ ...base, actions: [] })).toMatchObject({ due: false, reason: 'no_dispatch_record' });
    const input: FollowUpInput = {
      ...base,
      caseRow: { status: 'awaiting_landlord', current_letter_number: 2 },
      actions: [dispatched(2, L2)],
    };
    expect(followUpOffer(input)).toMatchObject({ due: false, reason: 'no_dispatch_record' });
  });
});

describe('letterDispatchDates', () => {
  test('keeps the first send of each letter and ignores junk', () => {
    const dates = letterDispatchDates([
      dispatched(1, '2026-10-03T00:00:00.000Z'),
      dispatched(1, L1),
      { action_type: 'letter_dispatched', metadata: { letter_number: 2 }, created_at: L2 },
      { action_type: 'letter_dispatched', metadata: { letter_number: 9, sent_at: L2 }, created_at: L2 },
      { action_type: 'letter_dispatched', metadata: null, created_at: L2 },
      { action_type: 'resolution_reported', metadata: { letter_number: 3, sent_at: L2 }, created_at: L2 },
    ]);
    expect(Object.keys(dates).sort()).toEqual(['1', '2']);
    expect(dates[1].toISOString()).toBe(L1);
    // No sent_at: falls back to created_at.
    expect(dates[2].toISOString()).toBe(L2);
  });
});

describe('followUpBlockMessage — Tribune voice', () => {
  test.each(['no_more_letters', 'status', 'recovery_reported', 'landlord_replied', 'no_dispatch_record', 'not_yet'] as const)(
    '%s',
    (reason) => {
      const msg = followUpBlockMessage({ due: false, reason, letterNumber: 2 });
      expect(msg).toMatch(/\S/);
      expect(msg).not.toMatch(/\b(we|we're|us|our|I|admin|team)\b/i);
    }
  );
});
