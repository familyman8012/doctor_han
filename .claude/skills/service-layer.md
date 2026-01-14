---
name: service-layer
description: Generates server domain modules (repository/mapper/service) following Medihub architecture.
---

# Server Domain Module Skill

`app/src/server/<domain>/` 아래에 도메인 모듈을 표준 구조로 생성합니다.

## Project-specific Rules

### 파일 구조(권장)

```
app/src/server/<domain>/
├── repository.ts   # Supabase 쿼리
├── mapper.ts       # Row → DTO 변환
└── service.ts      # 복합 로직(필요할 때만)
```

### 필수 패턴

1. **서버 전용 표시**

```ts
import \"server-only\";
```

2. **Supabase 타입/클라이언트**

```ts
import type { Database } from \"@/lib/database.types\";
import type { SupabaseClient } from \"@supabase/supabase-js\";
```

3. **에러 변환**

```ts
import { internalServerError } from \"@/server/api/errors\";
// supabase error → ApiError로 변환해 메시지/코드 통제
```

## Templates

- `.claude/reference/service-patterns.md`
- `.claude/reference/service-layer-templates.md`

## 후속 작업

```bash
cd app
pnpm type-check
```

