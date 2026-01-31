# Pull Request: 감사 로그 시스템 재정비

## PR 정보

- **PR URL**: https://github.com/familyman8012/doctor_han/pull/7
- **브랜치**: `yun-eunseog/feature/audit-change`
- **커밋 해시**: `e85026f`
- **생성일**: 2026-01-31

## Summary

- 감사 로그 삽입 패턴을 공통 모듈(`app/src/server/audit/`)로 통합하여 일관성 확보
- 누락된 이벤트 5종 추가 (profile.create/update, vendor.create/update, file.download)
- `/admin/audit-logs` 통합 조회 UI 신규 구성 (필터, 페이지네이션, URL 상태 관리)

## Changes

### Database
- `audit_logs` 테이블에 인덱스 5개 추가 (CONCURRENTLY)
  - `idx_audit_logs_created_at` - 기간별 조회
  - `idx_audit_logs_action` - 액션 유형별 조회
  - `idx_audit_logs_target_type` - 대상 유형별 조회
  - `idx_audit_logs_actor` - 행위자별 조회
  - `idx_audit_logs_target` - 대상별 조회
- RLS 정책 수정: authenticated 사용자도 자신의 actor_user_id로 INSERT 가능

### Server Layer
- `app/src/server/audit/utils.ts` - safeInsertAuditLog 공통 함수 생성
- `app/src/server/audit/service.ts` - 감사 로그 조회 서비스
- `app/src/server/audit/mapper.ts` - DB row -> DTO 매퍼
- `app/src/lib/schema/audit.ts` - Zod 스키마 정의

### API Layer
- `GET /api/admin/audit-logs` - 감사 로그 목록 조회 API
- `POST /api/profile` - profile.create 이벤트 추가
- `PATCH /api/profile` - profile.update 이벤트 추가
- `POST /api/vendors/me` - vendor.create 이벤트 추가
- `PATCH /api/vendors/me` - vendor.update 이벤트 추가
- `POST /api/files/signed-download` - file.download 이벤트 추가

### Frontend
- `/admin/audit-logs` 페이지 신규 구성
  - 기간 필터 (DatePicker)
  - 액션 유형 필터 (Select)
  - 대상 유형 필터 (Select)
  - 행위자 필터 (UserSelect)
  - 페이지네이션
  - URL 상태 관리 (nuqs)

## 변경 파일 목록

**문서 (4 files):**
- `app/doc/domains/audit/logs/exploration.md`
- `app/doc/domains/audit/logs/prd.md`
- `app/doc/domains/audit/logs/tsd.md`
- `app/doc/domains/audit/logs/code-review.md`

**Migration (1 file):**
- `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql`

**Schema (1 file):**
- `app/src/lib/schema/audit.ts`

**Server Layer (4 files):**
- `app/src/server/audit/utils.ts`
- `app/src/server/audit/service.ts`
- `app/src/server/audit/mapper.ts`
- `app/src/server/report/service.ts`

**API Layer (4 files):**
- `app/src/app/api/admin/audit-logs/route.ts`
- `app/src/app/api/profile/route.ts`
- `app/src/app/api/vendors/me/route.ts`
- `app/src/app/api/files/signed-download/route.ts`

**Frontend (2 files):**
- `app/src/app/(main)/admin/layout.tsx`
- `app/src/app/(main)/admin/audit-logs/page.tsx`

**API Client (1 file):**
- `app/src/api-client/admin.ts`

## 검증 결과

- lint: 통과 (warning 9개 - 기존 코드)
- type-check: 통과
