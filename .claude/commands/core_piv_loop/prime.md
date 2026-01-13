---
description: 프로젝트 컨텍스트 로드
---

# Prime - 컨텍스트 로드

## 목적

새로운 기능 개발 전 필요한 컨텍스트를 로드합니다. 이 명령은 PIV (Prime-Implement-Validate) 루프의 첫 번째 단계입니다.

## 사용법

```
/prime [domain/feature]
```

예시:
- `/prime vendor/favorites`
- `/prime lead/messages`

## 실행 내용

### 0. 생성 문서 갱신 (권장)

PRD/TSD 작성/구현 전에 “현재 레포 사실”을 고정합니다(드리프트 방지):

- Claude Code: `/refresh`
- CLI: `python3 .claude/scripts/refresh.py --apply`

갱신 후 우선 참고:
- `.claude/reference/_generated/project-facts.md`
- `.claude/reference/_generated/api-routes-index.md`
- `.claude/reference/_generated/domain-specs-index.md`
- `.claude/reference/_generated/migrations-index.md`
- `.claude/reference/_generated/todo-open-items.md`
- `.claude/reference/_generated/test-csv-feature-map.md`

### 1. PRD/TSD 문서 확인 (fail-fast)

```
app/doc/domains/$ARGUMENTS/prd.md
app/doc/domains/$ARGUMENTS/tsd.md
app/doc/domains/$ARGUMENTS/ui.md
```

문서가 없다면 먼저 생성합니다:
- `/new-prd $ARGUMENTS`
- `/new-tsd $ARGUMENTS`

스켈레톤 생성만으로는 “스펙이 준비된 것”이 아닙니다. `/plan-feature`로 넘어가기 전 DoR을 통과해야 합니다:
- `.claude/reference/spec-templates.md`의 “Definition of Ready (DoR) - PRD/TSD”

### 2. 관련 코드 파악

- **API Routes (BFF)**: `app/src/app/api/` 하위 관련 디렉토리
- **Schemas**: `app/src/lib/schema/` 하위 관련 파일
- **Server/Auth/Storage**: `app/src/server/` 하위 관련 파일
- **UI**: `app/src/app/(page)/` 또는 실제 라우트 그룹 하위

### 3. 유사 패턴 탐색 (@explorer 권장)

기존 구현 중 참고할 만한 유사 패턴을 식별합니다:
- 동일 도메인의 다른 기능
- 유사한 CRUD/권한/폼 패턴
- 동일한 React Query queryKey/invalidations
- 유사한 Supabase 쿼리/RLS 전제

### 4. 현재 상태 확인

```bash
git log --oneline -5
git status
```

## 출력 형식

```
## PRD 요약
- 기능 목적: [...]
- 주요 요구사항/AC: [...]
- 제약 조건/Non-Goals: [...]

## 기술 제약사항 (TSD)
- DB/RLS: [...]
- API: [...]
- 권한(roles/guards): [...]

## 관련 파일 목록
| 파일 | 용도 |
|-----|------|
| ... | ... |

## 참고할 유사 패턴
- [패턴명]: [파일 경로]

## 현재 상태
- 브랜치: [...]
- 최근 커밋: [...]
```

## 다음 단계

컨텍스트 로드가 완료되면 `/plan-feature` 명령으로 기능 계획을 수립합니다.

