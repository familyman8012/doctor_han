---
description: PRD 스켈레톤 생성
---

# New PRD - PRD 생성

## 목적

`app/doc/domains/<domain>/<feature>/prd.md` 문서(요구사항 명세)를 **표준 템플릿으로 생성**합니다.

## 사용법

```
/new-prd [domain/feature]
```

## 규칙 (fail-fast)

- 대상 파일이 이미 존재하면 **덮어쓰지 말고 중단**하고, 필요한 경우 “차이(diff) 제안”만 합니다.
- 모르는 것은 추측하지 말고 `TODO`/`오픈 이슈`로 남깁니다.

## 생성 위치

- `app/doc/domains/$ARGUMENTS/prd.md`

## 템플릿/DoR

- 템플릿: `.claude/reference/spec-templates.md`의 “PRD 템플릿”
- DoR: `.claude/reference/spec-templates.md`의 “PRD Ready (Plan Gate)”

