---
description: "생성 문서(인덱스/팩트) 갱신"
---

# Refresh: 생성 문서 갱신

## 목적

레포 상태(app/package.json, API routes, domain PRD, todo, test.csv)를 기반으로 `.claude/reference/_generated/*`를 갱신합니다.

## 실행

```bash
python3 .claude/scripts/refresh.py --apply
```

## 미리보기(선택)

```bash
python3 .claude/scripts/refresh.py
```

