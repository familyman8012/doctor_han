# 지도/주소 기능 PRD

> 참조: `app/src/lib/schema/vendor.ts:1`, `app/src/server/vendor/mapper.ts:1`, `app/src/app/api/vendors/me/route.ts:1`
> 본 문서는 현재 업체(vendor) 프로필의 지역 정보 관리와 사용자의 위치 기반 탐색 요구를 기반으로 지도/주소 기능을 정의한다.

## 1. 배경 및 문제 정의

- 현재 `vendors` 테이블에는 `region_primary`(주요 지역)와 `region_secondary`(세부 지역)라는 텍스트 필드만 존재한다.
  - 근거: `app/supabase/migrations/20251218190000_p0_schema.sql:177-178`
- 업체 프로필 편집 시 지역 정보를 자유 텍스트로 입력하고 있어 데이터 일관성이 없다. "서울", "서울시", "서울특별시" 등 같은 지역이 다른 값으로 저장된다.
  - 근거: `app/src/app/(main)/partner/page.tsx:82-84` (자유 입력 Input 필드)
- 좌표(위도/경도) 데이터가 없어 거리 기반 검색, 지도 표시, 길찾기 연동이 불가능하다.
- 한의사(doctor)가 업체를 탐색할 때 "내 한의원 근처 업체"를 찾고 싶어도 위치 기반 필터링을 제공할 수 없다.
- 업체 상세 페이지에서 위치 정보가 텍스트("서울 강남구")로만 표시되어 실제 위치 파악이 어렵다.
  - 근거: `app/src/app/(main)/vendors/[id]/components/VendorHeader.tsx:66-71` (getRegion 함수)

## 2. 목표 (Goals)

1. 업체 프로필에 정확한 주소와 좌표(위도/경도)를 저장하여 위치 기반 기능의 데이터 기반을 마련한다.
2. 카카오 주소 API(Daum Postcode)를 연동하여 주소 입력의 정확성과 일관성을 확보한다.
3. 업체 상세 페이지에 카카오맵을 표시하여 업체 위치를 직관적으로 파악할 수 있게 한다.
4. 카카오맵/네이버지도 길찾기 링크를 제공하여 한의사가 업체 방문 시 내비게이션을 바로 시작할 수 있게 한다.
5. API 키가 없어도 앱이 정상 동작하도록 graceful fallback을 구현한다.

## 3. 비범위 (Non-Goals)

- 거리 기반 정렬/필터링 (업체 리스트에서 "가까운 순" 정렬) -- 좌표 데이터 축적 후 후속 단계로
- 업체 리스트 페이지의 지도 뷰 토글 (선택사항으로 1차에서는 제외, 백로그로 관리)
- 사용자 현재 위치(GPS) 기반 자동 탐색
- 네이버 지도 SDK 직접 연동 (길찾기 링크만 제공)
- 기존 업체의 주소 데이터 일괄 마이그레이션 (기존 `region_primary`/`region_secondary` 값은 유지하고, 새 주소 필드는 업체가 프로필 수정 시 자연스럽게 채워지도록 함)
- 주소 변경 이력 관리

## 4. 주요 사용자 및 시나리오

| 사용자 | 시나리오 | 기대 결과 |
| ------ | -------- | --------- |
| 업체(vendor) | 파트너센터에서 업체 프로필의 주소를 등록/수정한다 | 카카오 주소 검색 팝업으로 도로명/지번 주소를 선택하면 주소와 좌표가 자동 저장된다 |
| 업체(vendor) | 주소 선택 후 상세 주소(층, 호수 등)를 추가 입력한다 | 상세 주소가 주소와 함께 저장된다 |
| 한의사(doctor) | 업체 상세 페이지에서 업체 위치를 확인한다 | 지도에 마커가 표시되어 위치를 직관적으로 파악할 수 있다 |
| 한의사(doctor) | 업체 상세 페이지에서 길찾기를 클릭한다 | 카카오맵 또는 네이버지도 길찾기 페이지가 새 탭으로 열린다 |
| 모든 사용자 | 카카오맵 API 키가 설정되지 않은 환경에서 업체 상세 페이지를 방문한다 | 지도 영역이 표시되지 않고, 텍스트 주소만 노출된다 (앱이 깨지지 않는다) |
| 업체(vendor) | API 키가 설정되지 않은 환경에서 주소를 입력한다 | 카카오 주소 검색 대신 일반 텍스트 입력 필드로 fallback된다 |

