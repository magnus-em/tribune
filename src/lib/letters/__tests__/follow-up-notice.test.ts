import {
  alreadyNotified,
  alreadyReminded,
  FOLLOW_UP_REMINDER_AFTER_DAYS,
  FOLLOW_UP_REMINDER_KIND,
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
    expect(followUpNoticeDecision({ ...input, messages: [notice(2), notice(3, '2026-10-28T15:00:00.000Z')] })).toMatchObject({
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
      notices: [{ caseId: 'c-due', tenantId: 't1', letterNumber: 2, kind: 'available' }],
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

describe('follow-up reminder (one nudge while Letter N waits for approval)', () => {
  const NOTICE_AT = '2026-10-16T14:00:00.000Z';
  const reminder = (letter_number: number, created_at = '2026-10-21T14:00:00.000Z') => ({
    message_type: 'system' as const,
    created_at,
    dispatch_metadata: followUpNoticeMetadata(letter_number, created_at, 'reminder'),
  });
  const at = (iso: string): FollowUpNoticeInput => ({ ...base, messages: [notice(2, NOTICE_AT)], now: new Date(iso) });

  test('reminder waits five full days after the first notice', () => {
    expect(FOLLOW_UP_REMINDER_AFTER_DAYS).toBe(5);
    expect(followUpNoticeDecision(at('2026-10-21T13:59:59.000Z'))).toEqual({ send: false, reason: 'already_notified' });
    expect(followUpNoticeDecision(at('2026-10-21T14:00:00.000Z'))).toMatchObject({
      send: true,
      kind: 'reminder',
      letterNumber: 2,
    });
  });

  test('the first notice is kind "available"', () => {
    expect(followUpNoticeDecision(base)).toMatchObject({ send: true, kind: 'available' });
  });

  test('never more than one reminder per letter', () => {
    const input = { ...at('2026-11-30T14:00:00.000Z'), messages: [notice(2, NOTICE_AT), reminder(2)] };
    expect(followUpNoticeDecision(input)).toEqual({ send: false, reason: 'already_reminded' });
  });

  test('no reminder once the tenant approved the letter (the offer moves on)', () => {
    const input: FollowUpNoticeInput = {
      caseRow: { status: 'awaiting_landlord', current_letter_number: 2 },
      messages: [notice(2, NOTICE_AT)],
      actions: [dispatched(1, L1), dispatched(2, '2026-10-19T15:00:00.000Z')],
      now: new Date('2026-10-22T15:00:00.000Z'),
    };
    expect(followUpNoticeDecision(input)).toEqual({ send: false, reason: 'not_offered' });
  });

  test('no reminder once the case leaves awaiting_landlord', () => {
    const input = { ...at('2026-10-25T14:00:00.000Z'), caseRow: { status: 'resolved' as const, current_letter_number: 1 } };
    expect(followUpNoticeDecision(input)).toEqual({ send: false, reason: 'not_offered' });
  });

  test('a Letter 2 reminder does not suppress the Letter 3 notice or reminder', () => {
    const base3: FollowUpNoticeInput = {
      caseRow: { status: 'awaiting_landlord', current_letter_number: 2 },
      messages: [notice(2, NOTICE_AT), reminder(2)],
      actions: [dispatched(1, L1), dispatched(2, L2)],
      now: new Date('2026-10-28T15:00:00.000Z'),
    };
    expect(followUpNoticeDecision(base3)).toMatchObject({ send: true, kind: 'available', letterNumber: 3 });
    const later = {
      ...base3,
      messages: [...base3.messages, notice(3, '2026-10-28T15:00:00.000Z')],
      now: new Date('2026-11-02T15:00:00.000Z'),
    };
    expect(followUpNoticeDecision(later)).toMatchObject({ send: true, kind: 'reminder', letterNumber: 3 });
  });

  test('reminder metadata uses its own marker and does not count as the first notice', () => {
    const meta = followUpNoticeMetadata(2, NOTICE_AT, 'reminder');
    expect(meta.notice).toBe(FOLLOW_UP_REMINDER_KIND);
    const msgs = [reminder(2)];
    expect(alreadyReminded(msgs, 2)).toBe(true);
    expect(alreadyNotified(msgs, 2)).toBe(false);
  });

  test('the kill switch stops reminders too', () => {
    const plan = planFollowUpNotices({
      cases: [{ id: 'c1', tenant_id: 't1', status: 'awaiting_landlord', current_letter_number: 1 }],
      messages: [{ case_id: 'c1', ...notice(2, NOTICE_AT) }],
      actions: [{ case_id: 'c1', ...dispatched(1, L1) }],
      dispatchPaused: 'true',
      now: new Date('2026-10-25T14:00:00.000Z'),
    });
    expect(plan).toEqual({ paused: true, notices: [] });
  });

  test('plans a reminder with kind "reminder"', () => {
    const plan = planFollowUpNotices({
      cases: [{ id: 'c1', tenant_id: 't1', status: 'awaiting_landlord', current_letter_number: 1 }],
      messages: [{ case_id: 'c1', ...notice(2, NOTICE_AT) }],
      actions: [{ case_id: 'c1', ...dispatched(1, L1) }],
      dispatchPaused: undefined,
      now: new Date('2026-10-25T14:00:00.000Z'),
    });
    expect(plan).toEqual({ paused: false, notices: [{ caseId: 'c1', tenantId: 't1', letterNumber: 2, kind: 'reminder' }] });
  });
});
