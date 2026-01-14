---
description: 생성 문서(팩트/인덱스) 갱신
---

# Refresh - 생성 문서 갱신

## 목적

레포 상태(`app/package.json`, `app/src/app/api/**/route.ts`, `app/doc/domains/**`, `app/supabase/migrations/*.sql`)를 스캔하여
`.claude/reference/_generated/*`를 최신으로 동기화합니다.

**핵심 규칙 (fail-fast)**:

- 생성 문서(`_generated`)는 **직접 편집하지 않습니다**. 필요하면 템플릿/스크립트를 고칩니다.
- “현재 레포 사실”이 필요한 경우, 수동 문서보다 생성 문서를 우선 참조합니다(드리프트 방지).

## 사용법

```
/refresh
```

## 실행

프리뷰(변경 없음):

```bash
python3 .claude/scripts/refresh.py
```

적용(파일 갱신):

```bash
python3 .claude/scripts/refresh.py --apply
```

## 생성되는 파일

- `.claude/reference/_generated/project-facts.md`
- `.claude/reference/_generated/api-routes-index.md`
- `.claude/reference/_generated/domain-specs-index.md`
- `.claude/reference/_generated/migrations-index.md`