## 5. 기능 요구사항

### 5.1 주소 검색/자동완성

- 카카오 주소 API(Daum Postcode Service)를 연동하여 주소 검색 팝업을 제공한다.
- 업체 프로필 편집 화면(`/partner`)의 "서비스 지역" 섹션을 주소 검색 UI로 교체한다.
  - 근거: `app/src/app/(main)/partner/page.tsx:368-394` (현재 자유 텍스트 입력)
- 도로명 주소와 지번 주소 모두 검색 가능하다.
- 주소 선택 후 반환되는 데이터에서 도로명 주소(`roadAddress`), 지번 주소(`jibunAddress`), 우편번호(`zonecode`)를 저장한다.
- 상세 주소 입력 필드를 별도로 제공한다 (예: "3층 301호").
- 주소 선택 시 카카오 Geocoding API를 호출하여 좌표(위도/경도)를 자동으로 변환하고 저장한다.

### 5.2 좌표 저장 및 Geocoding

- `vendors` 테이블에 좌표 및 주소 관련 컬럼을 추가한다.
- 카카오 Geocoding REST API(`https://dapi.kakao.com/v2/local/search/address`)를 서버(BFF API Route)에서 호출하여 주소-좌표 변환을 수행한다.
  - 클라이언트에서 직접 카카오 REST API를 호출하지 않는다 (API 키 보호).
- Geocoding 실패 시에도 주소 텍스트는 저장하고, 좌표만 null로 두되 에러를 로깅한다.
- 환경변수: `KAKAO_REST_API_KEY` (서버 전용, Geocoding API 호출용).

### 5.3 업체 상세 지도 표시

- 카카오맵 JavaScript SDK를 사용하여 업체 상세 페이지에 지도를 표시한다.
  - 근거: `app/src/app/(main)/vendors/[id]/VendorDetailPage.tsx:113-115` (오른쪽 사이드바, VendorInfo 아래에 배치)
- 업체의 좌표(latitude/longitude)가 있을 때만 지도를 렌더링한다.
- 지도에 마커를 표시하고, 마커 클릭 시 업체명이 인포윈도우로 표시된다.
- 환경변수: `NEXT_PUBLIC_KAKAO_MAP_KEY` (클라이언트용, JavaScript SDK 로딩용).

### 5.4 길찾기 링크

- 업체 상세 페이지의 지도 아래에 길찾기 버튼을 제공한다.
- 카카오맵 길찾기: `https://map.kakao.com/link/to/{업체명},{lat},{lng}` 형식의 URL을 새 탭으로 연다.
- 네이버지도 길찾기: `https://map.naver.com/v5/directions/-/-/-/transit?c={lng},{lat},15,0,0,0,dh` 또는 `naver.me` 형식의 URL을 새 탭으로 연다.
- 좌표가 없는 업체에는 길찾기 버튼을 표시하지 않는다.

### 5.5 Graceful Fallback (API 키 없을 때)

- `NEXT_PUBLIC_KAKAO_MAP_KEY`가 비어있거나 없으면:
  - 업체 상세 페이지에서 지도 컴포넌트를 렌더링하지 않는다 (빈 영역 또는 텍스트 주소만 표시).
  - 길찾기 링크는 좌표가 있으면 표시한다 (지도 SDK 없이도 URL 생성 가능).
- `KAKAO_REST_API_KEY`가 비어있거나 없으면:
  - 주소 입력 시 Geocoding을 건너뛰고, 좌표를 null로 저장한다.
  - 주소 텍스트 자체는 정상적으로 저장된다.
- Daum Postcode 서비스 스크립트 로딩 실패 시:
  - 기존 자유 텍스트 입력 필드로 fallback한다.
- 어떤 경우에도 에러 페이지나 화면 깨짐이 발생하지 않아야 한다.

### 5.6 UI 진입점 (상세 설계는 TSD)

- **경로 1**: `/partner` (업체 프로필 편집 -- "서비스 지역" 섹션 교체)
- **경로 2**: `/vendors/[id]` (업체 상세 -- 지도 + 길찾기 추가)
- **진입점**: 기존 화면의 일부 섹션 교체/추가이므로 별도 진입점 불필요
- **레퍼런스**: 현재 `VendorInfo` 컴포넌트 구조 참조 (`app/src/app/(main)/vendors/[id]/components/VendorInfo.tsx`)

