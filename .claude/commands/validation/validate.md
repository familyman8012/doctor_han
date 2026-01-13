---
description: 코드 전체 검증
---

# Validate - 전체 검증

## 목적

코드 변경사항의 전체 검증을 수행합니다. 린트, 타입 체크, 테스트, 빌드를 순차적으로 실행합니다.

## 사용법

```
/validate
```

## 검증 단계

### Level 1: Lint

```bash
cd app
pnpm lint
```

### Level 2: Type Check

```bash
cd app
pnpm type-check
```

### Level 3: Unit/Integration Tests (있는 경우)

```bash
cd app
pnpm test
```

> 테스트 파일이 없으면 `vitest --passWithNoTests` 설정으로 통과하도록 유지합니다.

### Level 4: Build

```bash
cd app
pnpm build
```

### Level 5: Database (해당 시)

```bash
cd app
pnpm db:status
pnpm db:gen -- --local
```

## 전체 검증 명령

```bash
cd app
pnpm lint && pnpm type-check && pnpm test && pnpm build
```

