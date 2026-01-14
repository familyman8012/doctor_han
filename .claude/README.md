# Medihub (doctor_han) - Claude Pack

이 레포는 **수동 문서 + 자동 생성 문서(2-layer)**로 Claude 컨텍스트를 관리합니다.

## Manual (직접 관리)

- `CLAUDE.md`: 프로젝트 전역 규칙/컨벤션(핵심 제약 포함)
- `.claude/PRD.md`: 제품 요구사항(북극성) + 도메인 PRD 인덱스
- `.claude/소개.md`: 구성 요소/워크플로우 상세 설명(Claude Pack 운영 가이드)
- `.claude/agents/*`: sub-agents
- `.claude/commands/*`: custom commands
- `.claude/skills/*`: 작업 단위 스킬
- `.claude/reference/*`: 패턴/컨벤션(수동)

## Generated (자동 생성)

- 위치: `.claude/reference/_generated/*`
- 생성기: `.claude/scripts/refresh.py`
- 목적: “현재 레포 상태” 기반 팩트/인덱스 동기화(드리프트 방지)

갱신:
- Claude Code: `/refresh`
- CLI: `python3 .claude/scripts/refresh.py --apply`

## Recommended Loop

### 간편 방식 (권장)

```
/workflow <domain/feature>
```

한 번의 명령으로 PRD/TSD 확인 → 컨텍스트 로드 → 계획 → 실행 → 검증 → 리뷰까지 자동 진행.

### 단계별 방식

1. `/refresh` (권장) → 생성 문서 최신화
2. `/prime <domain/feature>` → 컨텍스트 로드
3. (필수) PRD DoR 통과(없거나 미완성이면 `/new-prd`, `@spec-writer`)
4. `/plan-feature <domain/feature>` → 실행 계획 생성/정리 (`.agents/plans/`)
5. (컨텍스트 리셋) `/execute <plan>` → 구현
6. `/validate` → `/code-review` → commit
