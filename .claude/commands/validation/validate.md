---
description: 코드 전체 검증
---

# Validate - 전체 검증

## 목적

코드 변경사항의 전체 검증을 수행합니다. 린트, 타입 체크, 테스트, 빌드를 순차 실행합니다.

> 주의: 이 프로젝트의 `pnpm` 커맨드는 `app/`에서 실행합니다.

## 사용법

```
/validate
```

## 검증 단계

### Level 1: Lint (ESLint)

```bash
cd app
pnpm lint
```

자동 수정(가능한 범위):

```bash
cd app
pnpm lint -- --fix
```

### Level 2: Type Check

```bash
cd app
pnpm type-check
```

### Level 3: Unit Tests (Vitest)

```bash
cd app
pnpm test
```

### Level 4: Build

```bash
cd app
pnpm build
```

## 전체 검증(원샷)

```bash
cd app
pnpm lint && pnpm type-check && pnpm test && pnpm build
```

## 다음 단계

1. `/code-review` - 코드 리뷰
2. `git commit` - 변경사항 커밋

