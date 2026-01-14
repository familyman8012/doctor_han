---
description: Supabase SQL 마이그레이션 생성
---

# New Migration - 마이그레이션 생성(Supabase)

## 목적

새로운 Supabase SQL 마이그레이션 파일을 생성합니다.

## 사용법

```
/new-migration <name>
```

예시:
- `/new-migration add_profiles_avatar_url`
- `/new-migration review_full_features`

## 실행 명령

```bash
cd app
pnpm db:new -- "<name>"
```

## 생성 위치

- 폴더: `app/supabase/migrations/`
- 파일명: `<timestamp>_<name>.sql` (Supabase CLI가 타임스탬프를 부여)

## 규칙 (fail-fast)

- **기존 마이그레이션 파일은 수정하지 않습니다.**
  - 이미 커밋된 파일을 수정하면 환경 간 드리프트/재현 불가능 문제가 발생합니다.
  - 정정이 필요하면 “새 마이그레이션”으로 처리합니다.

## 후속 작업(권장)

```bash
cd app
pnpm db:migrate
pnpm db:gen -- --local   # 로컬 DB 기반 타입 재생성(필요 시)
pnpm type-check
```

