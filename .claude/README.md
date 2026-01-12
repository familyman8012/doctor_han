# Medihub Claude Pack

이 레포는 **수동 문서 + 자동 생성 문서**(2-layer)로 Claude 컨텍스트를 관리합니다.

## Manual (직접 관리)
- `CLAUDE.md`: 프로젝트 핵심 규칙/컨벤션
- `.claude/PRD.md`: 제품 요구사항
- `.claude/agents/*`: sub-agents
- `.claude/commands/*`: custom commands
- `.claude/skills/*`: project skills
- `.claude/reference/*`: 패턴/컨벤션 문서 (handwritten)

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
- `.claude/reference/_generated/domain-prds-index.md`: `app/doc/domains/**/prd.md` 인덱스
- `.claude/reference/_generated/test-csv-feature-map.md`: `app/doc/test.csv` 기능 맵
- `.claude/reference/_generated/todo-open-items.md`: `app/doc/todo.md` 미완료 항목 요약

