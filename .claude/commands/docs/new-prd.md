---
description: PRD 스켈레톤 생성
---

# New PRD - PRD 생성

## 목적

PRD(요구사항 명세)를 **표준 템플릿**으로 생성합니다.

## 사용법

```
/new-prd <domain/feature>
```

예시:
- `/new-prd vendor/search`
- `/new-prd lead/status`
- `/new-prd admin/verifications`

## 생성 위치(권장)

레포의 기본 패턴:

- `app/doc/domains/<domain>/prd.md`

기능이 커지면 하위 폴더로 확장:

- `app/doc/domains/<domain>/<feature>/prd.md`

## 규칙 (fail-fast)

- 대상 파일이 이미 존재하면 **덮어쓰지 말고 중단**하고, 필요한 경우 “차이(diff) 제안”만 합니다.
- 모르는 것은 추측하지 말고 `TODO`/`Open Questions`로 남깁니다.
- 정책(Server Action/DB direct/RQ hook/onError)은 PRD에 명시합니다.

## 템플릿

- `.claude/reference/spec-templates.md`의 “PRD 템플릿”

