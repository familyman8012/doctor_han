# Document Handler Skill

## 목적

프로젝트 문서 읽기, 분석, 요약을 위한 스킬

## 트리거

- "문서 읽어줘"
- "PRD 확인해줘"
- "요구사항 분석해줘"
- "현재 진행 상황 알려줘"

## 주요 문서 위치

### 프로젝트 문서
| 문서 | 경로 | 용도 |
|------|------|------|
| 프로젝트 규칙 | `CLAUDE.md` | 코딩 컨벤션, 명령어 |
| 제품 요구사항 | `.claude/PRD.md` | 전체 기능 명세 |
| 개발 현황 | `app/doc/todo.md` | 진행률, 우선순위 |
| 비즈니스 문서 | `app/doc/business.md` | 사업 개요 |

### 도메인 PRD
| 도메인 | 경로 |
|--------|------|
| 인증 | `app/doc/domains/auth/prd.md` |
| 업체 | `app/doc/domains/vendor/prd.md` |
| 리드 | `app/doc/domains/lead/prd.md` |
| 리뷰 | `app/doc/domains/review/prd.md` |
| 관리자 | `app/doc/domains/admin-mvp/prd.md` |

### 참조 문서
| 문서 | 경로 |
|------|------|
| Next.js 패턴 | `.claude/reference/nextjs-patterns.md` |
| Supabase 패턴 | `.claude/reference/supabase-patterns.md` |
| 프론트엔드 패턴 | `.claude/reference/frontend-patterns.md` |
| 코딩 컨벤션 | `.claude/reference/coding-conventions.md` |

## 사용법

### 특정 문서 읽기
```
"PRD 읽어줘" → .claude/PRD.md 읽기
"auth 도메인 문서 확인" → app/doc/domains/auth/prd.md 읽기
"todo 확인" → app/doc/todo.md 읽기
```

### 문서 요약
```
"현재 개발 진행 상황 요약해줘"
→ todo.md 읽고 완료/진행중/대기 항목 정리

"MVP 범위 알려줘"
→ PRD.md에서 MVP 섹션 추출하여 요약
```

### 문서 간 연결
```
"vendor 기능 전체 파악하고 싶어"
→ PRD.md의 vendor 섹션 + app/doc/domains/vendor/prd.md 함께 분석
```

## 출력 형식

### 문서 요약
```markdown
## 문서: [문서명]

### 핵심 내용
- 포인트 1
- 포인트 2

### 관련 문서
- [문서명](경로)

### 다음 작업
- 권장 사항
```

### 진행 현황
```markdown
## 개발 진행 현황

### 완료 (X개)
- [ ] 항목 1
- [ ] 항목 2

### 진행 중 (Y개)
- [ ] 항목 3

### 대기 (Z개)
- [ ] 항목 4

### 전체 진행률: X%
```
