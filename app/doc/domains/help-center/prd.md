# 헬프센터(FAQ/공지사항) PRD

> 본 문서는 사용자 요구사항 수집 결과와 기존 시스템 탐색 결과를 기반으로 헬프센터(FAQ/공지사항) 기능을 정의한다.
> 참조: `app/doc/domains/help-center/exploration.md:1`

## 1. 배경 및 문제 정의

- 사용자(환자/의료인)가 서비스 이용 중 자주 묻는 질문(FAQ)이나 공지사항을 확인할 수 있는 전용 채널이 없다.
- 현재 사용자 문의는 개별 연락으로 처리되며, 반복 질문에 대한 응대 비용이 발생한다.
- 서비스 공지사항을 전달할 공식 채널이 부재하여 중요 안내가 누락될 수 있다.
- 관리자가 FAQ와 공지사항을 효율적으로 관리할 수 있는 도구가 필요하다.

## 2. 목표 (Goals)

1. `help_articles` 통합 테이블 생성 (type: `faq`, `notice`, `guide`)
2. FAQ 카테고리 분류 지원 (`help_categories` 테이블)
3. 비로그인 사용자도 공개 문서 조회 가능 (RLS `is_published = true`)
4. `/help` 공개 페이지 (목록, 상세, 검색)
5. `/admin/help-center` 관리자 페이지 (FAQ/공지 탭 분리, CRUD)
6. 공지사항 상단 고정 기능 (`is_pinned`)
7. 공개/비공개 상태 관리 (`is_published`)
8. 제목+본문 키워드 검색 (ILIKE)
9. `audit_logs` 기록 (생성/수정/삭제)

## 3. 비범위 (Non-Goals)

- 예약 발행 (published_at 지정) - 후속 단계로 미룸
- Full-text Search (tsvector) - 후속 단계로 미룸
- 로그 기반 추천 - 후순위
- 첨부파일 기능 - 후순위
- 다국어 지원 - 후속 단계로 미룸

## 4. 주요 사용자 및 시나리오

| 사용자 | 시나리오 | 기대 결과 |
|--------|----------|-----------|
| 비로그인 사용자 | `/help`에서 FAQ를 검색하여 궁금한 내용 확인 | 키워드로 검색 후 관련 FAQ 확인 가능 |
| 비로그인 사용자 | `/help`에서 공지사항 목록을 확인 | 최신 공지와 고정 공지를 한눈에 파악 |
| 비로그인 사용자 | FAQ 카테고리별 필터링으로 관련 문서 탐색 | 카테고리 선택 시 해당 분류의 FAQ만 표시 |
| 로그인 사용자 | 서비스 이용 중 FAQ 참조 | 동일하게 공개 문서 조회 가능 |
| 관리자 | FAQ 문서 생성/수정/삭제 | CRUD 완료 후 즉시 반영 (is_published에 따름) |
| 관리자 | 공지사항 생성 후 상단 고정 | is_pinned 설정 시 공지 목록 최상단 노출 |
| 관리자 | 문서를 비공개 상태로 저장 | is_published=false로 저장 후 공개 페이지에 미노출 |

## 5. 기능 요구사항

### 5.1 데이터 모델

#### 5.1.1 help_categories 테이블
- FAQ 카테고리 분류용 테이블
- 필드: id(uuid), name(varchar), slug(varchar unique), display_order(int), is_active(boolean)
- 기존 categories 테이블과 별개로 관리 (헬프센터 전용)
- 근거: 탐색 결과 `app/supabase/migrations/20251218190000_p0_schema.sql` enum/테이블 패턴 참조

#### 5.1.2 help_articles 테이블
- 통합 문서 테이블 (FAQ, 공지사항, 가이드)
- type enum: `faq`, `notice`, `guide`
- 필드: id(uuid), type(enum), category_id(uuid nullable, FK), title(varchar), content(text), is_published(boolean), is_pinned(boolean), display_order(int), created_at, updated_at, created_by(uuid)
- FAQ만 category_id 사용, notice/guide는 null
- 근거: 탐색 결과 `app/supabase/migrations/20260117152258_review_reports.sql` status enum 패턴 참조

### 5.2 접근 권한/RLS

- **공개 읽기**: anon/authenticated 모두 `is_published = true` 조건으로 SELECT 가능
- **관리자 전체 권한**: admin 역할은 모든 CRUD 가능
- 근거: 탐색 결과 `app/src/server/auth/guards.ts:1` withRole 패턴 참조

### 5.3 UI 진입점 (상세 설계는 TSD)

#### 5.3.1 공개 페이지 (`/help`)
- **경로**: `/help` (메인), `/help/faq`, `/help/notice`
- **진입점**: 헤더/푸터 링크, 직접 URL 접근
- **주요 화면**: 탭(FAQ/공지) + 검색 + 카테고리 필터 + 목록 + 상세
- **레퍼런스**: `app/src/app/(main)/legal/layout.tsx` 공개 정적 페이지 패턴

#### 5.3.2 관리자 페이지 (`/admin/help-center`)
- **경로**: `/admin/help-center`
- **진입점**: 관리자 사이드바 메뉴
- **주요 화면**: FAQ/공지 탭 분리 + CRUD 모달 + 테이블 목록
- **레퍼런스**: `app/src/app/(main)/admin/categories/page.tsx` 관리자 CRUD 패턴

### 5.4 API / 데이터

#### 5.4.1 공개 API (`/api/help/...`)
- `GET /api/help/articles` - 공개 문서 목록 조회 (type 필터, 카테고리 필터, 검색, 페이지네이션)
- `GET /api/help/articles/[id]` - 공개 문서 상세 조회
- `GET /api/help/categories` - 공개 카테고리 목록 조회

