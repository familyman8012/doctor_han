# Medihub UAT 테스트 현황

## 완료: 페이지 로딩 스모크 테스트 (2026-03-30)

Puppeteer로 123개 페이지 전수 조사 → 8개 실제 버그 발견 및 수정.

### 수정된 버그

| # | 페이지 | 에러 | 원인 | 수정 파일 |
|---|--------|------|------|----------|
| 1 | `/interior`, `/partner/bids` | 500 — RLS infinite recursion | bid_projects ↔ bid_responses 순환 참조 | `migrations/20260330060000_fix_bid_projects_rls.sql` |
| 2 | `/admin/beta-ops` | 500 — "알림 실패 수를 조회할 수 없습니다" | `created_at` → `sent_at` 컬럼명 오류 | `server/beta-ops/repository.ts` |
| 3 | `/admin/beta-ops/history` | crash — `.slice()` on undefined | API mapper 누락 + null 체크 미비 | `api/admin/beta-ops/status-history/route.ts`, `admin/beta-ops/history/page.tsx` |
| 4 | `/categories` | 400 x 6 — 아이콘 이미지 미존재 | `.png` 파일 누락 | `constants/assets.ts` → `.svg`, SVG 아이콘 생성, `next.config.ts` SVG 허용 |
| 5 | `/partner/credits` | hydration error — button 중첩 | `<button>` 안에 `<Button>` | `partner/credits/page.tsx` → `<div role="button">` |
| 6 | `/api/product-recent-views` | 500 — FK 위반 | 미존재 상품에 대한 recent view 삽입 | `api/product-recent-views/route.ts` |
| 7 | `/vendors/{id}/products` | Query Error | `categories!inner` join 실패 | `api/vendors/[id]/products/route.ts` → left join |
| 8 | 전역 | `[object Object]` 에러 로깅 | QueryCache onError에서 error 직렬화 안됨 | `providers.tsx` — formatError 함수 추가 |

---

## 미완료: 다음 세션에서 진행

### 1. Mutation 엔드포인트 스모크 테스트 (Phase 4)
Puppeteer 페이지 로딩으로 커버 안 되는 POST/PATCH/DELETE 엔드포인트 ~40개:
- [ ] 리드 생성/상태변경/취소
- [ ] 리뷰 작성/수정/삭제
- [ ] 찜 토글
- [ ] 파일 업로드 (signed URL)
- [ ] 업체 프로필/포트폴리오 CRUD
- [ ] 관리자: 인증 승인/반려, 카테고리 CRUD, 제재
- [ ] 크레딧 충전/결제
- [ ] 입찰 응답/선정/계약
- [ ] 고객지원 티켓 생성/답변

### 2. 스모크 테스트 개선
- [ ] Navigation timeout 15s → 30s 로 증가 (dev server 부하 대응)
- [ ] 동적 ID 해소 개선 (vendor 리드/상품/입찰 실제 데이터 연결)
- [ ] false positive 필터링 (dummy UUID 404는 에러에서 제외)

### 3. E2E 시나리오 테스트 (회귀 방지)
- [ ] 회원가입 → 인증 제출 → 관리자 승인 전체 플로우
- [ ] 문의 생성 → 업체 응답 → 견적 → 계약 플로우
- [ ] 크레딧 충전 → 광고 구매 플로우

---

## 스모크 테스트 실행 방법

```bash
cd app
pnpm db:start    # Supabase 로컬 실행
pnpm dev         # dev server 시작
pnpm smoke       # 스모크 테스트 실행 → doc/smoke-report.md 생성
```
