---
description: Supabase 타입 생성(database.types.ts)
---

# Gen Types - Supabase 타입 생성

## 목적

Supabase 스키마에서 TypeScript 타입을 생성하여 `app/src/lib/database.types.ts`를 갱신합니다.

## 사용법

```
/gen-types
```

## 실행 명령

```bash
cd app
pnpm db:gen
```

### 로컬 DB 기반 생성(권장, 개발 중)

```bash
cd app
pnpm db:start
pnpm db:gen -- --local
```

## 생성되는 파일

- `app/src/lib/database.types.ts`
  - `pnpm db:gen`으로 자동 생성
  - 수동 편집 금지

## 언제 실행하나?

- 마이그레이션 적용 후
- DB 테이블/컬럼/enum 변경 후
- 타입 불일치(TypeScript 에러)가 의심될 때

## 후속 검증

```bash
cd app
pnpm type-check
```

