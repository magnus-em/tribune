import {
  approvalPanelState,
  nextLetterToOffer,
  parseContactDetail,
  RESIDENTIAL_NEED_MESSAGE,
  type DispatchPlan,
} from '../approve-and-send';

const blocked = (reason: string): DispatchPlan =>
  ({ ok: false, reason, message: `blocked: ${reason}` }) as DispatchPlan;

describe('approvalPanelState', () => {
  it('shows the exact server-generated letter when the plan is ok', () => {
    const state = approvalPanelState({ ok: true, title: 'Demand Letter 1 — X', body: 'LETTER' }, true, true);
    expect(state).toEqual({ kind: 'ready', title: 'Demand Letter 1 — X', body: 'LETTER' });
  });

  it('asks for the landlord email when it is missing', () => {
    const state = approvalPanelState(blocked('no_landlord_email'), true, true);
    expect(state).toMatchObject({ kind: 'needs', need: 'landlord_email' });
  });

  it('asks for the forwarding address when it is missing', () => {
    const state = approvalPanelState(blocked('no_forwarding_address'), true, true);
    expect(state).toMatchObject({ kind: 'needs', need: 'forwarding_address' });
  });

  it('asks for the lease when triage blocks and no lease is on file', () => {
    expect(approvalPanelState(blocked('triage'), false, true)).toMatchObject({ kind: 'needs', need: 'lease' });
  });

  it('hides when triage blocks for a reason the tenant cannot fix', () => {
    expect(approvalPanelState(blocked('triage'), true, true)).toEqual({ kind: 'hidden' });
  });

  it('asks the tenant to confirm a residential tenancy when no answer is on record', () => {
    expect(approvalPanelState(blocked('triage'), true, null)).toEqual({
      kind: 'needs',
      need: 'residential',
      message: RESIDENTIAL_NEED_MESSAGE,
    });
  });

  it('asks for the lease before the residential answer', () => {
    expect(approvalPanelState(blocked('triage'), false, null)).toMatchObject({ kind: 'needs', need: 'lease' });
  });

  it('hides after a "not residential" answer: the tenant cannot undo it here', () => {
    expect(approvalPanelState(blocked('triage'), true, false)).toEqual({ kind: 'hidden' });
  });

  it('the residential message speaks as Tribune and gives no advice', () => {
    expect(RESIDENTIAL_NEED_MESSAGE).toMatch(/^Tribune /);
    expect(RESIDENTIAL_NEED_MESSAGE).not.toMatch(/\b(we|us|our|I)\b/);
  });

  it.each(['dispatch_paused', 'status', 'wrong_letter_number', 'letter_not_offered', 'cooldown', 'not_authorized'])(
    'hides for %s',
    (reason) => {
      expect(approvalPanelState(blocked(reason), false, null)).toEqual({ kind: 'hidden' });
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

describe('approvalPanelState — follow-up wait', () => {
  it('shows when the next letter becomes available', () => {
    const plan = {
      ok: false,
      reason: 'letter_not_offered',
      message: 'Letter 2 becomes available on November 3, 2026.',
      availableOn: '2026-11-03',
    } as DispatchPlan;
    expect(approvalPanelState(plan, true, true)).toEqual({
      kind: 'waiting',
      message: 'Letter 2 becomes available on November 3, 2026.',
    });
  });

  it('stays hidden for a block that is not a wait', () => {
    expect(approvalPanelState(blocked('letter_not_offered'), true, true)).toEqual({ kind: 'hidden' });
    const paused = { ok: false, reason: 'dispatch_paused', message: 'x', availableOn: '2026-11-03' } as DispatchPlan;
    expect(approvalPanelState(paused, true, true)).toEqual({ kind: 'hidden' });
  });
});

describe('nextLetterToOffer', () => {
  it.each([
    ['intake_submitted', 0, 1],
    ['under_review', 0, 1],
    ['awaiting_landlord', 1, 2],
    ['awaiting_landlord', 2, 3],
    ['awaiting_landlord', 3, null],
    ['awaiting_landlord', 0, null],
    ['correspondence_ready', 0, null],
    ['landlord_responded', 1, 2],
    ['landlord_responded', 2, 3],
    ['landlord_responded', 3, null],
    ['landlord_responded', 0, null],
    ['letter_sent', 1, null],
    ['resolved', 1, null],
    ['closed', 2, null],
    ['under_review', 1, null],
  ] as const)('%s with letter %i sent → %p', (status, current, expected) => {
    expect(nextLetterToOffer({ status, current_letter_number: current })).toBe(expected);
  });
});

describe('approvalPanelState — cooldown wait', () => {
  it('shows when the next letter becomes available after the cooldown', () => {
    const plan = {
      ok: false,
      reason: 'cooldown',
      message: 'A letter was sent on October 28, 2026. Tribune waits 5 days between letters, so Letter 2 becomes available on November 2, 2026.',
      availableOn: '2026-11-02',
    } as DispatchPlan;
    expect(approvalPanelState(plan, true, true)).toEqual({ kind: 'waiting', message: plan.ok ? '' : plan.message });
  });
});
