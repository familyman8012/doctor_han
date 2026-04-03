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

## 완료: Mutation 스모크 테스트 (2026-04-03)

57개 POST/PATCH/DELETE 엔드포인트 테스트 → 2개 버그 발견 및 수정.

### 수정된 버그

| # | 엔드포인트 | 에러 | 원인 | 수정 파일 |
|---|-----------|------|------|----------|
| 9 | `POST /api/support/tickets` | 500 — FK violation (23503) | 유효하지 않은 categoryId에 대해 500 반환 | `server/support/repository.ts` |
| 10 | `POST /api/admin/help-center/articles` | 500 — FK violation (23503) | 유효하지 않은 categoryId에 대해 500 반환 | `api/admin/help-center/articles/route.ts` |

### 테스트 결과 요약

- ✅ OK (2xx): 12
- ⚠️ Zod 검증 실패 (4xx): 29 (정상 — 최소 payload로 테스트하므로)
- ❌ 5xx: 0 (수정 후)
- ⏭️ 건너뜀: 16 (동적 ID 미확보)

상세: `doc/mutation-smoke-report.md`

## 완료: 스모크 테스트 개선 (2026-04-03)

- [x] Navigation timeout 15s → 30s 로 증가
- [x] false positive 필터링 (dummy UUID 페이지의 404, "찾을 수 없습니다" 토스트/콘솔 에러 제외)
- [x] `pnpm smoke:mutation` 스크립트 추가

---

## 미완료: 다음 세션에서 진행

### E2E 시나리오 테스트 (회귀 방지)
- [ ] 회원가입 → 인증 제출 → 관리자 승인 전체 플로우
- [ ] 문의 생성 → 업체 응답 → 견적 → 계약 플로우
- [ ] 크레딧 충전 → 광고 구매 플로우

---

## 스모크 테스트 실행 방법

```bash
cd app
pnpm db:start    # Supabase 로컬 실행
pnpm dev         # dev server 시작
pnpm smoke       # 페이지 로딩 스모크 테스트 → doc/smoke-report.md
pnpm smoke:mutation  # Mutation 엔드포인트 테스트 → doc/mutation-smoke-report.md
```
