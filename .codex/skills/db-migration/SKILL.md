---
name: db-migration
description: Create Supabase SQL migrations for Medihub under app/supabase/migrations, including schema changes and RLS/policies. Use when adding or modifying tables, columns, enums, or access policies.
---

# Db Migration

## Workflow
1. Create a new migration:
   - `cd app; pnpm db:new -- "<name>"`
2. Edit only the newly created file in `app/supabase/migrations/`.
3. Apply RLS and policies for any new/changed tables.
4. Follow templates:
   - `.claude/reference/db-migration-templates.md`
   - `.claude/reference/supabase-patterns.md`

## Guardrails
- Never edit existing migration files; add a new one instead.
- Consider RLS impact for every schema change.

## Follow-up
- `cd app; pnpm db:migrate`
- `cd app; pnpm db:gen -- --local` (if local DB is running)
- `cd app; pnpm type-check`