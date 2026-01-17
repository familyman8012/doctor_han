# Medihub (doctor_han) - Codex Agent Guide

나랑 이야기할때는 한국말로 해주세요.

## Project snapshot

- Product: B2B marketplace connecting doctors and vendors (leads, reviews, admin approval).
- Stack: Next.js App Router, Supabase (Postgres/Auth/Storage), pnpm, Tailwind CSS.
- State/data: TanStack Query, Zustand, Axios, React Hook Form + Zod, nuqs.

## Non-negotiable rules

- No Server Actions or direct DB access from the client.
- All data access goes through BFF API routes: `app/src/app/api/**/route.ts`.
- Validate inputs with Zod (`app/src/lib/schema/*.ts`) and parse query/body with `.parse()`.
- Use `withApi` + `ApiError` + `ok/created/fail` response helpers.
- Use `service_role` only on the server.

## Project structure (high level)

- `app/src/app/(page)/**`: UI pages
- `app/src/app/api/**/route.ts`: BFF routes
- `app/src/api-client/`: API client
- `app/src/components/`: UI + widgets
- `app/src/lib/schema/`: Zod DTO/query/response
- `app/src/server/`: server domain modules
- `app/supabase/migrations/`: SQL migrations
- `.claude/reference/`: patterns and templates
- `.agents/plans/`: plan documents

## Workflow (Codex)

1. Read PRD: `app/doc/domains/<domain>/prd.md`.
2. Check current work: `app/doc/todo.md`.
3. Use/refresh generated indexes if needed:
   - `python .claude/scripts/refresh.py --apply`
4. Plan in `.agents/plans/<domain>__<feature>.md` if scope is non-trivial.
5. Implement with BFF + Zod + service-layer patterns.
6. Validate before finishing (see commands below).

## Codex command equivalents

- Refresh generated refs: `python .claude/scripts/refresh.py --apply`
- New migration: `cd app; pnpm db:new -- "<name>"`
- Generate types: `cd app; pnpm db:gen` (or `pnpm db:gen -- --local`)
- Validate: `cd app; pnpm lint && pnpm type-check && pnpm test && pnpm build`
- Dev server: `cd app; pnpm dev`
- Local DB: `cd app; pnpm db:start|stop|status|reset|migrate`

## Conventions worth keeping

- React Query is used directly in components (no custom hooks).
- Tailwind class order: layout -> box model -> text -> UI -> borders/shadows/background.
- Prefer short, clear filenames (avoid very long names).

## References

- `CLAUDE.md`: SSOT for rules and conventions.
- `.claude/PRD.md`: global product requirements.
- `.claude/reference/*.md`: patterns, templates, architecture.
- `.claude/reference/_generated/*`: generated indexes.
- `app/doc/domains/**/{prd,ui,tsd}.md`: domain specs.

## Test accounts (local)

- admin: admin@medihub.local / Password123!
- doctor: doctor1@medihub.local / Password123!
- vendor: vendor01@medihub.local / Password123!

## Skills

- api-generator: Generate Next.js BFF API routes for Medihub in app/src/app/api/\*\*/route.ts using withApi, Zod parsing, ok/created/fail responses, and auth guards. Use when adding or updating API endpoints, request/response validation, or API error handling in this repo. (file: C:/workspace/doctor_han/.codex/skills/api-generator/SKILL.md)
- db-migration: Create Supabase SQL migrations for Medihub under app/supabase/migrations, including schema changes and RLS/policies. Use when adding or modifying tables, columns, enums, or access policies. (file: C:/workspace/doctor_han/.codex/skills/db-migration/SKILL.md)
- service-layer: Build Medihub server domain modules under app/src/server/domain (repository/mapper/service). Use when adding server-side data access or domain logic. (file: C:/workspace/doctor_han/.codex/skills/service-layer/SKILL.md)
- zod-schema: Create and update Zod schemas for Medihub in app/src/lib/schema/\*.ts. Use when defining DTOs, query/body validation, or response shapes. (file: C:/workspace/doctor_han/.codex/skills/zod-schema/SKILL.md)
