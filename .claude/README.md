# Medihub Claude Pack

이 레포는 **수동 문서 + 자동 생성 문서(2-layer)**로 Claude 컨텍스트를 관리합니다.

## Manual (직접 관리)
- `CLAUDE.md`: 프로젝트 핵심 규칙/컨벤션
- `.claude/PRD.md`: 제품 요구사항
- `.claude/소개.md`: Claude Pack 구성/워크플로우
- `.claude/agents/*`: sub-agents
- `.claude/commands/*`: custom commands
- `.claude/skills/*`: project skills
- `.claude/reference/*`: 패턴/컨벤션 문서 (handwritten)
- `.claude/hooks/*`: Pre/Post 도구 훅(안전장치)

## Generated (자동 생성)
- 위치: `.claude/reference/_generated/*`
- 생성기: `.claude/scripts/refresh.py`
- 목적: “현재 레포 상태”를 기반으로 사실/인덱스를 자동 동기화

### 갱신 방법
- Claude Code: `/refresh`
- CLI: `python3 .claude/scripts/refresh.py --apply`

### 생성되는 파일
- `.claude/reference/_generated/project-facts.md`: 버전/스크립트/기본 사실
- `.claude/reference/_generated/api-routes-index.md`: `app/src/app/api/**/route.ts` 인덱스
- `.claude/reference/_generated/domain-specs-index.md`: `app/doc/domains/**/{prd,tsd,ui}.md` 인덱스
- `.claude/reference/_generated/migrations-index.md`: `app/supabase/migrations/*.sql` 인덱스
- `.claude/reference/_generated/domain-prds-index.md`: `app/doc/domains/*/prd.md` (레거시)
- `.claude/reference/_generated/test-csv-feature-map.md`: `app/doc/test.csv` 기능 맵
- `.claude/reference/_generated/todo-open-items.md`: `app/doc/todo.md` 미완료 항목 요약

## Recommended Loop

### 간편 방식 (권장)

```
/workflow <domain/feature>
```

### 단계별 방식

1. `/refresh` (권장) → 생성 문서 최신화
2. `/prime <domain/feature>` → 컨텍스트 로드 (+ `@explorer`)
3. (필수) PRD/TSD DoR 통과(없거나 미완성이면 `/new-prd`, `/new-tsd`, `@spec-writer`)
4. `/plan-feature <domain/feature>` → 구현 계획 생성/정리 (`.agents/plans/`)
5. (컨텍스트 리셋) `/execute <plan>` → 구현
6. `/validate` → `/code-review` → `/commit`
