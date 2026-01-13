---
description: TSD 스켈레톤 생성
---

# New TSD - TSD 생성

## 목적

`app/doc/domains/<domain>/<feature>/tsd.md` 문서(기술 설계)를 **표준 템플릿으로 생성**합니다.

## 사용법

```
/new-tsd [domain/feature]
```

## 선행 조건

- PRD가 최소 초안으로 존재해야 합니다: `app/doc/domains/$ARGUMENTS/prd.md`

## 규칙 (fail-fast)

- 대상 파일이 이미 존재하면 **덮어쓰지 말고 중단**하고, 필요한 경우 “차이(diff) 제안”만 합니다.
- 구현과 다른 “가짜 시그니처/가짜 파일”을 만들지 않습니다. 필요한 경우 실제 코드를 열어 확인합니다.

## 생성 위치

- `app/doc/domains/$ARGUMENTS/tsd.md`

## 템플릿/DoR

- 템플릿: `.claude/reference/spec-templates.md`의 “TSD 템플릿”
- DoR: `.claude/reference/spec-templates.md`의 “TSD Ready (Plan Gate)”

