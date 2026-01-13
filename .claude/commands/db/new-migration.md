---
description: Supabase 마이그레이션 생성
---

# New Migration - 마이그레이션 생성

## 목적

Supabase CLI 래퍼(`pnpm db:new`)로 새 마이그레이션 파일을 생성합니다.

## 사용법

```
/new-migration [description]
```

## 실행

```bash
cd app
pnpm db:new -- "$ARGUMENTS"
```

## 규칙 (fail-fast)

- **커밋된(HEAD) 마이그레이션 파일은 수정하지 않습니다.** (훅이 차단)
- 스키마 변경은 “새 마이그레이션 추가”로만 진행합니다.

## 후속 작업

```bash
cd app
pnpm db:migrate
pnpm db:status
pnpm db:gen -- --local
```

