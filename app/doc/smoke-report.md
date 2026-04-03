# Smoke Test Report

**Date**: 2026-03-30T06:46:13
**Total errors**: 33
**P0 (critical)**: 10
**P1 (major)**: 5
**P2 (minor)**: 18

---

## P0 — Critical (5xx / crashes / error toasts)

- **[doctor] /products/00000000-0000-0000-0000-000000000000** — `toast`: 상품을 찾을 수 없습니다.
- **[vendor] /partner/products** — `crash`: Navigation failed: Navigation timeout of 15000 ms exceeded
- **[vendor] /partner/leads** — `crash`: Navigation failed: Navigation timeout of 15000 ms exceeded
- **[vendor] /partner/support** — `crash`: Navigation failed: Navigation timeout of 15000 ms exceeded
- **[vendor] /partner/support/new** — `crash`: Navigation failed: Navigation timeout of 15000 ms exceeded
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `toast`: 리드를 찾을 수 없습니다.
- **[vendor] /partner/products/00000000-0000-0000-0000-000000000000** — `toast`: 상품을 찾을 수 없습니다.
- **[vendor] /partner/bids/00000000-0000-0000-0000-000000000000** — `toast`: 프로젝트를 찾을 수 없습니다.
- **[admin] /admin/beta-ops/history** — `crash`: Navigation failed: Navigation timeout of 15000 ms exceeded
- **[admin] /admin/beta-ops/rewards** — `crash`: Navigation failed: Navigation timeout of 15000 ms exceeded

## P1 — Major (4xx errors)

- **[doctor] /products/00000000-0000-0000-0000-000000000000** — `network`: 404 Not Found
  - Detail: `http://localhost:3000/api/products/00000000-0000-0000-0000-000000000000`
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `network`: 404 Not Found
  - Detail: `http://localhost:3000/api/leads/00000000-0000-0000-0000-000000000000`
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `network`: 404 Not Found
  - Detail: `http://localhost:3000/api/leads/00000000-0000-0000-0000-000000000000/messages?page=1&pageSize=1`
- **[vendor] /partner/products/00000000-0000-0000-0000-000000000000** — `network`: 404 Not Found
  - Detail: `http://localhost:3000/api/vendors/me/products/00000000-0000-0000-0000-000000000000`
- **[vendor] /partner/bids/00000000-0000-0000-0000-000000000000** — `network`: 404 Not Found
  - Detail: `http://localhost:3000/api/bid/projects/00000000-0000-0000-0000-000000000000`

## P2 — Minor (console errors)

