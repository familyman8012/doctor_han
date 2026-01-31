# 감사 로그/변경 기록 시스템 재정비 PRD

> 참조: `app/supabase/migrations/20251218190000_p0_schema.sql:99-107`, `app/src/server/report/service.ts:27-36`
> 본 문서는 기존 감사 로그 시스템의 통합 재정비와 누락 이벤트 추가를 정의한다.

## 1. 배경 및 문제 정의

현재 감사 로그 시스템에 여러 문제점이 존재한다:

1. **패턴 일관성 부재**: `safeInsertAuditLog` 함수가 `app/src/server/report/service.ts:27-36`에 위치하여 report 도메인에 종속되어 있음. 다른 도메인에서 재사용이 어렵다.

2. **누락된 이벤트**: 회원가입, 프로필 수정, 인증 서류 다운로드 등 중요 이벤트가 감사 로그에 기록되지 않음.
   - `app/src/app/api/profile/route.ts:12-82` - profile.create 미기록
   - `app/src/app/api/profile/route.ts:84-147` - profile.update 미기록
   - `app/src/app/api/vendors/me/route.ts:88-222` - vendor.create/update 미기록
   - `app/src/app/api/files/signed-download/route.ts` - 인증 서류 다운로드 미기록

3. **RLS 정책 제한**: 현재 RLS 정책(`app/supabase/migrations/20251218190000_p0_schema.sql:99-107`)이 admin만 insert 허용. 일반 사용자의 가입/프로필 수정 시 로그 삽입 불가.

4. **인덱스 부재**: audit_logs 테이블에 인덱스가 없어 조회 성능 저하 우려.

5. **통합 조회 UI 부재**: 관리자가 감사 로그를 통합 조회할 수 있는 UI가 없음.

## 2. 목표 (Goals)

1. 감사 로그 삽입 패턴을 공통 모듈(`app/src/server/audit/`)로 통합하여 일관성 확보
2. 누락된 이벤트 6종 추가 (profile.create, profile.update, profile.delete, vendor.create, vendor.update, file.download)
3. `/admin/audit-logs` 통합 조회 UI 신규 구성 (필터, 페이지네이션, URL 상태 관리)
4. 조회 성능 최적화를 위한 인덱스 추가
5. RLS 정책 수정으로 일반 사용자도 자신의 액션 기록 가능하게 함

## 3. 비범위 (Non-Goals)

- 요금 변경 로그 (현재 요금 관련 필드 없음)
- 환불 변경 로그 (현재 환불 기능 없음)
- 로그인/로그아웃 기록 (별도 세션 관리 영역)
- 모든 CRUD 기록 (주요 변경 사항만 기록)
- 로그 보존 정책/아카이빙 (후속 단계)
- 로그 내보내기 기능 (후속 단계)

## 4. 주요 사용자 및 시나리오

| 사용자 | 시나리오 | 기대 결과 |
|--------|----------|-----------|
| 관리자 | 특정 기간의 사용자 가입 현황을 확인하고 싶다 | 기간 필터로 profile.create 액션 조회 |
| 관리자 | 특정 사용자의 프로필 수정 이력을 추적하고 싶다 | 행위자 필터로 해당 사용자의 profile.update 조회 |
| 관리자 | 인증 서류 다운로드 기록을 감사하고 싶다 | file.download 액션으로 필터링하여 조회 |
| 관리자 | 인증 승인/거절 이력을 확인하고 싶다 | doctor/vendor_verification.approve/reject 필터로 조회 |
| 관리자 | 제재 이력을 확인하고 싶다 | sanction.create/revoke 필터로 조회 |

## 5. 기능 요구사항

### 5.1 감사 로그 공통 모듈 통합

- `safeInsertAuditLog` 함수를 `app/src/server/audit/utils.ts`로 이동
- 기존 `app/src/server/report/service.ts:27-36`의 함수를 공통 모듈에서 import하도록 변경
- 모든 도메인에서 동일한 패턴으로 감사 로그 삽입

### 5.2 신규 이벤트 추가

