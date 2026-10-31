import {
  alreadyNotified,
  followUpNoticeDecision,
  followUpNoticeMetadata,
  isAuthorizedCronRequest,
  planFollowUpNotices,
  FOLLOW_UP_NOTICE_KIND,
  type FollowUpNoticeInput,
} from '../follow-up-notice';

const dispatched = (letter_number: number, sent_at: string) => ({
  action_type: 'letter_dispatched' as const,
  metadata: { letter_number, sent_at },
  created_at: sent_at,
});

const notice = (letter_number: number, created_at = '2026-10-16T14:00:00.000Z') => ({
  message_type: 'system' as const,
  created_at,
  dispatch_metadata: followUpNoticeMetadata(letter_number, created_at),
});

// Letter 1 sent Thu 2026-10-01; Letter 2 is due Thu 2026-10-15 15:00 UTC.
const L1 = '2026-10-01T15:00:00.000Z';
const L2 = '2026-10-19T15:00:00.000Z';
const NOW = new Date('2026-10-16T14:00:00.000Z');

const base: FollowUpNoticeInput = {
  caseRow: { status: 'awaiting_landlord', current_letter_number: 1 },
  messages: [],
  actions: [dispatched(1, L1)],
  now: NOW,
};

describe('followUpNoticeDecision', () => {
  test('notifies once Letter 2 is offered', () => {
    expect(followUpNoticeDecision(base)).toMatchObject({ send: true, letterNumber: 2 });
  });

  test('does not notify before the letter is offered', () => {
    expect(followUpNoticeDecision({ ...base, now: new Date('2026-10-15T14:59:59.000Z') })).toEqual({
      send: false,
      reason: 'not_offered',
    });
  });

  test('does not notify twice for the same letter', () => {
    expect(followUpNoticeDecision({ ...base, messages: [notice(2)] })).toEqual({
      send: false,
      reason: 'already_notified',
    });
  });

  test('a Letter 2 notice does not suppress the Letter 3 notice', () => {
    const input: FollowUpNoticeInput = {
      caseRow: { status: 'awaiting_landlord', current_letter_number: 2 },
      messages: [notice(2)],
      actions: [dispatched(1, L1), dispatched(2, L2)],
      now: new Date('2026-10-28T15:00:00.000Z'),
    };
    expect(followUpNoticeDecision(input)).toMatchObject({ send: true, letterNumber: 3 });
    expect(followUpNoticeDecision({ ...input, messages: [notice(2), notice(3)] })).toMatchObject({
      send: false,
      reason: 'already_notified',
    });
  });

  test('no notice after a landlord reply since the last letter', () => {
    const reply = { message_type: 'landlord_reply' as const, created_at: '2026-10-05T12:00:00.000Z', dispatch_metadata: null };
    expect(followUpNoticeDecision({ ...base, messages: [reply] })).toEqual({ send: false, reason: 'not_offered' });
  });

  test('no notice once a recovery is reported', () => {
    const actions = [
      dispatched(1, L1),
      { action_type: 'resolution_reported' as const, metadata: {}, created_at: '2026-10-10T12:00:00.000Z' },
    ];
    expect(followUpNoticeDecision({ ...base, actions })).toEqual({ send: false, reason: 'not_offered' });
  });

  test('no notice outside awaiting_landlord', () => {
    for (const status of ['landlord_responded', 'resolved', 'closed', 'declined'] as const) {
      expect(followUpNoticeDecision({ ...base, caseRow: { status, current_letter_number: 1 } })).toEqual({
        send: false,
        reason: 'not_offered',
      });
    }
  });

  test('no notice after Letter 3', () => {
    const input: FollowUpNoticeInput = {
      caseRow: { status: 'awaiting_landlord', current_letter_number: 3 },
      messages: [],
      actions: [dispatched(1, L1), dispatched(2, L2), dispatched(3, '2026-10-28T15:00:00.000Z')],
      now: new Date('2026-12-01T12:00:00.000Z'),
    };
    expect(followUpNoticeDecision(input)).toEqual({ send: false, reason: 'not_offered' });
  });
});

describe('alreadyNotified', () => {
  test('only system messages with the notice marker count', () => {
    expect(alreadyNotified([{ ...notice(2), message_type: 'tribune_update' }], 2)).toBe(false);
    expect(
      alreadyNotified([{ message_type: 'system', created_at: NOW.toISOString(), dispatch_metadata: { letter_number: 2 } }], 2)
    ).toBe(false);
    expect(alreadyNotified([{ message_type: 'system', created_at: NOW.toISOString(), dispatch_metadata: null }], 2)).toBe(false);
    expect(alreadyNotified([notice(2)], 2)).toBe(true);
  });

  test('metadata records the kind, letter, and time', () => {
    expect(followUpNoticeMetadata(3, '2026-10-28T15:00:00.000Z')).toEqual({
      notice: FOLLOW_UP_NOTICE_KIND,
      letter_number: 3,
      notified_at: '2026-10-28T15:00:00.000Z',
    });
  });
});

describe('planFollowUpNotices', () => {
  const cases = [
    { id: 'c-due', tenant_id: 't1', status: 'awaiting_landlord' as const, current_letter_number: 1 },
    { id: 'c-done', tenant_id: 't2', status: 'awaiting_landlord' as const, current_letter_number: 1 },
    { id: 'c-early', tenant_id: 't3', status: 'awaiting_landlord' as const, current_letter_number: 1 },
  ];
  const actions = [
    { case_id: 'c-due', ...dispatched(1, L1) },
    { case_id: 'c-done', ...dispatched(1, L1) },
    { case_id: 'c-early', ...dispatched(1, '2026-10-14T15:00:00.000Z') },
  ];
  const messages = [{ case_id: 'c-done', ...notice(2) }];

  test('plans one notice per due, un-notified case, using only that case\'s history', () => {
    expect(planFollowUpNotices({ cases, messages, actions, dispatchPaused: undefined, now: NOW })).toEqual({
      paused: false,
      notices: [{ caseId: 'c-due', tenantId: 't1', letterNumber: 2 }],
    });
  });

  test('the kill switch stops every notice', () => {
    for (const value of ['true', 'TRUE', ' true ']) {
      expect(planFollowUpNotices({ cases, messages, actions, dispatchPaused: value, now: NOW })).toEqual({
        paused: true,
        notices: [],
      });
    }
    expect(planFollowUpNotices({ cases, messages, actions, dispatchPaused: 'false', now: NOW }).paused).toBe(false);
  });
});

describe('isAuthorizedCronRequest', () => {
  test('fails closed without a configured secret', () => {
    expect(isAuthorizedCronRequest('Bearer ', undefined)).toBe(false);
    expect(isAuthorizedCronRequest('Bearer ', '')).toBe(false);
    expect(isAuthorizedCronRequest('Bearer undefined', undefined)).toBe(false);
    expect(isAuthorizedCronRequest(null, undefined)).toBe(false);
  });

  test('requires the exact bearer token', () => {
    expect(isAuthorizedCronRequest('Bearer s3cret', 's3cret')).toBe(true);
    expect(isAuthorizedCronRequest('Bearer wrong', 's3cret')).toBe(false);
    expect(isAuthorizedCronRequest('s3cret', 's3cret')).toBe(false);
    expect(isAuthorizedCronRequest(null, 's3cret')).toBe(false);
  });
});
