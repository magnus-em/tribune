# Operating Loop

How each scheduled agent run ("tick") works. Every tick starts with no memory of
earlier ticks; the repo is the memory. Authority: `ops/CHARTER.md` (full autonomy
except spending money and contacting people).

## Every tick starts the same way

1. Sync: `git fetch && git checkout main && git pull`.
2. Read in this order: `ops/CHARTER.md`, `ops/PLAN.md`, `ops/BACKLOG.md`, the last
   5 entries of `ops/JOURNAL.md`, and `ops/ESCALATIONS.md`. Apply any answers
   Magnus left in ESCALATIONS before doing anything else.
3. Health check: CI on `main`, the backend up (`curl -sf https://usetribune.org/api/health`),
   new Sentry issues when access exists. If anything is red, fixing it **is** this tick.
   The homepage is static and returns 200 even with the backend dead. From
   2026-10-30 to 10-31 the loop merged ~20 PRs while the Supabase project was paused
   and nobody could sign in. Check `/api/health`, not the homepage.
   - **Backend down (503 or no answer):** the loop can't fix it. Restoring a paused
     project needs Magnus's Supabase login. Make sure the top of ESCALATIONS.md
     starts with `URGENT: backend down since <date>`, with the restore steps
     (add it once; don't repeat it each tick), then end the tick. Don't build.
     Features shipped onto a dead backend reach no one.
4. Open PRs are claimed work (see below).

## GitHub in the cloud

`gh` isn't authenticated in the cloud environment. Use the GitHub MCP tools for
PRs, checks, comments, and merges. `git push` works. Squash-merge your own PR
once the `check` job passes on it, then delete the branch.

## Build tick (every 2 hours)

1. Take the top unblocked item in BACKLOG.md "Now". Skip items marked `blocked:`
   or 🔴. If everything is blocked, take the top item from "Next".
2. Size it to one PR. If it's bigger, split it in BACKLOG.md and take the first slice.
3. Branch `loop/<short-slug>`. Implement following CLAUDE.md conventions.
4. Verify: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. For UI,
   verify in the preview browser once staging exists. Until then, say in the PR
   why it wasn't verified in a browser.
5. Update BACKLOG.md (check off the item or move it) and write the JOURNAL entry,
   in the same PR.
6. Open the PR, wait for `check` (up to ~15 minutes), and merge it. If CI fails,
   fix it and push again. If you can't make it green, leave the PR open, say why
   in its description, and mark the item `blocked:` on main.
7. If there's time and the item was small, take the next one (at most 2 items per tick).

🔴 items (spend, contacting people): write an ESCALATIONS entry with your
recommendation and stop that item. Never do them.

## Ops tick (daily)

Only meaningful once there are real cases and read access to prod (SETUP.md).

1. Exception queue: new intakes awaiting triage, landlord replies awaiting a next
   step, failed dispatches, invoices overdue, cases within 3 days of a deadline.
2. The agent doesn't message anyone. Product features send messages only when a
   user's own action is behind them.
3. Never send to a landlord without the tenant's recorded approval.
4. JOURNAL: counts only, no names, emails, addresses, or amounts.

## Review tick (weekly, Mondays)

1. Run `ops/sql/metrics.sql` (aggregate only) and append the results to METRICS.md.
2. Reprioritize BACKLOG.md against PLAN.md milestones. Update PLAN.md §1 if facts changed.
3. Write the digest at the top of ESCALATIONS.md: what shipped, a **Legal changes**
   list (every merged change to letters, citations, or deadline/damages math), what
   the numbers say, and any 🔴 asks (spend, contacting people), each with a
   recommendation.
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
  BACKLOG.md and move on.
- Anything that looks like a security, data, or legal incident → set
  `DISPATCH_PAUSED` if it involves dispatch, stop, write an ESCALATIONS entry
  marked URGENT, and send a push notification if available.

## Open PRs are claimed work

Ticks can overlap, and a merge can fail. So before choosing an item:
- List open PRs. An item that already has an open `loop/` or `ops/` PR is taken.
  Skip it.
- An open loop PR with green CI and no stated reason to stay open: merge it first.
- If 3 or more loop PRs are open and can't be merged, start nothing new. Note it
  in the JOURNAL and stop.

## Routines

Cloud routines on `magnus-em/tribune`, Default environment, model `claude-opus-5-5`,
no MCP connectors (they auto-attach Gmail/Calendar/Docs on create; cleared on purpose).
Manage at https://claude.ai/code/routines.

| Routine | ID | Schedule (America/New_York) |
|---|---|---|
| Tribune build tick | `trig_01ANWqJmaX6zX8ThUzf13cvQ` | every 2 hours, on the hour |
| Tribune review tick | `trig_01XatdEWsrUsbUg2gxmHV5F3` | Mondays 8am |
| Tribune ops tick | not created | when real cases exist and the read-only role is in the cloud env |

Runs draw on Magnus's Claude subscription. They must never push the account onto
paid extra usage. If runs start failing on usage limits, lower the cadence;
don't look for another way to run.
