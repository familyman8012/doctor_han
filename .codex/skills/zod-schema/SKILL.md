---
name: zod-schema
description: Create and update Zod schemas for Medihub in app/src/lib/schema/*.ts. Use when defining DTOs, query/body validation, or response shapes.
---

# Zod Schema

## Workflow
1. Add/extend schemas in `app/src/lib/schema/<domain>.ts` (or `common.ts`).
2. Make input schemas `.strict()` to reject unknown fields.
3. Prefer shared helpers (for example: `zUuid`, `zPaginationQuery`, `zNonEmptyString`).
4. Keep response shape consistent with `code/data/message`.
5. Parse inputs in API routes using `.parse()`.

## References
- `.claude/reference/zod-patterns.md`
- `.claude/reference/zod-schema-templates.md`

## Validate
- `cd app; pnpm type-check`