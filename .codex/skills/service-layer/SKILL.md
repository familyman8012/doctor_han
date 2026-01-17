---
name: service-layer
description: Build Medihub server domain modules under app/src/server/domain (repository/mapper/service). Use when adding server-side data access or domain logic.
---

# Service Layer

## Workflow
1. Create or extend:
   - `app/src/server/<domain>/repository.ts`
   - `app/src/server/<domain>/mapper.ts`
   - `app/src/server/<domain>/service.ts` (only if needed)
2. Add `import "server-only";` at the top of server modules.
3. Use Supabase types:
   - `import type { Database } from "@/lib/database.types";`
4. Map DB rows to DTOs in the mapper.
5. Convert Supabase errors to `ApiError` (use `internalServerError` as needed).

## References
- `.claude/reference/service-patterns.md`
- `.claude/reference/service-layer-templates.md`

## Validate
- `cd app; pnpm type-check`
