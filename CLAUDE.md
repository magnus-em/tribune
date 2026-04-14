# Tribune

CT security deposit recovery service. Helps tenants recover wrongfully withheld deposits using CT § 47a-21.

## Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS v3 + shadcn/ui (Radix-based, NOT base-ui)
- react-hook-form + zod (forms/validation)

## Key Commands
- `npm run dev` — start dev server on port 3000
- `npm run build` — production build
- `npm run lint` — run ESLint

## Project Structure
- `src/app/` — Next.js App Router pages
- `src/components/ui/` — shadcn/ui components (Tailwind v3 / Radix primitives)
- `src/lib/supabase/` — Supabase client utilities (client.ts, server.ts, middleware.ts)
- `src/lib/schemas/` — Zod validation schemas
- `src/lib/types/` — TypeScript types
- `supabase/schema.sql` — Database schema + RLS policies

## Architecture Notes
- All shadcn components use Radix UI primitives (NOT @base-ui/react)
- CSS variables use HSL format (Tailwind v3 compatible)
- Money stored as integer cents
- Admin access via `is_admin` boolean on profiles table
- Middleware protects /dashboard/* (auth) and /admin/* (auth + admin)
- Case data stored in sessionStorage during intake, created after auth callback
