# Tribune

Connecticut security-deposit recovery service for residential tenants. Helps tenants recover wrongfully withheld deposits under CT § 47a-21 on a 15% contingency. Tribune drafts and dispatches demand letters directly to landlords on the tenant's behalf — no attorney in the loop, no print-and-mail.

This repo holds the tenant-facing web app, admin console, and integrations (Supabase, Resend, Sentry, PostHog).

## Where to start

- [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md) — what Tribune is and the strategic thesis.
- [`SPEC.md`](./SPEC.md) — user stories, flows, and rules.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — stack, data model, and module layout.
- [`TASKS.md`](./TASKS.md) — what's built, in progress, and next.
- [`CLAUDE.md`](./CLAUDE.md) — conventions and footguns for anyone (human or AI) editing this codebase.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v3 · shadcn/ui · Supabase (Postgres + Auth + RLS + Storage) · Resend · Sentry · PostHog · Vercel.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
npm test         # Jest
```

Environment variables — see `.env.local.example` (or pull from Vercel via `vercel env pull`). Required for local dev: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

## Deploying

`main` auto-deploys to Vercel production. Preview deployments are created per branch.

## Legal posture

The product drafts legal correspondence based on CT § 47a-21. Citations, deadlines, and damages math have legal consequences — see the "Legal Stakes" section in `CLAUDE.md` before editing letter templates or statute references. Every tenant-facing surface carries an "information, not legal advice" disclaimer.
