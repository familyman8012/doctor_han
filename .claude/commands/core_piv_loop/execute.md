---
description: 계획 실행
---

# Execute - 계획 실행

## 목적

수립된 계획을 단계별로 실행합니다.

## 사용법

```
/execute <plan-file>
```

예시:
- `/execute .agents/plans/vendor__search.md`
- `/execute vendor__search` (`.agents/plans/` 자동 추가)

## 실행 규칙

1. 계획 파일의 태스크를 **위→아래 순서로** 실행합니다(순서 변경 금지).
2. 각 태스크는 끝나자마자 `VALIDATE`를 실행합니다.
3. 계획 외 변경(“김에 개선”) 금지. 필요하면 plan부터 수정합니다.

## 검증 커맨드(요약)

> 주의: `pnpm` 커맨드는 `app/`에서 실행합니다.

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