### 5.7 API / 데이터

- 기존 API 수정:
  - `PATCH /api/vendors/me` -- 주소/좌표 필드 추가 저장
  - `POST /api/vendors/me` -- 주소/좌표 필드 추가 저장
  - `GET /api/vendors/me` -- 주소/좌표 필드 응답에 포함
  - `GET /api/vendors/[id]` -- 주소/좌표 필드 응답에 포함
- 신규 API:
  - `POST /api/geocode` -- 주소를 좌표로 변환 (서버에서 카카오 Geocoding API 호출)

### 5.8 권한/보안

- 권한 변경 없음.
- `PATCH /api/vendors/me`, `POST /api/vendors/me`는 기존과 동일하게 `vendor` 역할만 접근 가능.
  - 근거: `app/src/app/api/vendors/me/route.ts:90,110,182` (withRole(["vendor"]))
- `POST /api/geocode`는 인증된 사용자(`vendor` 역할)만 호출 가능.
- `GET /api/vendors/[id]`의 주소/좌표 정보는 public 데이터로 노출 (기존 지역 정보와 동일한 정책).
- `KAKAO_REST_API_KEY`는 서버 전용 환경변수로 클라이언트에 노출되지 않는다.

## 6. 비기능 요구사항 (NFR)

- 성능/응답성:
  - (API) `POST /api/geocode`: p95 1,000ms 이내 (카카오 API 외부 호출 포함). 카카오 API 타임아웃: 5,000ms.
  - (프론트) 카카오맵 SDK 로딩: `<Script>` 태그로 비동기 로딩. 로딩 중 스켈레톤/스피너 표시.
  - (프론트) Daum Postcode 팝업 오픈: 클릭 후 500ms 이내 팝업 표시 (스크립트 사전 로딩).
- 안정성/복구:
  - (외부 의존성) 카카오 Geocoding API 실패 시: 좌표를 null로 저장하고, 주소 텍스트는 정상 저장. 에러를 서버 로그에 기록.
  - (외부 의존성) 카카오맵 SDK 로딩 실패 시: 지도 영역 숨김, 텍스트 주소만 표시.
  - (외부 의존성) Daum Postcode 스크립트 로딩 실패 시: 자유 텍스트 입력 필드로 fallback.
  - 재시도 전략: Geocoding API 실패 시 1회 재시도 후 포기 (지수 백오프 불필요, 사용자 요청 경로).
- 관측(로그/감사/지표):
  - 감사 로그 변경 없음 (기존 `vendor.update` 감사 로그에 updatedFields로 주소 필드가 포함됨).
    - 근거: `app/src/app/api/vendors/me/route.ts:231-247`
  - Geocoding 실패 시 서버 로그에 `vendorId`, 입력 주소, 에러 메시지 기록.

## 7. 엣지 케이스

