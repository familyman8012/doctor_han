# 스펙 템플릿 (PRD / TSD / UI)

이 문서는 `app/doc/domains/**/{prd,tsd,ui}.md` 작성에 사용하는 최소 템플릿입니다.

## 0) 문서 원칙

- PRD/TSD는 “요구/설계의 단일 출처(SSOT)”입니다.
- Plan(`.agents/plans/*`)은 “실행 절차”이며 PRD/TSD를 대체하지 않습니다.
- 스펙이 불완전하면 구현을 시작하지 않습니다(DoR fail-fast).

## 1) PRD 템플릿 (`prd.md`)

```md
# PRD: <도메인/기능명>

> Status: Draft | Last updated: YYYY-MM-DD | Owner: <name/team>
> SSOT: 이 문서 + (관련 코드 경로 링크)

## 1) 배경/문제
- 왜 지금 이 기능이 필요한가?

## 2) 목표(Goals)
- G1: ...

## 3) 비범위(Non-goals)
- NG1: ...

## 4) 사용자/역할
- doctor / vendor / admin 중 해당 역할 명시

## 5) 사용자 시나리오
- UC-1 ...

## 6) 요구사항(Functional)
- R1 ...

## 7) 정책/제약(Constraints)
- Server Action 금지
- 브라우저에서 Supabase(DB) 직접 호출 금지(예외: Auth/Storage)
- React Query 커스텀 훅 래핑 금지
- 중앙 에러 핸들러 외 onError 금지

## 8) Acceptance Criteria (검증 가능한 문장)
- [ ] AC-1 ...
- [ ] AC-2 ...

## 9) 리스크/오픈 이슈
- Q1 ...
```

## 2) TSD 템플릿 (`tsd.md`)

```md
# TSD: <도메인/기능명>

> Status: Draft | Last updated: YYYY-MM-DD | Owner: <name/team>
> SSOT: (TODO) `app/src/...:1`, `app/supabase/migrations/...:1`

## 1) 변경 범위(Blast Radius)
- UI: `app/src/app/(page)/...`
- API: `app/src/app/api/.../route.ts`
- Server module: `app/src/server/<domain>/...`
- DB: `app/supabase/migrations/*.sql`

## 2) 데이터 모델/마이그레이션
- 테이블/컬럼 변경 요약
- RLS/Policy 변경 요약
- (중요) 기존 마이그레이션 파일 수정 금지, 새 마이그레이션으로 정정

## 3) API 계약(Contract)
- Endpoint: `GET/POST/PATCH/DELETE /api/...`
- 입력(Query/Body): Zod 스키마 파일/타입
- 출력(Response): Zod 스키마 파일/타입
- 에러: `ApiError` 코드/메시지(사용자 노출 문장 포함)
- 인증/인가: guards 적용 여부(doctor/vendor/admin)

## 4) 구현 설계(어디에 둘 것인가)
- API Route는 얇게 유지(파싱/가드/오케스트레이션)
- 쿼리는 repository로 이동
- 변환은 mapper로 이동
- 복합 로직은 service(필요 시)

## 5) 테스트/검증
- 최소 검증 커맨드:
  - `cd app && pnpm lint`
  - `cd app && pnpm type-check`
  - `cd app && pnpm test`
- 필요한 경우에만 테스트 추가(YAGNI)

## 6) 롤백 전략
- “down 마이그레이션” 대신 정정 마이그레이션으로 되돌린다(원칙)
```

## 3) UI 템플릿 (`ui.md`, 선택)

```md
# UI: <도메인/기능명>

## 1) 화면/플로우
- 화면 목록
- 이동 동선

## 2) 상태/데이터 페칭
- QueryKey 설계
- invalidate 전략
- 중앙 에러 핸들러 연동(개별 onError 금지)

## 3) 폼/검증
- react-hook-form 구성
- Zod 스키마 재사용 여부
```

## 4) Definition of Ready (DoR) — PRD/TSD

PRD/TSD가 다음을 만족하지 못하면 `@spec-writer`가 보강하고, `@planner`는 plan을 만들지 않습니다.

### PRD DoR
- [ ] 목표/비범위가 명확하다
- [ ] 사용자 역할/시나리오가 명확하다
- [ ] Acceptance Criteria가 검증 가능한 문장이다
- [ ] 금지 정책(Server Action/DB direct/RQ hook/onError)이 반영되어 있다

### TSD DoR
- [ ] API 계약(Endpoint, DTO)이 Zod로 표현 가능하다
- [ ] DB 변경이 있으면 마이그레이션/RLS 영향이 정리되어 있다
- [ ] 구현 위치(API/repository/mapper/service)가 결정되어 있다
- [ ] 최소 검증 커맨드가 명시되어 있다

