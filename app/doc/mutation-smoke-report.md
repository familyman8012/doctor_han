# Mutation Smoke Test Report

**Date**: 2026-04-03T11:08:27
**Total tested**: 56
**Bugs (5xx/fetch)**: 0
**Expected 4xx**: 11
**Suspicious (404/405)**: 0
**OK (2xx)**: 26
**Validation / Permission (other 4xx)**: 0
**Skipped**: 19

---

## Expected Validation / Business Rule 4xx

- [vendor] POST /api/vendors/me/prices → 409
- [doctor] POST /api/leads → 400
- [vendor] POST /api/leads/56fe621a-ec62-4da4-8358-51a1d15f4c13/report → 409
- [doctor] POST /api/support/tickets → 429
- [vendor] POST /api/bid/projects/cf0b5962-fbf1-438c-a422-efd3edd4160f/responses → 400
- [vendor] POST /api/payments/confirm → 404
- [doctor] POST /api/geocode → 403
- [vendor] POST /api/vendors/me/subscriptions → 400
- [vendor] POST /api/vendors/me/membership → 400
- [vendor] POST /api/refunds → 400
- [admin] POST /api/admin/ads/campaigns → 400

## All Results

| Role | Method | Endpoint | Status | Result |
|------|--------|----------|--------|--------|
| admin | POST | /api/admin/help-center/categories | 201 | ✅ |
| admin | POST | /api/admin/categories | 201 | ✅ |
| vendor | PATCH | /api/vendors/me | 200 | ✅ |
| vendor | POST | /api/vendors/me/prices | 409 | ✅ |
| doctor | POST | /api/leads | 400 | ✅ |
| doctor | POST | /api/leads/00000000-0000-0000-0000-000000000099/messages | -1 | ⏭️ |
| doctor | PATCH | /api/leads/00000000-0000-0000-0000-000000000099/messages/read | -1 | ⏭️ |
| doctor | POST | /api/reviews | -1 | ⏭️ |
| vendor | POST | /api/reviews/00000000-0000-0000-0000-000000000099/reply | -1 | ⏭️ |
| vendor | POST | /api/reviews/00000000-0000-0000-0000-000000000099/report | -1 | ⏭️ |
| vendor | POST | /api/leads/56fe621a-ec62-4da4-8358-51a1d15f4c13/report | 409 | ✅ |
| admin | POST | /api/admin/reviews/00000000-0000-0000-0000-000000000099/hide | -1 | ⏭️ |
| admin | POST | /api/admin/reviews/00000000-0000-0000-0000-000000000099/unhide | -1 | ⏭️ |
| doctor | PATCH | /api/reviews/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |
| doctor | POST | /api/favorites/toggle | 200 | ✅ |
| vendor | POST | /api/vendors/me/portfolio | 201 | ✅ |
| vendor | PATCH | /api/vendors/me/portfolio/4c04c420-c17f-4360-a6ca-30f34748d2ef | 200 | ✅ |
| vendor | PATCH | /api/vendors/me/prices/f7f472a2-c3f9-4822-b54c-daa48ac5674c | 200 | ✅ |
| vendor | POST | /api/vendors/me/products | 201 | ✅ |
| vendor | PATCH | /api/vendors/me/products/f03bc0b8-6178-4381-8c67-f9d5a6ca834e | 200 | ✅ |
| doctor | POST | /api/product-favorites/toggle | 200 | ✅ |
| doctor | POST | /api/product-recent-views | 200 | ✅ |
| doctor | POST | /api/support/tickets | 429 | ✅ |
| doctor | POST | /api/support/tickets/00000000-0000-0000-0000-000000000099/messages | -1 | ⏭️ |
| admin | POST | /api/admin/support/tickets/00000000-0000-0000-0000-000000000099/messages | -1 | ⏭️ |
| admin | PATCH | /api/admin/support/tickets/00000000-0000-0000-0000-000000000099/status | -1 | ⏭️ |
| doctor | POST | /api/support/tickets/00000000-0000-0000-0000-000000000099/reopen | -1 | ⏭️ |
| doctor | POST | /api/bid/projects | 201 | ✅ |
| vendor | POST | /api/bid/projects/cf0b5962-fbf1-438c-a422-efd3edd4160f/responses | 400 | ✅ |
| admin | PATCH | /api/admin/bid-projects/cf0b5962-fbf1-438c-a422-efd3edd4160f/status | 200 | ✅ |
| doctor | PATCH | /api/bid/projects/cf0b5962-fbf1-438c-a422-efd3edd4160f/cancel | 200 | ✅ |
| vendor | POST | /api/credits/charge | 200 | ✅ |
| vendor | PATCH | /api/credits/auto-charge | 200 | ✅ |
| vendor | POST | /api/payments/confirm | 404 | ✅ |
| doctor | PATCH | /api/notification-settings | 200 | ✅ |
| doctor | PATCH | /api/profile | 200 | ✅ |
| doctor | PATCH | /api/onboarding | 200 | ✅ |
| doctor | POST | /api/geocode | 403 | ✅ |
| doctor | POST | /api/files/signed-upload | 201 | ✅ |
| vendor | POST | /api/vendors/me/subscriptions | 400 | ✅ |
| vendor | POST | /api/vendors/me/membership | 400 | ✅ |
| vendor | POST | /api/ads/priority/purchase | -1 | ⏭️ |
| doctor | POST | /api/ads/banners/00000000-0000-0000-0000-000000000099/click | -1 | ⏭️ |
| vendor | POST | /api/refunds | 400 | ✅ |
| admin | PATCH | /api/admin/categories/d3e73462-1fde-4b71-a1b3-9ef0ed97edbb | 200 | ✅ |
| admin | POST | /api/admin/verifications/00000000-0000-0000-0000-000000000099/reject | -1 | ⏭️ |
| admin | POST | /api/admin/help-center/articles | 201 | ✅ |
| admin | POST | /api/admin/reports/00000000-0000-0000-0000-000000000099/review | -1 | ⏭️ |
| admin | POST | /api/admin/lead-reports/00000000-0000-0000-0000-000000000099/review | -1 | ⏭️ |
| admin | POST | /api/admin/settlements/generate | 201 | ✅ |
| admin | POST | /api/admin/ads/campaigns | 400 | ✅ |
| admin | POST | /api/admin/credits/83c31402-5660-4cd1-978d-16d96205b0c3/adjust | 201 | ✅ |
| admin | PATCH | /api/admin/products/f03bc0b8-6178-4381-8c67-f9d5a6ca834e | 200 | ✅ |
| doctor | PATCH | /api/leads/00000000-0000-0000-0000-000000000099/status | -1 | ⏭️ |
| doctor | DELETE | /api/reviews/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |
| vendor | DELETE | /api/vendors/me/portfolio/4c04c420-c17f-4360-a6ca-30f34748d2ef | 200 | ✅ |