- **[doctor] /products/00000000-0000-0000-0000-000000000000** — `console`: Failed to load resource: the server responded with a status of 404 (Not Found)
- **[doctor] /products/00000000-0000-0000-0000-000000000000** — `console`: [Query Error] [404] 4040: 상품을 찾을 수 없습니다.
- **[vendor] /partner/bids** — `console`: [Query Error] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[vendor] /partner/bids** — `console`: [Query Error] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `console`: Failed to load resource: the server responded with a status of 404 (Not Found)
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `console`: [Query Error] [404] 4040: 리드를 찾을 수 없습니다.
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `console`: Failed to load resource: the server responded with a status of 404 (Not Found)
- **[vendor] /partner/leads/00000000-0000-0000-0000-000000000000** — `console`: [Query Error] [404] 4040: 리드를 찾을 수 없습니다.
- **[vendor] /partner/products/00000000-0000-0000-0000-000000000000** — `console`: Failed to load resource: the server responded with a status of 404 (Not Found)
- **[vendor] /partner/products/00000000-0000-0000-0000-000000000000** — `console`: [Query Error] [404] 4040: 상품을 찾을 수 없습니다.
- **[vendor] /partner/bids/00000000-0000-0000-0000-000000000000** — `console`: Failed to load resource: the server responded with a status of 404 (Not Found)
- **[vendor] /partner/bids/00000000-0000-0000-0000-000000000000** — `console`: [Query Error] [404] 4040: 프로젝트를 찾을 수 없습니다.
- **[admin] /admin/beta-ops** — `console`: [Query Error] ["categories"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[admin] /admin/beta-ops** — `console`: [Query Error] ["admin-help-categories"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[admin] /admin/beta-ops** — `console`: [Query Error] ["admin-help-articles",{"type":"faq","page":1}] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[admin] /admin/beta-ops** — `console`: [Query Error] ["auth","me"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[admin] /admin/beta-ops/vendor-grades** — `console`: [Query Error] ["categories"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- **[admin] /admin/beta-ops/vendor-grades** — `console`: [Query Error] ["auth","me"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.

## Errors by Page

### [admin] /admin/beta-ops (4 errors)
- [P2/console] [Query Error] ["categories"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- [P2/console] [Query Error] ["admin-help-categories"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- [P2/console] [Query Error] ["admin-help-articles",{"type":"faq","page":1}] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- [P2/console] [Query Error] ["auth","me"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.

### [admin] /admin/beta-ops/history (1 errors)
- [P0/crash] Navigation failed: Navigation timeout of 15000 ms exceeded

### [admin] /admin/beta-ops/rewards (1 errors)
- [P0/crash] Navigation failed: Navigation timeout of 15000 ms exceeded

### [admin] /admin/beta-ops/vendor-grades (2 errors)
- [P2/console] [Query Error] ["categories"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- [P2/console] [Query Error] ["auth","me"] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.

### [doctor] /products/00000000-0000-0000-0000-000000000000 (4 errors)
- [P1/network] 404 Not Found
- [P2/console] Failed to load resource: the server responded with a status of 404 (Not Found)
- [P2/console] [Query Error] [404] 4040: 상품을 찾을 수 없습니다.
- [P0/toast] 상품을 찾을 수 없습니다.

### [vendor] /partner/bids (2 errors)
- [P2/console] [Query Error] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.
- [P2/console] [Query Error] [0] NETWORK_ERROR: 네트워크 연결을 확인해주세요.

### [vendor] /partner/bids/00000000-0000-0000-0000-000000000000 (4 errors)
- [P1/network] 404 Not Found
- [P2/console] Failed to load resource: the server responded with a status of 404 (Not Found)
- [P2/console] [Query Error] [404] 4040: 프로젝트를 찾을 수 없습니다.
- [P0/toast] 프로젝트를 찾을 수 없습니다.

### [vendor] /partner/leads (1 errors)
- [P0/crash] Navigation failed: Navigation timeout of 15000 ms exceeded

### [vendor] /partner/leads/00000000-0000-0000-0000-000000000000 (7 errors)
- [P1/network] 404 Not Found
- [P2/console] Failed to load resource: the server responded with a status of 404 (Not Found)
- [P2/console] [Query Error] [404] 4040: 리드를 찾을 수 없습니다.
- [P1/network] 404 Not Found
- [P2/console] Failed to load resource: the server responded with a status of 404 (Not Found)
- [P2/console] [Query Error] [404] 4040: 리드를 찾을 수 없습니다.
- [P0/toast] 리드를 찾을 수 없습니다.

### [vendor] /partner/products (1 errors)
- [P0/crash] Navigation failed: Navigation timeout of 15000 ms exceeded

### [vendor] /partner/products/00000000-0000-0000-0000-000000000000 (4 errors)
- [P1/network] 404 Not Found
- [P2/console] Failed to load resource: the server responded with a status of 404 (Not Found)
- [P2/console] [Query Error] [404] 4040: 상품을 찾을 수 없습니다.
- [P0/toast] 상품을 찾을 수 없습니다.

### [vendor] /partner/support (1 errors)
- [P0/crash] Navigation failed: Navigation timeout of 15000 ms exceeded

### [vendor] /partner/support/new (1 errors)
- [P0/crash] Navigation failed: Navigation timeout of 15000 ms exceeded