#### 5.4.2 관리자 API (`/api/admin/help-center/...`)
- `GET /api/admin/help-center/articles` - 관리자 문서 목록 (is_published 무관)
- `POST /api/admin/help-center/articles` - 문서 생성
- `GET /api/admin/help-center/articles/[id]` - 문서 상세
- `PATCH /api/admin/help-center/articles/[id]` - 문서 수정
- `DELETE /api/admin/help-center/articles/[id]` - 문서 삭제
- `GET /api/admin/help-center/categories` - 카테고리 목록
- `POST /api/admin/help-center/categories` - 카테고리 생성
- `PATCH /api/admin/help-center/categories/[id]` - 카테고리 수정
- `DELETE /api/admin/help-center/categories/[id]` - 카테고리 삭제

### 5.5 권한/보안

- 공개 API: 인증 불필요 (`withApi` only)
- 관리자 API: `withApi(withRole(["admin"], ...))`
- RLS 정책: anon/authenticated SELECT where `is_published = true`, admin ALL
- 근거: `app/src/app/api/categories/route.ts:1` 공개 조회 패턴, `app/src/app/api/admin/categories/route.ts:1` 관리자 CRUD 패턴

### 5.6 검색 기능

- ILIKE 기반 제목(title) + 본문(content) 검색
- 검색어가 제목 또는 본문에 포함된 문서 반환
- 검색 트리거: 버튼/Enter submit
- 근거: `app/src/app/(main)/search/page.tsx:1` 검색 페이지 패턴

### 5.7 정렬 및 고정

- **공지사항**: `is_pinned DESC, created_at DESC` (고정 문서 우선, 최신순)
- **FAQ**: `display_order ASC, created_at DESC` (표시 순서, 최신순)
- 관리자가 display_order 설정 가능

### 5.8 감사 로그

- `audit_logs` 테이블에 문서/카테고리 생성/수정/삭제 이벤트 기록
- entity_type: `help_article`, `help_category`
- action: `create`, `update`, `delete`
- 근거: `app/src/app/api/admin/categories/route.ts:1` audit_logs 패턴

## 6. 비기능 요구사항 (NFR)

### 6.1 성능/응답성

- **API p95 응답 시간**: 200ms 이하 (목록), 100ms 이하 (상세)
- **페이지네이션**: `page`, `pageSize` (기본 10, 최대 50)
- **정렬 키**: 공지 - `is_pinned DESC, created_at DESC`, FAQ - `display_order ASC, created_at DESC`
- **검색 트리거**: 버튼/Enter submit (디바운스 불필요)
- **로딩 UX**: 목록 스켈레톤, 버튼 스피너
- **데이터 규모 가정**: FAQ 100건 이하, 공지 50건 이하 (초기)

### 6.2 안정성/복구

- 외부 의존성 없음 (Supabase only)
- 삭제 시 soft delete 미적용 (hard delete, audit_logs로 이력 추적)

### 6.3 관측(로그/감사/지표)

- **감사 로그**: audit_logs 테이블에 기록 (entity_type, action, target_id, metadata)
- **로그 키**: articleId, categoryId, userId
- 근거: `app/src/app/api/admin/categories/route.ts:1` audit_logs 기록 패턴

## 7. 엣지 케이스

- **검색 결과 없음**: "검색 결과가 없습니다" 메시지 표시, 검색어 재입력 안내
- **카테고리 삭제 시 FAQ 존재**: 삭제 차단 또는 FAQ의 category_id를 null로 변경 (차단 우선)
- **비공개 문서 직접 URL 접근**: 404 또는 접근 불가 페이지 표시
- **동시 수정**: 낙관적 락 미적용, 마지막 수정이 반영됨 (1차 릴리스)

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 검색 성능 저하 (데이터 증가 시) | 응답 시간 증가 | 초기 ILIKE로 구현, 데이터 증가 시 tsvector 검토 |
| 잘못된 공지 발행 | 사용자 혼란 | is_published 토글로 즉시 비공개 처리 가능 |
| 관리자 실수로 문서 삭제 | 데이터 손실 | audit_logs로 이력 추적, 필요 시 복구 |

## 9. 롤아웃 / 백로그

### 1차 릴리스 범위
1. DB 스키마 (help_categories, help_articles, enum, RLS)
2. 공개 API + 관리자 API
3. 공개 페이지 (`/help`)
4. 관리자 페이지 (`/admin/help-center`)
5. 키워드 검색 (ILIKE)
6. 감사 로그

### 후속 백로그 항목
- [ ] 예약 발행 (published_at 지정)
- [ ] Full-text Search (tsvector)
- [ ] 첨부파일 기능
- [ ] 조회수 카운트
- [ ] 로그 기반 인기/관련 문서 추천
- [ ] 다국어 지원

## 10. 오픈 이슈 / 결정 필요

- [x] (결정됨) 테이블 구조: 통합 테이블 `help_articles` + type enum
- [x] (결정됨) FAQ 분류: 별도 `help_categories` 테이블
- [x] (결정됨) 접근 권한: 비로그인도 공개 문서 조회 가능
- [x] (결정됨) 공지 고정: `is_pinned` 필드 사용
- [x] (결정됨) 발행 상태: `is_published` (공개/비공개만)
- [x] (결정됨) 검색: 제목+본문 ILIKE
- [ ] (선택) 카테고리 삭제 시 FAQ 처리 방식: 삭제 차단 vs category_id null 처리