- 카카오 주소 검색 결과에서 건물명만 있고 정확한 도로명 주소가 없는 경우: 지번 주소를 우선 저장하고, 도로명 주소는 null 허용.
- 좌표가 해외(한국 외)인 경우: 별도 제한 없음 (현실적으로 카카오 주소 API가 한국 주소만 반환하므로 발생하지 않음).
- 업체가 주소를 입력했다가 삭제하는 경우: 주소/좌표 필드를 모두 null로 초기화. 기존 `region_primary`/`region_secondary`도 함께 업데이트.
- 기존 업체 중 `region_primary`/`region_secondary`만 있고 새 주소 필드가 없는 경우: 기존 텍스트 지역 정보를 계속 표시. 지도는 표시하지 않음.
- Daum Postcode 팝업이 모바일에서 열릴 때: 팝업 대신 embed 모드 사용 권장 (모바일 호환성).

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
| ------ | ---- | ---- |
| 카카오 API 서비스 장애 | Geocoding 실패로 좌표 저장 불가 | 주소 텍스트는 정상 저장, 좌표는 null. 나중에 재시도 가능하도록 주소 텍스트 보존 |
| 카카오 API 일일 호출 제한 초과 | Geocoding 요청 거부 | 초기 트래픽 수준에서는 무료 할당량(30만/일)으로 충분. 모니터링 후 필요 시 유료 전환 |
| 카카오맵 SDK CDN 장애 | 지도 표시 불가 | Graceful fallback으로 텍스트 주소만 표시. 사용자 경험 저하는 있지만 기능 장애는 없음 |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` 누락된 채 배포 | 지도 기능 전체 비활성화 | Fallback 동작으로 앱은 정상. 배포 체크리스트에 환경변수 확인 항목 추가 |

## 9. 롤아웃 / 백로그

1. 1차 릴리스 범위
   - DB: `vendors` 테이블에 주소/좌표 컬럼 추가
   - 파트너센터: 주소 검색(Daum Postcode) + Geocoding 연동
   - 업체 상세: 카카오맵 지도 표시 + 길찾기 링크
   - Graceful fallback 전체 구현

2. 후속 백로그 항목
   - [ ] 업체 리스트 페이지 지도 뷰 토글 (지도 위에 업체 마커 다수 표시)
   - [ ] 거리 기반 정렬/필터링 ("가까운 순", 반경 N km 내 업체)
   - [ ] 사용자 현재 위치(GPS) 기반 자동 탐색
   - [ ] 기존 업체의 `region_primary`/`region_secondary` 데이터를 새 주소 체계로 일괄 마이그레이션
   - [ ] 주소 변경 시 좌표 재계산 배치 작업 (Geocoding 실패 건 재시도)
   - [ ] 카카오맵 -> 네이버지도 SDK 이중 지원 (사용자 선호 설정)

## 10. 오픈 이슈 / 결정 필요

- [ ] (선택) 카카오 API 앱 키 발급 완료 여부 확인 -- 개발 시작 전 `KAKAO_REST_API_KEY`와 `NEXT_PUBLIC_KAKAO_MAP_KEY` 확보 필요
- [ ] (선택) Daum Postcode 팝업 vs embed 모드 -- 모바일 UX 고려 시 embed가 더 자연스러움. TSD에서 결정
- [ ] (선택) `region_primary`/`region_secondary` 컬럼의 향후 처리 방침 -- 새 주소 필드 도입 후 기존 필드를 deprecated 처리할지, 병행 유지할지 결정 필요. 1차에서는 병행 유지하되 새 주소에서 자동 파싱하여 채움

## 부록 A. DB 변경 (초안)

### `vendors` 테이블 변경

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| road_address | text | nullable | 도로명 주소 (카카오 주소 API 반환값) |
| jibun_address | text | nullable | 지번 주소 |
| address_detail | text | nullable | 상세 주소 (층, 호수 등 사용자 입력) |
| zonecode | text | nullable | 우편번호 |
| latitude | double precision | nullable | 위도 |
| longitude | double precision | nullable | 경도 |

- `region_primary`/`region_secondary` 컬럼은 유지한다 (하위 호환성). 새 주소 입력 시 도로명 주소에서 시/도, 구/군을 파싱하여 자동으로 채운다.
- 인덱스: 1차에서는 좌표 인덱스 불필요 (거리 기반 검색이 비범위이므로). 후속 단계에서 `idx_vendors_lat_lng` 추가 검토.
- 마이그레이션 파일: `app/supabase/migrations/YYYYMMDDHHMMSS_vendor_address_geocoding.sql`

## 부록 B. API 변경 (초안)

### 기존 API 수정

| 엔드포인트 | 변경 내용 |
| --- | --- |
| `POST /api/vendors/me` | 요청 바디에 `roadAddress`, `jibunAddress`, `addressDetail`, `zonecode`, `latitude`, `longitude` 필드 추가 (모두 optional) |
| `PATCH /api/vendors/me` | 동일 |
| `GET /api/vendors/me` | 응답에 주소/좌표 필드 포함 |
| `GET /api/vendors/[id]` | 응답에 주소/좌표 필드 포함 |

### 신규 API

| 엔드포인트 | 메서드 | 권한 | 설명 |
| --- | --- | --- | --- |
| `/api/geocode` | POST | vendor | 주소 텍스트를 받아 카카오 Geocoding API로 좌표 변환 후 반환 |

- `POST /api/geocode` 요청: `{ address: string }`
- `POST /api/geocode` 응답: `{ latitude: number, longitude: number }` 또는 변환 실패 시 404
