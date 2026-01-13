# Spec Templates (PRD/TSD)

이 문서는 `app/doc/domains/<domain>/<feature>/` 아래에 작성하는 스펙 문서의 **최소 템플릿**입니다.

- 목표: 빠르게 “합의 가능한 스펙(명세)”을 만들고, 구현/운영 정합성을 유지한다.
- 원칙: 모르는 것은 모른다고 쓰고(가정/오픈 이슈로 격리), **SSOT(근거 파일/경로)** 로 검증 가능하게 만든다.

---

## PRD 템플릿

```md
# [기능명] PRD

> Status: Draft | Last updated: YYYY-MM-DD | Owner: [name/team] | SSOT: (TODO) `app/src/...:1`, `app/supabase/migrations/...:1`

## 1. 배경 및 문제 정의
- (왜 지금) 어떤 사용자 문제/운영 비용/리스크가 있는가?
- (현상) 현재 흐름(As-Is)에서 무엇이 깨지거나 비효율적인가?
- (근거) 관찰/데이터/인시던트/요청 링크 또는 SSOT 파일.

## 2. 목표 (Goals)
1. …
2. …

## 3. 비범위 (Non-Goals)
- …

## 4. 주요 사용자 및 시나리오
| 사용자 | 시나리오 | 기대 결과 |
| --- | --- | --- |
| … | … | … |

## 5. 기능 요구사항
### 5.1 UX / 화면
- 경로: `/...`
- 주요 상태/필터/권한별 노출 규칙
- 에러/빈 상태/로딩 상태 UX

### 5.2 API / 데이터
- 필요한 API 엔드포인트(초안):
  - `GET /api/...`
  - `POST /api/...`
- 입력/출력 계약(요약): 어떤 필드가 필수이며, 실패는 어떻게 보이는가?

### 5.3 권한/보안
- 사용자 역할: `guest(anon) / doctor / vendor / admin`
- 권한 규칙(초안): 어떤 역할이 어떤 액션을 할 수 있는가?
- RLS 영향(초안): 정책 변경이 필요한가? (필요하면 TSD에서 “정확한 정책/SQL”로 확정)

## 6. 비기능 요구사항 (NFR)
- 성능: …
- 안정성/복구: …
- 관측(로그/이벤트/감사): …

## 7. 엣지 케이스
- …

## 8. 성공 지표
- …

## 9. 리스크 및 대응
| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| … | … | … |

## 10. 오픈 이슈 / 결정 필요
- [ ] … (Blocker: Yes/No)
```

---

## TSD 템플릿

```md
# [기능명] TSD

> Status: Draft | Last verified: YYYY-MM-DD | PRD: `app/doc/domains/<domain>/<feature>/prd.md` | SSOT: (TODO) `app/src/...:1`, `app/supabase/migrations/...:1`

## 1. 범위
- 포함: …
- 제외: …

## 2. 시스템 개요
### 2.1 경계(Boundaries)
- UI: `app/src/app/(page)/...` (또는 실제 라우트 그룹)
- API(BFF): `app/src/app/api/...`
- Schema(Zod): `app/src/lib/schema/...`
- DB: `app/supabase/migrations/...`

### 2.2 데이터 흐름(요약)
1. UI → API(BFF)
2. API → Supabase(DB/Auth/Storage)
3. API → Response (표준 에러/응답 포맷)

## 3. 데이터 모델 / 마이그레이션
- 변경 테이블/뷰: …
- 마이그레이션 계획:
  - `app/supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
  - 롤백 전략: (가능하면 down/대체 마이그레이션/feature flag 등으로 설명)
- RLS 정책 변경(필요 시):
  - 정책 이름/대상 테이블/허용 조건을 명시
- 타입 재생성: `cd app && pnpm db:gen -- --local`

## 4. API 계약
- 엔드포인트 목록과 권한(역할/가드):
  - `GET /api/...` (public/doctor/vendor/admin)
  - `POST /api/...` (...)
- Query/Body 스키마(Zod)와 실패 케이스:
  - 400: Zod validation
  - 401: unauthenticated
  - 403: unauthorized
  - 409: conflict (중복/상태경합)
  - 500: internal

