---
name: api-generator
description: Generate Next.js BFF API routes for Medihub in app/src/app/api/**/route.ts using withApi, Zod parsing, ok/created/fail responses, and auth guards. Use when adding or updating API endpoints, request/response validation, or API error handling in this repo.
---

# Api Generator

## Workflow
1. Read the domain PRD: `app/doc/domains/<domain>/prd.md`.
2. Review patterns/templates:
   - `.claude/reference/api-patterns.md`
   - `.claude/reference/api-route-templates.md`
3. Define/extend Zod schemas in `app/src/lib/schema/<domain>.ts` and parse inputs with `.parse()`.
4. Implement `app/src/app/api/<resource>/route.ts` (and `[id]/route.ts` as needed).
5. Wrap handlers with `withApi`, enforce auth/role guards, and use `ok/created/fail`.
6. If server-side logic is needed, add modules under `app/src/server/<domain>/`.

## Guardrails
- Do not use Server Actions.
- Do not access the DB directly from the client.
- Use `ApiError` for consistent error handling.

## Validate
- `cd app; pnpm lint`
- `cd app; pnpm type-check`
- `cd app; pnpm test`