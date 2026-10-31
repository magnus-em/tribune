import { buildExceptionQueue, exceptionCount } from '../exceptions';
import type { ExceptionCase, ExceptionMessage, ExceptionInvoice } from '../exceptions';

// Local-time "today" so date-only comparisons don't depend on the runner's TZ.
const today = new Date(2026, 9, 31, 12); // 2026-10-31 noon local
const iso = (y: number, m: number, d: number) => new Date(y, m - 1, d, 9).toISOString();

const kase = (over: Partial<ExceptionCase> = {}): ExceptionCase => ({
  id: 'c1',
  status: 'awaiting_landlord',
  statutory_deadline: '2026-09-21',
  created_at: iso(2026, 10, 1),
  ...over,
});

const run = (
  cases: ExceptionCase[],
  messages: ExceptionMessage[] = [],
  invoices: ExceptionInvoice[] = []
) => buildExceptionQueue(cases, messages, invoices, today);

describe('new intakes', () => {
  test('intake_submitted is listed with its age', () => {
    const q = run([kase({ status: 'intake_submitted', created_at: iso(2026, 10, 29) })]);
    expect(q.new_intake).toHaveLength(1);
    expect(q.new_intake[0].detail).toBe('Submitted 2 days ago');
  });

  test('submitted today', () => {
    const q = run([kase({ status: 'intake_submitted', created_at: iso(2026, 10, 31) })]);
    expect(q.new_intake[0].detail).toBe('Submitted today');
  });

  test.each(['under_review', 'awaiting_landlord', 'resolved', 'declined'] as const)(
    '%s is not a new intake',
    (status) => {
      expect(run([kase({ status })]).new_intake).toHaveLength(0);
    }
  );
});

describe('landlord replies with no follow-up', () => {
  const reply = (d: number): ExceptionMessage => ({
    case_id: 'c1', message_type: 'landlord_reply', created_at: iso(2026, 10, d),
  });
  const letter = (d: number): ExceptionMessage => ({
    case_id: 'c1', message_type: 'tribune_letter', created_at: iso(2026, 10, d),
  });
  const update = (d: number): ExceptionMessage => ({
    case_id: 'c1', message_type: 'tribune_update', created_at: iso(2026, 10, d),
  });

  test('reply after the last letter is flagged', () => {
    const q = run([kase()], [letter(20), reply(28)]);
    expect(q.landlord_reply).toHaveLength(1);
    expect(q.landlord_reply[0].detail).toBe('Landlord replied 3 days ago');
  });

  test('a later letter or update clears it', () => {
    expect(run([kase()], [reply(28), letter(29)]).landlord_reply).toHaveLength(0);
    expect(run([kase()], [reply(28), update(30)]).landlord_reply).toHaveLength(0);
  });

  test('tenant and system messages are not a follow-up', () => {
    const q = run(
      [kase()],
      [
        letter(20),
        reply(28),
        { case_id: 'c1', message_type: 'tenant_response', created_at: iso(2026, 10, 30) },
        { case_id: 'c1', message_type: 'system', created_at: iso(2026, 10, 30) },
      ]
    );
    expect(q.landlord_reply).toHaveLength(1);
  });

  test('landlord_responded status is flagged even without a reply message', () => {
    const q = run([kase({ status: 'landlord_responded' })]);
    expect(q.landlord_reply).toHaveLength(1);
    expect(q.landlord_reply[0].detail).toBe('Status is Landlord Responded');
  });

  test('a case is listed once when both signals apply', () => {
    const q = run([kase({ status: 'landlord_responded' })], [reply(30)]);
    expect(q.landlord_reply).toHaveLength(1);
  });

  test('terminal cases are skipped', () => {
    expect(run([kase({ status: 'resolved' })], [reply(30)]).landlord_reply).toHaveLength(0);
    expect(run([kase({ status: 'closed' })], [reply(30)]).landlord_reply).toHaveLength(0);
  });

  test('replies on another case do not leak', () => {
    const q = run(
      [kase(), kase({ id: 'c2' })],
      [{ ...reply(28), case_id: 'c2' }]
    );
    expect(q.landlord_reply.map((i) => i.case_id)).toEqual(['c2']);
  });
});

describe('statutory deadline within 3 days', () => {
  test.each([
    ['2026-10-31', 'Stored deadline is today'],
    ['2026-11-01', 'Stored deadline in 1 day'],
    ['2026-11-03', 'Stored deadline in 3 days'],
  ])('deadline %s is flagged', (statutory_deadline, detail) => {
    const q = run([kase({ statutory_deadline })]);
    expect(q.deadline_soon).toEqual([{ case_id: 'c1', kind: 'deadline_soon', detail }]);
  });

  test.each(['2026-11-04', '2026-10-30', '2026-09-21'])('deadline %s is not flagged', (statutory_deadline) => {
    expect(run([kase({ statutory_deadline })]).deadline_soon).toHaveLength(0);
  });

  test('terminal cases are skipped', () => {
    expect(
      run([kase({ status: 'declined', statutory_deadline: '2026-11-01' })]).deadline_soon
    ).toHaveLength(0);
  });
});

describe('overdue invoices', () => {
  const inv = (over: Partial<ExceptionInvoice>): ExceptionInvoice => ({
    case_id: 'c1', status: 'pending', due_date: '2026-11-15', ...over,
  });

  test('pending past its due date is overdue', () => {
    const q = run([], [], [inv({ due_date: '2026-10-21' })]);
    expect(q.invoice_overdue[0].detail).toBe('10 days past due');
  });

  test('pending on or before the due date is not', () => {
    expect(run([], [], [inv({ due_date: '2026-10-31' })]).invoice_overdue).toHaveLength(0);
    expect(run([], [], [inv({})]).invoice_overdue).toHaveLength(0);
  });

  test('status overdue or collections is flagged regardless of date', () => {
    expect(run([], [], [inv({ status: 'overdue' })]).invoice_overdue[0].detail).toBe('Marked overdue');
    expect(run([], [], [inv({ status: 'collections' })]).invoice_overdue[0].detail).toBe('In collections');
  });

  test('paid and waived are never overdue', () => {
    expect(
      run([], [], [inv({ status: 'paid', due_date: '2026-01-01' }), inv({ status: 'waived', due_date: '2026-01-01' })])
        .invoice_overdue
    ).toHaveLength(0);
  });
});

test('exceptionCount sums every bucket', () => {
  const q = run(
    [kase({ status: 'intake_submitted', statutory_deadline: '2026-11-02' })],
    [],
    [{ case_id: 'c1', status: 'overdue', due_date: '2026-10-01' }]
  );
  expect(exceptionCount(q)).toBe(3);
});