## 5. 구현 설계
### 5.1 스키마(Zod)
- 위치: `app/src/lib/schema/...`
- 규칙: 입력/출력 스키마를 SSOT로 유지한다.

### 5.2 API Route(BFF)
- 위치: `app/src/app/api/**/route.ts`
- 규칙:
  - 브라우저에서 DB 직접 호출 금지(BFF 패턴 준수)
  - auth/role gating을 명시적으로 적용
  - 공통 에러/응답 포맷 유지

### 5.3 Storage(필요 시)
- 업로드/다운로드는 “서버 Signed URL 발급 → 클라 업/다운로드”만 허용

## 6. 테스트/검증
- 최소 명령(항상):
  - `cd app && pnpm lint`
  - `cd app && pnpm type-check`
  - `cd app && pnpm build`
- (테스트 작성 시) `cd app && pnpm test`
- (DB 변경 시) `cd app && pnpm db:status` + `cd app && pnpm db:gen -- --local`

## 7. 운영/배포
- 마이그레이션 적용 순서 및 롤백 절차
- 권한/RLS 변경 시 운영 영향 및 점검 포인트

## 8. 오픈 이슈 / 결정 필요
- [ ] … (Blocker: Yes/No)
```

---

## Definition of Ready (DoR) - PRD/TSD

이 체크리스트는 “스펙이 준비되었다(Ready)”를 **사람마다 다르게 판단하지 않기 위해** 사용합니다.  
`/plan-feature`(구현 계획)과 `/execute`(구현)는 이 DoR을 통과한 스펙을 전제로 합니다.

### PRD Ready (Plan Gate)

다음 조건을 **모두** 만족해야 “PRD Ready”입니다:

- [ ] `Goals` / `Non-Goals` / `Acceptance Criteria`가 비어 있지 않고, `…`/`TODO`/`TBD`로만 구성되어 있지 않다.
- [ ] `Acceptance Criteria`가 “검증 가능한 문장”이다(입력/행동/결과가 관찰 가능).
- [ ] `주요 사용자 및 시나리오` 표에 최소 1행 이상이 있다.
- [ ] `기능 요구사항`에 아래 중 **각 1개 이상**이 존재한다(없으면 `변경 없음`을 명시한다):
  - UX/화면: 경로(`/...`) 또는 “UI 변경 없음”
  - API/데이터: 필요한 엔드포인트 목록 또는 “API 변경 없음”
  - 권한/보안: 역할/가드 또는 “권한 변경 없음/공개”
- [ ] 구현을 막는 미결정 사항은 `오픈 이슈 / 결정 필요`에 명시되어 있고, **막는 정도(Blocker)** 가 표시되어 있다.

### TSD Ready (Plan Gate)

다음 조건을 **모두** 만족해야 “TSD Ready”입니다:

- [ ] 대응 PRD 경로가 명시되어 있다(예: `app/doc/domains/<domain>/<feature>/prd.md`).
- [ ] 경계(Boundaries)가 구체적 경로로 적혀 있다(UI/API/Schema/DB).
- [ ] DB 변경 여부가 명시되어 있다:
  - 변경 시: 마이그레이션 파일 경로(예: `app/supabase/migrations/YYYY...sql`) + 롤백 전략
  - 미변경 시: `DB 변경 없음`을 명시
- [ ] API 변경 여부가 명시되어 있다:
  - 변경 시: 엔드포인트 + 권한(역할/가드) + Zod 계약(스키마 이름) + 실패 코드(최소 400/401/403/409/500)
  - 미변경 시: `API 변경 없음`을 명시
- [ ] 검증 방법이 명시되어 있다(최소 `cd app && pnpm lint`, `cd app && pnpm type-check`, `cd app && pnpm build`; 테스트가 있으면 `pnpm test`).
- [ ] 운영/배포 관점의 적용 순서 또는 주의점이 있다(최소 “마이그레이션 적용/롤백”).

### Fail-fast 규칙 (중요)

- DoR을 통과하지 못하면 **계획(plan)으로 넘어가지 않습니다**. 먼저 PRD/TSD를 보강합니다.
- `.agents/plans/*`는 SSOT가 아닙니다. 스펙(PRD/TSD)에 없는 요구사항/설계를 plan에 “새로 추가”하지 않습니다.

