URGENT: backend down since 2026-10-31

`/api/health` still returns 503 (`{"ok":false,"auth":false,"db":false}`) as of
2026-11-01 13:07 UTC. Nobody can sign in or start a case, so the build loop has
stopped shipping until this is fixed. Only Magnus can restore it (free):

1. supabase.com → project `tribune` → **Restore project** (it was paused for
   inactivity on the free tier).
2. Wait for it to come up, then open https://usetribune.org/api/health and
   check for `{"ok":true,...}`.
3. Try Google sign-in on https://usetribune.org/login.

The daily health cron keeps it awake after that. Rest of SETUP.md Part A
(Google OAuth publishing status, Resend SMTP) is also needed before a tenant
can sign up.

---

# Escalations

Since 2026-10-30 the agent asks Magnus about only two things: **spending money**
and **contacting people** (`ops/CHARTER.md`). Each ask comes with a
recommendation. Answer inline under **Answer:**; a word is enough. The next tick
applies it. Unanswered asks never default to yes.

Things only Magnus can physically do (logins, accounts, dashboards) live in
`ops/SETUP.md`. They're to-dos, not permission requests.

---

## Digest — 2026-10-30 (evening)

Magnus granted full autonomy: the agent commits and merges whenever it wants, and
asks only before spending money or contacting people. The charter, loop, and
routine prompts now say so. The build tick runs every 2 hours.

Shipped today: the triage function (#5, merged by the 3pm build tick on its own),
the letter fixes (#4), and the re-plan and autonomy charter (#3).

Legal changes: #4 changed Letters 2 and 3 so they no longer state false facts
(the "no response" and "no itemization" claims and the "no further demand"
promise). Citations and damages math are unchanged.

Closed:
- **E-002 (attorney)** — declined by Magnus 2026-10-30.
- **E-003 (letter defects)** — fixed in #4.
- **E-004 (loosen the charter)** and **E-005 (self-merge)** — superseded by full
  autonomy, 2026-10-30.

Open: none that need an answer.

The one to-do that still matters: **`ops/SETUP.md` Part A (~20 min, free).** Prod
may not be able to send email until it's done, so letters, notifications, and
invoices all wait on it.
