---
description: 프로젝트 컨텍스트 로드
---

# Prime - 컨텍스트 로드

## 목적

새 기능 개발/수정 전에 필요한 컨텍스트를 로드합니다. (PIV: Prime → Implement → Validate)

## 사용법

```
/prime <domain/feature>
```

예시:
- `/prime vendor/search`
- `/prime lead/status`
- `/prime admin/verifications`

## 실행 내용

### 0) 생성 문서 갱신(권장)

“현재 레포 사실”을 먼저 고정합니다(드리프트 방지).

- Claude Code: `/refresh`
- CLI: `python3 .claude/scripts/refresh.py --apply`

갱신 후 우선 참고:

- `.claude/reference/_generated/project-facts.md`
- `.claude/reference/_generated/api-routes-index.md`
- `.claude/reference/_generated/domain-specs-index.md`
- `.claude/reference/_generated/migrations-index.md`

### 1) PRD/TSD/UI 문서 확인

```
app/doc/domains/<domain>/prd.md
app/doc/domains/<domain>/tsd.md   (선택)
app/doc/domains/<domain>/ui.md    (선택)
```

문서가 없다면 먼저 생성:

- `/new-prd <domain/feature>`
- `/new-tsd <domain/feature>`

스켈레톤 생성만으로 “스펙이 준비됨”이 아닙니다. `/plan-feature`로 넘어가기 전 DoR을 통과해야 합니다:

- `.claude/reference/spec-templates.md`

### 2) 관련 코드 파악

- API Routes(BFF): `app/src/app/api/`
- guards: `app/src/server/auth/guards.ts`
- Supabase clients: `app/src/server/supabase/*`
- server 모듈: `app/src/server/<domain>/*`
- schema: `app/src/lib/schema/*.ts`
- migrations: `app/supabase/migrations/*.sql`

### 3) 유사 패턴 탐색

- 동일 도메인의 다른 기능
- 유사 CRUD 패턴
- 동일한 권한(doctor/vendor/admin) 조합

### 4) 현재 상태 확인

```bash
git log --oneline -5
git status
```

## 출력 형식(권장)

```md
## 컨텍스트 리포트

### PRD 요약
- 목적: ...
- 요구사항: ...
- AC: ...

### 기술 제약/정책
- Server Action 금지
- DB direct call 금지
- RQ hook/onError 정책

### 관련 파일
- ...

### 유사 구현
- ...
```

