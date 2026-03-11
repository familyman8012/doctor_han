# 지도/주소 기능 TSD

> 기반 문서: `app/doc/domains/vendor/map-address/prd.md:1`
> 참고 코드: `app/src/lib/schema/vendor.ts:1`, `app/src/server/vendor/mapper.ts:1`, `app/src/app/api/vendors/me/route.ts:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/YYYYMMDDHHMMSS_vendor_address_geocoding.sql` | CREATE | vendors 테이블에 주소/좌표 컬럼 6개 추가 |
| `app/src/lib/schema/vendor.ts` | UPDATE | VendorListItemSchema, VendorDetailSchema, VendorUpsertBodySchema, VendorPatchBodySchema에 주소/좌표 필드 추가 |
| `app/src/lib/schema/geocode.ts` | CREATE | GeocodeRequestSchema, GeocodeResponseSchema 정의 |
| `app/src/server/vendor/mapper.ts` | UPDATE | mapVendorListItem, mapVendorDetail에 주소/좌표 필드 매핑 추가 |
| `app/src/server/geocode/service.ts` | CREATE | 카카오 Geocoding API 호출 로직 |
| `app/src/app/api/vendors/me/route.ts` | UPDATE | POST/PATCH에 주소/좌표 필드 insert/update 추가 |
| `app/src/app/api/geocode/route.ts` | CREATE | POST 핸들러 - 주소 to 좌표 변환 프록시 |
| `app/src/app/(main)/vendors/[id]/VendorDetailPage.tsx` | UPDATE | 오른쪽 사이드바에 VendorMapSection 추가 |
| `app/src/app/(main)/vendors/[id]/components/VendorMapSection.tsx` | CREATE | 지도 + 길찾기 링크 래퍼 컴포넌트 |
| `app/src/app/(main)/vendors/[id]/components/VendorHeader.tsx` | UPDATE | getRegion 함수에서 road_address 우선 표시 |
| `app/src/components/widgets/KakaoMap.tsx` | CREATE | 카카오맵 SDK 로딩 + 지도 렌더링 컴포넌트 |
| `app/src/components/widgets/AddressSearch.tsx` | CREATE | Daum Postcode embed 연동 + 주소 선택 컴포넌트 |
| `app/src/components/widgets/DirectionsLink.tsx` | CREATE | 카카오맵/네이버지도 길찾기 링크 컴포넌트 |
| `app/src/app/(main)/partner/page.tsx` | UPDATE | "서비스 지역" 섹션을 AddressSearch 컴포넌트로 교체 |
| `app/.env.example` | UPDATE | KAKAO_REST_API_KEY, NEXT_PUBLIC_KAKAO_MAP_KEY 추가 |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components/Stores/Hooks) | UPDATE | `app/src/app/(main)/partner/page.tsx:367-394`, `app/src/app/(main)/vendors/[id]/VendorDetailPage.tsx:112-116`, `app/src/app/(main)/vendors/[id]/components/VendorHeader.tsx:66-71` | 파트너센터 주소 입력 UI 교체, 업체 상세 지도 추가, 헤더 지역 표시 변경 |
| API Route | UPDATE | `app/src/app/api/vendors/me/route.ts:119-132,190-198` | POST/PATCH insert/update에 주소/좌표 필드 추가. 신규 `/api/geocode` 라우트 생성 |
| API Client | NO CHANGE | `app/src/api-client/client.ts:1` | 기존 axios 인스턴스로 새 엔드포인트 호출 가능. 별도 API 클라이언트 파일 불필요 (직접 api.post/api.get 호출) |
| Schema (Zod) | UPDATE | `app/src/lib/schema/vendor.ts:9-19,76-98,100-134` | VendorListItemSchema에 주소 필드 추가, Body 스키마에 주소/좌표 필드 추가 |
| Service | CREATE | - | 신규 `app/src/server/geocode/service.ts` 생성 (카카오 Geocoding API 프록시) |
| Repo/DB (+ Migration) | UPDATE | `app/supabase/migrations/20251218190000_p0_schema.sql:171-187` | vendors 테이블에 6개 컬럼 추가 마이그레이션 |
| Auth/Security/RLS | NO CHANGE | `app/src/server/auth/guards.ts:109-119`, `app/src/app/api/vendors/me/route.ts:90,110,182` | 기존 withRole(["vendor"]) 유지. 신규 geocode API도 동일 패턴 적용. RLS 정책 변경 없음 (vendors 테이블 기존 정책이 전체 컬럼 적용) |
| Integrations/Cache | CREATE | - | 카카오 Geocoding REST API 외부 호출 (신규). 카카오맵 JavaScript SDK CDN (프론트엔드) |
| Config/Middleware/Env | UPDATE | `app/.env.example` | KAKAO_REST_API_KEY (서버 전용), NEXT_PUBLIC_KAKAO_MAP_KEY (클라이언트) 추가 |
| Tests | NO CHANGE | - | 현재 프로젝트에 자동화된 테스트 파일 패턴 없음. 검증은 lint + type-check로 수행 |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/server/api/response.ts` | 1-42 | ok/created/fail 응답 헬퍼 패턴 확인 |
| `app/src/server/api/errors.ts` | 1-51 | ApiError 생성 함수 목록 확인 (badRequest, notFound 등) |
| `app/src/lib/schema/common.ts` | 1-13 | zUuid, zNonEmptyString, zPaginationQuery 패턴 확인 |
| `app/src/api-client/client.ts` | 1-169 | axios 인스턴스 패턴 확인 |
| `app/src/server/vendor/repository.ts` | 1-193 | 기존 vendor repository 패턴 (포트폴리오/카테고리 조회) |
| `app/src/app/api/vendors/[id]/route.ts` | 1-39 | 업체 상세 공개 조회 API 패턴 확인 (인증 불필요) |
| `app/src/app/api/vendors/route.ts` | 1-134 | 업체 목록 API 패턴, mapVendorListItem 사용 확인 |
| `app/src/app/(main)/vendors/[id]/components/VendorInfo.tsx` | 1-95 | 업체 상세 사이드바 컴포넌트 구조 확인 |
| `app/supabase/migrations/20251218190000_p0_schema.sql` | 170-193 | vendors 테이블 원본 정의 확인 |
| `app/.env.example` | 1-49 | 기존 환경변수 패턴 확인 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Migration | `app/supabase/migrations/YYYYMMDDHHMMSS_vendor_address_geocoding.sql` | CREATE | vendors 테이블에 road_address, jibun_address, address_detail, zonecode, latitude, longitude 컬럼 추가 | - |
| SCHEMA-2 | Schema | `app/src/lib/schema/vendor.ts` | UPDATE | VendorListItemSchema, VendorDetailSchema, VendorUpsertBodySchema, VendorPatchBodySchema에 주소/좌표 필드 추가 | - |
| SCHEMA-3 | Schema | `app/src/lib/schema/geocode.ts` | CREATE | GeocodeRequestSchema, GeocodeResponseSchema 정의 | - |
| BACKEND-1 | Mapper | `app/src/server/vendor/mapper.ts` | UPDATE | mapVendorListItem에 주소/좌표 필드 매핑 추가 | SCHEMA-1, SCHEMA-2 |
| BACKEND-2 | Service | `app/src/server/geocode/service.ts` | CREATE | geocodeAddress 함수: 카카오 Geocoding REST API 호출 | SCHEMA-3 |
| BACKEND-3 | API | `app/src/app/api/vendors/me/route.ts` | UPDATE | POST/PATCH에 주소/좌표 필드 insert/update 로직 추가 | BACKEND-1, SCHEMA-2 |
| BACKEND-4 | API | `app/src/app/api/geocode/route.ts` | CREATE | POST 핸들러 - withRole(["vendor"]) + geocodeAddress 호출 | BACKEND-2, SCHEMA-3 |
| FRONTEND-1 | Widget | `app/src/components/widgets/KakaoMap.tsx` | CREATE | 카카오맵 SDK 로딩 + 지도/마커/인포윈도우 렌더링 | SCHEMA-2 |
| FRONTEND-2 | Widget | `app/src/components/widgets/AddressSearch.tsx` | CREATE | Daum Postcode embed 연동 + 주소 선택 + 상세주소 입력 | - |
| FRONTEND-3 | Widget | `app/src/components/widgets/DirectionsLink.tsx` | CREATE | 카카오맵/네이버지도 길찾기 버튼 | - |
| FRONTEND-4 | Component | `app/src/app/(main)/vendors/[id]/components/VendorMapSection.tsx` | CREATE | 지도 + 주소 텍스트 + 길찾기 래퍼 | FRONTEND-1, FRONTEND-3 |
| FRONTEND-5 | Page | `app/src/app/(main)/vendors/[id]/VendorDetailPage.tsx` | UPDATE | 오른쪽 사이드바에 VendorMapSection 배치 | FRONTEND-4 |
| FRONTEND-6 | Component | `app/src/app/(main)/vendors/[id]/components/VendorHeader.tsx` | UPDATE | getRegion에서 roadAddress 우선 표시 | SCHEMA-2 |
| FRONTEND-7 | Page | `app/src/app/(main)/partner/page.tsx` | UPDATE | "서비스 지역" 섹션을 AddressSearch + Geocode API 호출로 교체 | FRONTEND-2, BACKEND-4, SCHEMA-2 |
| FRONTEND-8 | Config | `app/.env.example` | UPDATE | KAKAO_REST_API_KEY, NEXT_PUBLIC_KAKAO_MAP_KEY 항목 추가 | - |

## 0.4 Parallelization Strategy

### 실행 모드

Conservative (기본) -- Backend 완료 후 Frontend 시작. 이유: Geocode API 스펙이 확정 후 프론트엔드에서 호출 패턴을 맞추는 것이 안전.

### 실행 단계

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2, SCHEMA-3 | schema-implementer | Both |
| 2 | BACKEND-1, BACKEND-2, BACKEND-3, BACKEND-4 | backend-implementer | Both |
| 3 | FRONTEND-1, FRONTEND-2, FRONTEND-3, FRONTEND-4, FRONTEND-5, FRONTEND-6, FRONTEND-7, FRONTEND-8 | frontend-implementer | Conservative: Phase 2 완료 후 |
| 4 | Integration (pnpm lint, pnpm type-check, pnpm build) | main | Both |

**Conservative 흐름**: Phase 1 -> Phase 2 -> Phase 3 -> Phase 4

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/**` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/**` | schema-implementer | READ-ONLY |
| `app/src/server/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/**` | frontend-implementer | READ-ONLY |
| `app/src/components/**` | frontend-implementer | READ-ONLY |
| `app/.env.example` | frontend-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - vendors 테이블에 주소/좌표 컬럼 6개 추가 (road_address, jibun_address, address_detail, zonecode, latitude, longitude)
  - 파트너센터 프로필 편집의 "서비스 지역" 섹션을 Daum Postcode 주소 검색으로 교체
  - POST /api/geocode 신규 API (카카오 Geocoding 서버 프록시)
  - 기존 PATCH/POST /api/vendors/me API에 주소/좌표 필드 추가
  - 업체 상세 페이지에 카카오맵 지도 표시 + 카카오맵/네이버지도 길찾기 링크
  - API 키 미설정 시 graceful fallback
- **제외**
  - 거리 기반 정렬/필터링 ("가까운 순" 등)
  - 업체 리스트 페이지 지도 뷰 토글
  - 사용자 현재 위치(GPS) 기반 탐색
  - 기존 업체 주소 데이터 일괄 마이그레이션
  - 좌표 인덱스 (1차에서는 거리 검색 미지원)

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
[Browser]
  |
  |-- Daum Postcode SDK (CDN) --> 주소 선택
  |-- KakaoMap JS SDK (CDN) --> 지도 렌더링
  |
  v
[API Routes (BFF)]
  |-- POST /api/geocode --> Geocode Service --> Kakao REST API (외부)
  |-- PATCH /api/vendors/me --> Vendor DB update (주소/좌표 포함)
  |-- POST /api/vendors/me --> Vendor DB insert (주소/좌표 포함)
  |-- GET /api/vendors/:id --> Vendor DB select (주소/좌표 포함)
  |
  v
[Supabase (Postgres)]
  |-- vendors 테이블 (road_address, jibun_address, address_detail, zonecode, latitude, longitude 추가)
```

- UI: `app/src/app/(main)/partner/page.tsx`, `app/src/app/(main)/vendors/[id]/VendorDetailPage.tsx`
- UI (shared): `app/src/components/widgets/KakaoMap.tsx`, `app/src/components/widgets/AddressSearch.tsx`, `app/src/components/widgets/DirectionsLink.tsx`
- API: `app/src/app/api/vendors/me/route.ts`, `app/src/app/api/vendors/[id]/route.ts`, `app/src/app/api/geocode/route.ts`
- Schema (Zod): `app/src/lib/schema/vendor.ts`, `app/src/lib/schema/geocode.ts`
- Service: `app/src/server/geocode/service.ts`
- Mapper: `app/src/server/vendor/mapper.ts`
- Repo/DB: `app/supabase/migrations/YYYYMMDDHHMMSS_vendor_address_geocoding.sql`

### 2.2 데이터 흐름

**주소 저장 흐름:**
1. UI (파트너센터) -> Daum Postcode SDK로 주소 선택 -> roadAddress, jibunAddress, zonecode 획득
2. UI -> POST /api/geocode (roadAddress 전송) -> Geocode Service -> 카카오 REST API -> latitude, longitude 반환
3. UI -> PATCH /api/vendors/me (roadAddress, jibunAddress, addressDetail, zonecode, latitude, longitude 전송)
4. API Route -> Supabase update (vendors 테이블)
5. API Route -> mapVendorDetail -> 응답 반환

**지도 표시 흐름:**
1. UI (업체 상세) -> GET /api/vendors/:id -> vendors 테이블 조회 -> latitude, longitude 포함 응답
2. UI -> KakaoMap 컴포넌트에 latitude, longitude 전달 -> 카카오맵 SDK로 지도 렌더링 + 마커

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 업체 위치 정보가 자유 텍스트("서울", "서울시" 등)로 관리되어 데이터 일관성이 없고, 지도/길찾기 같은 위치 기반 기능 제공이 불가능함
- **핵심 니즈**: (업체) 정확한 주소를 쉽게 입력 / (한의사) 업체 위치를 직관적으로 확인 + 길찾기
- **성공 기준**: 주소를 입력한 업체의 상세 페이지에서 지도와 길찾기 버튼이 정상 표시됨

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 도로명 주소 (또는 지번 주소)
- 상세 주소 (있을 경우)
- 지도 (좌표가 있을 경우)

**부가 정보 (확장/호버/상세 시 표시):**
- 우편번호
- 지번 주소 (도로명 주소가 주 표시일 때)
- 카카오맵/네이버지도 길찾기 링크

**정보 그룹핑:**
- 업체 상세 페이지: "위치 정보" 섹션으로 지도 + 주소 텍스트 + 길찾기 버튼을 하나의 카드에 그룹핑
- 파트너센터: "업체 주소" 섹션으로 주소 검색 + 상세 주소 입력을 하나의 카드에 그룹핑

### 3.3 흐름(Flow) 설계

**메인 플로우 (업체 - 주소 등록):**
```
[파트너센터 프로필 편집] -> ["주소 검색" 버튼 클릭] -> [Daum Postcode embed 열림]
-> [주소 선택] -> [도로명/지번/우편번호 자동 채워짐] -> [상세 주소 입력 (선택)]
-> [geocode API 호출 -> 좌표 자동 획득] -> [저장하기 클릭] -> [완료 토스트]
```

**메인 플로우 (한의사 - 위치 확인):**
```
[업체 상세 페이지 진입] -> [사이드바 "위치 정보" 섹션에 지도 표시]
-> [마커 클릭 시 업체명 인포윈도우] -> [길찾기 버튼 클릭]
-> [카카오맵 or 네이버지도 새 탭으로 열림]
```

**예외/이탈 루트:**
- Daum Postcode SDK 로딩 실패 -> 기존 자유 텍스트 입력 필드로 fallback (regionPrimary, regionSecondary)
- Geocode API 호출 실패 -> 주소 텍스트는 정상 저장, 좌표만 null. 사용자에게 "주소는 저장되었으나 지도 표시가 불가할 수 있습니다" 토스트
- 카카오맵 SDK 미로딩 (NEXT_PUBLIC_KAKAO_MAP_KEY 없음) -> 지도 영역 숨김, 텍스트 주소만 표시
- 좌표 없는 업체 -> 지도 영역 및 길찾기 버튼 미표시, 텍스트 주소만 표시

### 3.4 레이아웃 및 시각적 위계

**파트너센터 - 주소 입력 섹션:**
```
┌─────────────────────────────────────────────────────────────┐
│  [MapPin 아이콘] 업체 주소                                    │
├─────────────────────────────────────────────────────────────┤
│  [주소 검색 버튼] ← 클릭 시 아래 embed 영역 열림               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Daum Postcode embed 영역] (주소 선택 전: 숨김)       │    │
│  │  - 주소 선택 후 자동 닫힘                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  도로명 주소: [자동 채워진 텍스트 - 읽기 전용]                  │
│  지번 주소:   [자동 채워진 텍스트 - 읽기 전용]                  │
│  우편번호:    [자동 채워진 텍스트 - 읽기 전용]                  │
│  상세 주소:   [입력 필드 - 편집 가능]                          │
│                                                             │
│  (fallback 시: 기존 주요 지역 / 세부 지역 텍스트 입력 유지)     │
└─────────────────────────────────────────────────────────────┘
```

**업체 상세 - 위치 정보 섹션 (VendorInfo 아래, 사이드바):**
```
┌─────────────────────────────────────────────────────────────┐
│  위치 정보                                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [카카오맵 지도 - 높이 200px]                          │    │
│  │  - 마커 1개 (업체 위치)                               │    │
│  │  - 클릭 시 인포윈도우 (업체명)                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [MapPin] 서울특별시 강남구 테헤란로 123                       │
│           3층 301호                                         │
│                                                             │
│  [카카오맵 길찾기 버튼]  [네이버지도 길찾기 버튼]               │
└─────────────────────────────────────────────────────────────┘
```

**시각적 위계 (중요도순):**
1. **Primary**: 주소 검색 버튼 (파트너센터), 길찾기 버튼 (업체 상세)
2. **Secondary**: 저장하기 버튼 (파트너센터 전체 폼의 일부)
3. **Information**: 지도, 주소 텍스트, 우편번호

### 3.5 컴포넌트 구조

**신규 위젯 컴포넌트 (재사용 가능):**
```
app/src/components/widgets/
├── KakaoMap.tsx          -- 카카오맵 SDK 로딩 + 지도/마커/인포윈도우
├── AddressSearch.tsx     -- Daum Postcode embed + 주소 선택 콜백
└── DirectionsLink.tsx    -- 카카오맵/네이버지도 길찾기 버튼
```

**업체 상세 페이지 컴포넌트:**
```
app/src/app/(main)/vendors/[id]/components/
└── VendorMapSection.tsx  -- KakaoMap + DirectionsLink + 주소 텍스트 조합
```

**분리 기준:**
- KakaoMap, AddressSearch, DirectionsLink는 도메인 비종속 위젯이므로 `components/widgets/`에 배치
- VendorMapSection은 vendor 도메인 전용이므로 `vendors/[id]/components/`에 배치
- page.tsx (VendorDetailPage.tsx)는 VendorMapSection을 import하여 레이아웃에 배치만 함

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 카카오맵 SDK 로딩 중 | 지도 영역에 스켈레톤 (높이 200px, 회색 배경 + 로딩 텍스트) |
| 카카오맵 SDK 로딩 실패 / 키 없음 | 지도 영역 숨김, 텍스트 주소만 표시 |
| Daum Postcode embed 로딩 중 | "주소 검색" 버튼 클릭 후 embed 영역에 스피너 |
| Daum Postcode SDK 로딩 실패 | 기존 자유 텍스트 입력 필드로 fallback |
| Geocode API 호출 중 | "주소 검색" 후 좌표 변환 중 스피너 (주소 텍스트 필드 옆) |
| Geocode API 실패 | 토스트: "좌표 변환에 실패했습니다. 주소는 정상 저장됩니다." |
| 주소 저장 성공 | 기존 저장 성공 토스트 재사용 |
| 좌표 없는 업체 상세 | 지도 영역 + 길찾기 버튼 미표시, 텍스트 주소만 |
| 주소 자체가 없는 업체 상세 | "위치 정보" 섹션 전체 미표시 |

### 3.7 상태 관리

- **서버 상태**: 기존 React Query 키 재사용
  - `["vendor", "me"]` -- 파트너센터 내 업체 정보 (주소 포함)
  - `["vendor", vendorId]` -- 업체 상세 (주소/좌표 포함)
- **클라이언트 상태**: 파트너센터 주소 입력 폼은 기존 react-hook-form 상태에 통합
  - VendorFormData 인터페이스에 roadAddress, jibunAddress, addressDetail, zonecode, latitude, longitude 필드 추가
  - Geocode API mutation은 useMutation으로 관리 (별도 store 불필요)
- **URL 상태**: nuqs 사용 없음 (주소 입력/지도 표시에 URL 상태 불필요)

### 3.8 API Client

- 별도 API 클라이언트 파일 불필요. 기존 `api` 인스턴스로 직접 호출.
  - `api.post("/api/geocode", { address })` -- 주소 to 좌표 변환
  - `api.patch("/api/vendors/me", { ...기존필드, roadAddress, jibunAddress, addressDetail, zonecode, latitude, longitude })` -- 업체 프로필 수정
  - `api.post("/api/vendors/me", { ...기존필드, roadAddress, jibunAddress, addressDetail, zonecode, latitude, longitude })` -- 업체 프로필 생성

## 4. 데이터 모델

### 4.1 기존 테이블 변경: `vendors`

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| road_address | text | nullable | 도로명 주소 (카카오 주소 API 반환값) |
| jibun_address | text | nullable | 지번 주소 |
| address_detail | text | nullable | 상세 주소 (층, 호수 등 사용자 입력) |
| zonecode | text | nullable | 우편번호 (5자리) |
| latitude | double precision | nullable | 위도 |
| longitude | double precision | nullable | 경도 |

- 기존 `region_primary`, `region_secondary` 컬럼 유지 (하위 호환)
- 새 주소 입력 시 도로명 주소에서 시/도, 구/군을 파싱하여 region_primary, region_secondary도 자동 업데이트 (프론트엔드에서 파싱 후 전송)
- 인덱스: 1차에서는 좌표 인덱스 불필요 (거리 기반 검색 비범위)
- 마이그레이션 파일: `app/supabase/migrations/YYYYMMDDHHMMSS_vendor_address_geocoding.sql`
- 롤백(down) 전략: `ALTER TABLE vendors DROP COLUMN road_address, jibun_address, address_detail, zonecode, latitude, longitude;`

## 5. API 설계

### 5.1 기존 API 수정: `POST /api/vendors/me`

| 메서드/경로 | 권한 | 요청 스키마 | 응답 스키마 | 비고 |
| --- | --- | --- | --- | --- |
| `POST /api/vendors/me` | withRole(["vendor"]) | `VendorUpsertBodySchema` (확장) | `VendorMeResponseSchema` | 주소/좌표 필드 optional 추가 |

**요청 스키마 추가 필드 (VendorUpsertBodySchema):**
- `roadAddress`: `z.string().trim().min(1).optional().nullable()` -- 도로명 주소
- `jibunAddress`: `z.string().trim().min(1).optional().nullable()` -- 지번 주소
- `addressDetail`: `z.string().trim().min(1).optional().nullable()` -- 상세 주소
- `zonecode`: `z.string().trim().min(1).optional().nullable()` -- 우편번호
- `latitude`: `z.number().min(-90).max(90).optional().nullable()` -- 위도
- `longitude`: `z.number().min(-180).max(180).optional().nullable()` -- 경도

**변경 내용:**
- `app/src/app/api/vendors/me/route.ts:119-132` -- insert 객체에 road_address, jibun_address, address_detail, zonecode, latitude, longitude 추가

### 5.2 기존 API 수정: `PATCH /api/vendors/me`

| 메서드/경로 | 권한 | 요청 스키마 | 응답 스키마 | 비고 |
| --- | --- | --- | --- | --- |
| `PATCH /api/vendors/me` | withRole(["vendor"]) | `VendorPatchBodySchema` (확장) | `VendorMeResponseSchema` | 주소/좌표 필드 optional 추가 |

**요청 스키마 추가 필드 (VendorPatchBodySchema):**
- 동일 6개 필드 (모두 optional)
- 기존 refine ("수정할 필드가 없습니다") 조건에 주소 필드 6개 추가

**변경 내용:**
- `app/src/app/api/vendors/me/route.ts:190-198` -- update 객체 빌드에 주소/좌표 필드 typeof 체크 추가

### 5.3 기존 API: `GET /api/vendors/me`, `GET /api/vendors/[id]`

- 별도 변경 없음. DB 컬럼 추가 후 `select("*")`로 자동 포함됨
- mapVendorListItem / mapVendorDetail에서 주소/좌표 필드 매핑 추가 (BACKEND-1)
- 응답에 roadAddress, jibunAddress, addressDetail, zonecode, latitude, longitude 필드가 자동 포함

### 5.4 신규 API: `POST /api/geocode`

| 메서드/경로 | 권한 | 요청 스키마 | 응답 스키마 | 비고 |
| --- | --- | --- | --- | --- |
| `POST /api/geocode` | withRole(["vendor"]) | `GeocodeRequestSchema` | `GeocodeResponseSchema` | 카카오 Geocoding 서버 프록시 |

**GeocodeRequestSchema** (`app/src/lib/schema/geocode.ts`):
- `address`: `z.string().trim().min(1).max(500)` -- 검색할 주소 텍스트

**GeocodeResponseSchema** (`app/src/lib/schema/geocode.ts`):
- 성공 시 (200): `ok({ latitude: number, longitude: number })`
- 주소 변환 결과 없음 (404): `notFound("주소를 좌표로 변환할 수 없습니다.")`
- 카카오 API 키 미설정 (400): `badRequest("Geocoding 서비스를 사용할 수 없습니다.")`
- 카카오 API 호출 실패 (500): `internalServerError("좌표 변환에 실패했습니다.")`

**외부 API 호출 사양:**
- URL: `https://dapi.kakao.com/v2/local/search/address`
- Method: GET
- Headers: `Authorization: KakaoAK ${KAKAO_REST_API_KEY}`
- Query: `query=${encodeURIComponent(address)}`
- 타임아웃: 5,000ms
- 재시도: 1회 (첫 실패 후 1회 재시도, 지수 백오프 없음)
- KAKAO_REST_API_KEY 미설정 시: badRequest 반환 (API 호출 시도하지 않음)

## 6. 서비스/도메인 계층

### 6.1 GeocodeService (`app/src/server/geocode/service.ts`)

- `geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null>`
  - 카카오 REST API (`https://dapi.kakao.com/v2/local/search/address`) 호출
  - 입력: 주소 텍스트 (도로명 주소 권장)
  - 반환: `{ latitude, longitude }` 또는 결과 없을 시 `null`
  - 환경변수 `KAKAO_REST_API_KEY` 미설정 시 `null` 반환 (에러 로깅)
  - 카카오 API 응답에서 `documents[0].y` (위도), `documents[0].x` (경도) 추출
  - 타임아웃: 5,000ms (fetch AbortController 사용)
  - 재시도: 1회. 첫 호출 실패 시 1회 재시도 후 실패하면 `null` 반환 + console.error 로깅
  - 트랜잭션 경계: 없음 (외부 API 호출만)
  - 에러 케이스: 네트워크 오류, 타임아웃, 카카오 API 에러 응답 -> 모두 null 반환 + 로깅

### 6.2 기존 서비스 변경

- Vendor 도메인에는 별도 service.ts가 없음 (API Route에 직접 로직 구현 패턴)
  - 근거: `app/src/app/api/vendors/me/route.ts:1-258` 전체가 인라인 로직
- 기존 패턴을 유지하여 API Route 내에서 주소/좌표 필드 처리

### 6.3 Mapper 변경: `app/src/server/vendor/mapper.ts`

- `mapVendorListItem`: row.road_address, row.jibun_address, row.address_detail, row.zonecode, row.latitude, row.longitude 매핑 추가
- `mapVendorDetail`: mapVendorListItem 확장이므로 자동 포함

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 수동 | KAKAO_REST_API_KEY 설정 후 POST /api/geocode로 주소-좌표 변환 확인 | curl / Postman |
| 수동 | KAKAO_REST_API_KEY 미설정 시 geocode API가 badRequest 반환 확인 | curl |
| 수동 | 파트너센터에서 주소 검색 -> 저장 -> 업체 상세에서 지도 표시 확인 | 브라우저 |
| 수동 | NEXT_PUBLIC_KAKAO_MAP_KEY 미설정 시 지도 영역 미표시, 주소 텍스트만 표시 확인 | 브라우저 |
| 수동 | 길찾기 버튼 클릭 시 카카오맵/네이버지도 새 탭 열림 확인 | 브라우저 |

### 검증 명령

```bash
cd app
pnpm lint
pnpm type-check
pnpm build
pnpm db:migrate
pnpm db:gen
```

## 8. 운영/배포

**적용 순서:**
1. 환경변수 설정: `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_MAP_KEY`를 배포 환경에 추가
2. 마이그레이션 적용: `pnpm db:migrate` (vendors 테이블 컬럼 추가)
3. 타입 재생성: `pnpm db:gen` (Database types 업데이트)
4. 서버 코드 배포: API Route 변경 + Geocode Service
5. 프론트엔드 코드 배포: 위젯 컴포넌트 + 페이지 변경

**롤백 절차:**
- 프론트엔드 롤백: 이전 버전 배포 (주소 관련 UI 제거)
- 서버 롤백: 이전 버전 배포 (API에서 주소 필드 무시)
- DB 롤백: `ALTER TABLE vendors DROP COLUMN road_address, jibun_address, address_detail, zonecode, latitude, longitude;`
- 환경변수는 롤백 불필요 (사용하지 않으면 무해)

**주의사항:**
- 마이그레이션은 모두 nullable 컬럼 추가이므로 기존 데이터에 영향 없음
- 기존 region_primary/region_secondary 컬럼 유지로 하위 호환성 보장
- 카카오 API 키 미발급 상태에서도 배포 가능 (graceful fallback)

## 9. 백로그

- [ ] 업체 리스트 페이지 지도 뷰 토글 (지도 위에 업체 마커 다수 표시)
- [ ] 거리 기반 정렬/필터링 ("가까운 순", 반경 N km 이내) + 좌표 인덱스 추가
- [ ] 사용자 현재 위치(GPS) 기반 자동 탐색
- [ ] 기존 업체의 region_primary/region_secondary 데이터를 새 주소 체계로 일괄 마이그레이션
- [ ] Geocoding 실패 건 재시도 배치 작업
- [ ] Daum Postcode embed vs popup 모드 사용자 환경별 최적화
