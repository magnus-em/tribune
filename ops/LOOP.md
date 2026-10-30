# Operating Loop

How each scheduled agent run ("tick") works. Every tick starts with no memory of
earlier ticks; the repo is the memory. The routine prompt is just:
"You are Tribune's operating agent. Run the `<kind>` tick defined in ops/LOOP.md."

## Every tick starts the same way

1. Sync: `git fetch && git checkout main && git pull`.
2. Read in this order: `ops/CHARTER.md`, `ops/PLAN.md`, `ops/BACKLOG.md`, the last
   5 entries of `ops/JOURNAL.md`, and `ops/ESCALATIONS.md`. Apply any answers
   Magnus left in ESCALATIONS before doing anything else.
3. Health check: CI on `main` (`gh run list --branch main --limit 3`), prod up
   (`curl -sf https://usetribune.org`), new Sentry issues when access exists.
   If anything is red, fixing it **is** this tick.

## Build tick (whenever compute is available)

1. Take the top unblocked item in BACKLOG.md "Now". Skip items marked
   `blocked:`; if everything is blocked, take the top item from "Next".
2. Size it to one PR. If it's bigger, split it in BACKLOG.md and take the first slice.
3. Branch `loop/<short-slug>`. Implement following CLAUDE.md conventions.
4. Verify: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. For UI,
   verify in the preview browser once staging exists. Until then, say in the PR
   why it wasn't verified in a browser.
5. Open a PR. Its body states the charter tier and why.
   - 🟢 → merge when CI is green (`gh pr merge --squash --delete-branch`).
   - 🟡 → add an ESCALATIONS entry with a default date of now + 72 h; merge on a
     later tick if there's no veto by then.
   - 🔴 → add an ESCALATIONS entry; never merge without Magnus's yes.
6. Update BACKLOG.md (check off the item or move it), then write the JOURNAL entry.

## Ops tick (daily)

Only meaningful once there are real cases and read access to prod (SETUP.md).

1. Exception queue: new intakes awaiting triage, landlord replies awaiting a next
   step, failed dispatches, invoices overdue, cases within 3 days of a deadline.
2. Act only within the charter. Anything outside it becomes an ESCALATIONS entry.
3. Never send to a landlord without the tenant's recorded approval.
4. JOURNAL: counts only, no names, emails, addresses, or amounts.

## Review tick (weekly, Mondays)

1. Run `ops/metrics.sql` (aggregate only) and append the results to METRICS.md.
2. Reprioritize BACKLOG.md against PLAN.md milestones. Update PLAN.md §1 if facts changed.
3. Write the digest at the top of ESCALATIONS.md: what shipped, what the numbers
   say, and at most 3 decisions, each with a recommendation and a default.
4. Close out answered escalations into JOURNAL.

## JOURNAL entry format

```
## YYYY-MM-DD — <tick kind> — <one-line outcome>
- Did: …
- Learned: …
- Next: …
```

## When to stop a tick early

- The same item failed twice on earlier ticks → mark it `blocked: <reason>` in
  BACKLOG.md, escalate, and move on.
- Anything that looks like a security, data, or legal incident → stop, write an
  ESCALATIONS entry marked URGENT, and send a push notification if available.

## Routines (created 2026-10-30)

Cloud routines on `magnus-em/tribune`, Default environment, model `claude-opus-5-5`,
no MCP connectors (they auto-attach Gmail/Calendar/Docs on create; cleared on purpose).
Manage at https://claude.ai/code/routines.

| Routine | ID | Schedule (America/New_York) |
|---|---|---|
| Tribune build tick | `trig_01ANWqJmaX6zX8ThUzf13cvQ` | 9am, 3pm, 9pm daily |
| Tribune review tick | `trig_01XatdEWsrUsbUg2gxmHV5F3` | Mondays 8am |
| Tribune ops tick | not created | when real cases exist and the read-only role is in the cloud env |

## Open PRs are claimed work

Self-merge can be blocked (the permission classifier refused `gh pr merge` on
2026-10-30). When PRs pile up unmerged, a fresh tick would otherwise see the same
backlog and redo the same item. So before choosing an item:
- `gh pr list --state open --json number,title,headRefName`.
- An item that already has an open `loop/` or `ops/` PR is taken. Skip it.
- If 3 or more loop PRs are open and unmerged, start nothing new. Add one line to
  the newest open PR asking Magnus to merge, and stop.
