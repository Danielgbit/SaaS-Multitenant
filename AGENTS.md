# Project context

## Git remote

- `gitlab` → GitLab (primary remote)

Issues, merge requests, and CI/CD live on GitLab.

Use `@gitlab` for GitLab operations: issues, MRs, pipelines.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion |
| Backend | Next.js Server Actions, Supabase (Postgres 17 + RLS) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Email | Resend |
| Validation | Zod 4 |
| CI/CD | GitLab CI (`.gitlab-ci.yml`) |

## Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `perf:`, `docs:`
- Branches: `fix/*`, `feat/*`, `refactor/*`, `chore/*`
- DB migrations in `supabase/migrations/`
- Server Actions in `src/app/actions/`
- Design tokens source of truth: `src/hooks/useThemeColors.ts`