| 액션 | target_type | 삽입 위치 | 설명 | metadata |
|------|------------|----------|------|----------|
| profile.create | profile | api/profile/route.ts POST | 회원가입 | role, name |
| profile.update | profile | api/profile/route.ts PATCH | 프로필 수정 | updatedFields |
| profile.delete | profile | (미구현) | 회원 탈퇴 | reason? |
| vendor.create | vendor | api/vendors/me/route.ts POST | 업체 프로필 생성 | vendorId, name |
| vendor.update | vendor | api/vendors/me/route.ts PATCH | 업체 프로필 수정 | updatedFields |
| file.download | verification_file | api/files/signed-download/route.ts | 인증 서류 다운로드 | fileType, fileName, targetUserId |

### 5.3 RLS 정책 수정

- 현재: admin만 insert 가능
- 변경: authenticated 사용자도 자신의 actor_user_id로 insert 가능
- 조회(select)는 admin만 유지

### 5.4 인덱스 추가

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| idx_audit_logs_created_at | created_at DESC | 기간별 조회 |
| idx_audit_logs_action | action | 액션 유형별 조회 |
| idx_audit_logs_target_type | target_type | 대상 유형별 조회 |
| idx_audit_logs_actor | actor_user_id | 행위자별 조회 |
| idx_audit_logs_target | (target_type, target_id) | 대상별 조회 |

### 5.5 UI 진입점

- **경로**: `/admin/audit-logs`
- **진입점**: 관리자 사이드바 메뉴에 "감사 로그" 항목 추가
- **주요 화면**: 필터 + 목록 + 페이지네이션
- **레퍼런스**: `app/src/app/(main)/admin/reports/page.tsx` 참조

### 5.6 API / 데이터

- `GET /api/admin/audit-logs` - 감사 로그 목록 조회
  - Query: 기간(startDate, endDate), 액션(action), 대상유형(targetType), 행위자(actorId), 페이지(page)
  - Response: items, page, pageSize, total

### 5.7 권한/보안

- 조회 API: admin 역할만 접근 가능 (withRole guard)
- RLS 정책:
  - SELECT: admin만
  - INSERT: authenticated 사용자 (자신의 actor_user_id만)

## 6. 비기능 요구사항 (NFR)

### 성능/응답성

- **API p95 응답 시간**: < 500ms (측정: 서버 로그)
- **페이지네이션**: page, pageSize (기본 20, 최대 100)
- **정렬**: created_at DESC (안정적 정렬)
- **검색 트리거**: 버튼/Enter submit (입력 즉시 검색 금지)
- **로딩 UX**: 스피너/스켈레톤 표시
- **데이터 규모 가정**: 초기 ~10,000건, 월 ~5,000건 증가 예상

### 관측 (로그/감사/지표)

- 감사 로그 조회 자체는 별도 감사 로그 불필요
- 에러 발생 시 console.error로 로깅 (기존 패턴 유지)

## 7. 엣지 케이스

- **actor_user_id가 삭제된 경우**: profiles 테이블에 on delete restrict로 방지됨
- **metadata가 너무 큰 경우**: 필수 필드만 저장, 큰 데이터는 제외
- **동시 삽입**: 감사 로그는 독립적이므로 충돌 없음
- **빈 검색 결과**: "검색 결과가 없습니다" 표시
- **탈퇴 API 미구현**: profile.delete는 API 존재 시에만 구현

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 인덱스 추가 시 잠금 | 일시적 쓰기 지연 | CONCURRENTLY 옵션 사용 |
| RLS 변경 시 보안 취약 | 권한 없는 로그 삽입 | actor_user_id = auth.uid() 검증 유지 |
| 기존 코드 수정 | 사이드 이펙트 | 테스트 및 단계별 롤아웃 |

## 9. 롤아웃 / 백로그

1. **1차 릴리스 범위**
   - 인덱스 추가 마이그레이션
   - RLS 정책 수정
   - 공통 모듈 생성 및 기존 코드 리팩터링
   - 신규 이벤트 6종 추가
   - `/admin/audit-logs` UI 신규 구성

2. **후속 백로그**
   - [ ] 로그 보존 정책 (90일 이후 아카이빙)
   - [ ] 로그 CSV 내보내기
   - [ ] 실시간 로그 스트리밍 (관리자 대시보드)
   - [ ] 이상 행동 탐지 알림

## 10. 오픈 이슈 / 결정 필요

- [ ] (선택) profile.delete 구현 - 탈퇴 API가 현재 미구현. 탈퇴 API 구현 시 함께 추가
- [ ] (선택) 로그 보존 기간 - 현재 무제한, 추후 보존 정책 논의 필요
