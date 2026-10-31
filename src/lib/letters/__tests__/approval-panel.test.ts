import {
  approvalPanelState,
  parseContactDetail,
  type DispatchPlan,
} from '../approve-and-send';

const blocked = (reason: string): DispatchPlan =>
  ({ ok: false, reason, message: `blocked: ${reason}` }) as DispatchPlan;

describe('approvalPanelState', () => {
  it('shows the exact server-generated letter when the plan is ok', () => {
    const state = approvalPanelState({ ok: true, title: 'Demand Letter 1 — X', body: 'LETTER' }, true);
    expect(state).toEqual({ kind: 'ready', title: 'Demand Letter 1 — X', body: 'LETTER' });
  });

  it('asks for the landlord email when it is missing', () => {
    const state = approvalPanelState(blocked('no_landlord_email'), true);
    expect(state).toMatchObject({ kind: 'needs', need: 'landlord_email' });
  });

  it('asks for the forwarding address when it is missing', () => {
    const state = approvalPanelState(blocked('no_forwarding_address'), true);
    expect(state).toMatchObject({ kind: 'needs', need: 'forwarding_address' });
  });

  it('asks for the lease when triage blocks and no lease is on file', () => {
    expect(approvalPanelState(blocked('triage'), false)).toMatchObject({ kind: 'needs', need: 'lease' });
  });

  it('hides when triage blocks for a reason the tenant cannot fix', () => {
    expect(approvalPanelState(blocked('triage'), true)).toEqual({ kind: 'hidden' });
  });

  it.each(['dispatch_paused', 'status', 'wrong_letter_number', 'letter_not_offered', 'cooldown', 'not_authorized'])(
    'hides for %s',
    (reason) => {
      expect(approvalPanelState(blocked(reason), false)).toEqual({ kind: 'hidden' });
    }
  );
});

describe('parseContactDetail', () => {
  it('accepts and normalizes a landlord email', () => {
    expect(parseContactDetail('landlord_email', '  Pat@Example.com ')).toEqual({ ok: true, value: 'pat@example.com' });
  });

  it.each(['', 'not-an-email', 'a@b', 'a b@c.com'])('rejects landlord email %p', (raw) => {
    expect(parseContactDetail('landlord_email', raw).ok).toBe(false);
  });

  it('accepts a forwarding address with a ZIP and collapses whitespace', () => {
    expect(parseContactDetail('forwarding_address', ' 10 Oak St,\n Hartford, CT  06103 ')).toEqual({
      ok: true,
      value: '10 Oak St, Hartford, CT 06103',
    });
  });

  it.each(['', '10 Oak St', 'Somewhere in Hartford, CT'])('rejects forwarding address %p', (raw) => {
    expect(parseContactDetail('forwarding_address', raw).ok).toBe(false);
  });
});
