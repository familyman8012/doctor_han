# Medihub (메디허브) — PRD (북극성 요약)

이 문서는 **Medihub 제품 요구사항의 “요약/인덱스”**입니다.

- 상세 PRD는 `app/doc/domains/**/prd.md`가 단일 출처(Source of Truth)입니다.
- 비즈니스 맥락/전략은 `app/doc/business.md`를 우선합니다.
- 현재 작업 우선순위/상태는 `app/doc/todo.md`를 우선합니다.

## 1) 제품 정의

- 한 줄 요약: 한의사와 의료 관련 업체를 연결하는 B2B 매칭 플랫폼(“의료계의 크몽”).
- 핵심 가치: **탐색(검색/필터/비교) → 신뢰(검증/리뷰) → 전환(리드/문의)**

## 2) 사용자/역할 (Role)

- `doctor`(한의사): 업체 탐색, 문의 생성/관리, 리뷰 작성
- `vendor`(업체): 업체 프로필/포트폴리오 관리, 리드 대응
- `admin`(관리자): 검수(승인/반려), 카테고리/유저/업체 관리

## 3) MVP 범위 (요약)

상세는 `app/doc/todo.md`와 도메인 PRD를 따릅니다. PRD 관점에서 “지금” MVP를 다음으로 요약합니다.

- 인증/온보딩: 이메일 기반 로그인 + 역할(doctor/vendor/admin) 프로필
- 검수(Verification): 한의사/업체 제출 → 관리자 승인/반려
- 탐색(Discovery): 카테고리/검색/필터 기반 업체 리스트 + 상세
- 전환(Leads): 한의사 문의 생성 → 업체가 상태/응답 관리
- 신뢰(Trust): 리뷰/평점 + 찜/즐겨찾기
- 파일(Uploads): 면허증/사업자등록증/리뷰 사진 등 목적 기반 업로드

## 4) 비범위(Non-goals) — 지금은 하지 않는다

도입/유지 비용 대비 MVP 효율이 낮거나, 현재 정책과 충돌하는 항목은 명시적으로 제외합니다.

- Next.js Server Action/Form Action 기반 데이터 변경
- 브라우저에서 Supabase(DB) 직접 호출(예외: Auth/Storage)
- React Query를 커스텀 훅으로 감싸는 래퍼 레이어(컴포넌트에서 직접 사용)
- 분산된 `onError` 처리(중앙 에러 핸들러로 통합)

## 5) 제품 정책/불변 조건 (Fail-fast 규칙)

이 항목들은 기능 요구사항이 아니라 **시스템 정책(Policy)**이며, 위반 시 즉시 수정합니다.

1. **BFF 단일 진입점**: 데이터 통신은 `app/src/app/api/**/route.ts`에서만 처리
2. **입력 검증은 Zod**: 요청 Query/Body는 `app/src/lib/schema/*.ts` 스키마로 파싱/검증
3. **응답 포맷 일관성**: `ok/created/fail` + `withApi`로 예외를 표준화
4. **권한은 이중 방어**: (1) API 가드(서버) + (2) RLS/Policy(DB)

## 6) 도메인 PRD 인덱스

도메인별 요구사항은 아래를 기준으로 확장/수정합니다.

- `app/doc/domains/auth/prd.md`
- `app/doc/domains/profile-verification/prd.md`
- `app/doc/domains/vendor/prd.md`
- `app/doc/domains/category-search/prd.md`
- `app/doc/domains/lead/prd.md`
- `app/doc/domains/review/prd.md`
- `app/doc/domains/admin-mvp/prd.md`

## 7) 문서 DoR(Definition of Ready) — PRD가 “준비됨”의 기준

다음이 충족되지 않으면 구현을 시작하지 않습니다(예외는 명시적 승인 필요).

- 사용자 역할/권한이 명확함(doctor/vendor/admin)
- 입력/출력(DTO) 스키마가 명확함(Zod로 표현 가능)
- 실패 케이스/에러 메시지 정책이 합의됨
- DB 영향 범위(테이블/컬럼/RLS)가 명확함

