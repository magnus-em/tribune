URGENT: backend down since 2026-10-31

`/api/health` still returns 503 (`{"ok":false,"auth":false,"db":false}`) as of
2026-11-02 13:10 UTC. Nobody can sign in or start a case, so the build loop has
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

## Digest — week of 2026-10-26 (review, 2026-11-02)

**The one thing:** the site's backend has been down since 10-31 (Supabase project
paused), so nobody can sign in or start a case. Restoring it is free and takes a
few minutes; steps are in the URGENT block above. If Supabase says the project
can't be restored from the dashboard, add a line saying so here; the next tick
will plan a fresh free project instead.

**Shipped (#2–#27, all CI green, nothing reverted; the last five are outage journal entries).** The whole case flow is now
built: intake asks if the tenancy is residential; auto-triage; the tenant reads
and approves each letter in the app before Tribune sends it (Letters 1–3);
a daily cron tells the tenant when Letter 2 or 3 is ready, with one reminder; a
"your landlord replied" panel; an admin exception queue. Growth side: the
`/moved-out` page for summer movers, a CT deposit-law guide, sitemap and search
metadata, and outreach drafts. Safety: email templates now escape tenant input,
fonts no longer break the build, and a `/api/health` check plus daily keep-alive.
Since 10-31 the loop has built nothing, by design, because of the outage.

**Legal changes** (merged this week):
- #4 Letters 2 and 3 no longer claim "no response" / "no itemization" or promise "no further demand".
- #6 Tenant timeline labels the statutory deadline 21 days (was 30).
- #7, #8 Letters are regenerated server-side from the fixed templates at approval; tenant ticks an authorization statement; Letter 1 requires a forwarding address. Template text unchanged.
- #9 `/moved-out` quotes § 47a-21(d) verbatim; a test checks it against LEGAL_REVIEW_47a-21.md.
- #12 CT law guide quotes § 47a-21(d) verbatim and restates the two deadline branches and the damages rule.
- #13 Follow-up timing: Letter 2 offered 10 business days after Letter 1, Letter 3 7 business days after Letter 2. This is Tribune's schedule, not a statutory period.
- #17 After a landlord reply, Letter 2/3 can be offered without that wait (existing "did not resolve the matter" wording; cooldown and approval still apply).
- #18, #19 Triage requires a "yes, residential" answer; "no" declines the case.
- #21 Email templates HTML-escape interpolated values; letter wording unchanged.
- Known gap, not changed: the stored deadline is move-out + 21 days and ignores the
  "15 days after forwarding address" branch. Fixing it needs a migration (BACKLOG Next).

**Numbers:** none. There's no read-only database access in the cloud environment
(SETUP Part B), and with the backend paused there was no usage to count.

**What blocks the first paid recovery:** not code. (1) Restore Supabase. (2) The
rest of SETUP Part A (~20 min: Google sign-in to "In production", Resend SMTP in
Supabase, Vercel env vars). (3) Tenants: nobody has been invited yet.

**Ask (contacting people):**
- **E-006 — Post the summer-mover outreach** (`ops/outreach/posts.md`: Yale lists,
  r/newhaven, Facebook groups). Recommendation: **yes, but only after (1) and (2)**,
  so people who click can actually sign up. Every week of delay ages that cohort's
  claims. Posting is free.
  **Answer:**

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
