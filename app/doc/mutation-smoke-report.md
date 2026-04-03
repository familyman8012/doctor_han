# Mutation Smoke Test Report

**Date**: 2026-04-03T08:20:11
**Total tested**: 57
**Bugs (5xx)**: 0
**OK (2xx)**: 12
**Validation (4xx)**: 29
**Skipped**: 16

---

## All Results

| Role | Method | Endpoint | Status | Result |
|------|--------|----------|--------|--------|
| doctor | POST | /api/leads | 400 | ⚠️ |
| doctor | PATCH | /api/leads/7611346e-a6b0-4021-83b3-20a576c35590/status | 200 | ✅ |
| doctor | POST | /api/leads/7611346e-a6b0-4021-83b3-20a576c35590/messages | 201 | ✅ |
| doctor | PATCH | /api/leads/7611346e-a6b0-4021-83b3-20a576c35590/messages/read | 400 | ⚠️ |
| doctor | POST | /api/leads/7611346e-a6b0-4021-83b3-20a576c35590/report | 403 | ⚠️ |
| doctor | POST | /api/reviews | 400 | ⚠️ |
| doctor | PATCH | /api/reviews/d3d49233-e111-4d83-869e-49d61ee34336 | 200 | ✅ |
| doctor | DELETE | /api/reviews/d3d49233-e111-4d83-869e-49d61ee34336 | 200 | ✅ |
| doctor | POST | /api/reviews/d3d49233-e111-4d83-869e-49d61ee34336 | 405 | ⚠️ |
| vendor | POST | /api/reviews/d3d49233-e111-4d83-869e-49d61ee34336/reply | 404 | ⚠️ |
| doctor | POST | /api/favorites/toggle | 200 | ✅ |
| doctor | POST | /api/product-favorites/toggle | 400 | ⚠️ |
| vendor | PATCH | /api/vendors/me | 200 | ✅ |
| vendor | POST | /api/vendors/me/products | 400 | ⚠️ |
| vendor | PATCH | /api/vendors/me/products/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |
| vendor | POST | /api/vendors/me/portfolio | 201 | ✅ |
| vendor | PATCH | /api/vendors/me/portfolio/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |
| vendor | DELETE | /api/vendors/me/portfolio/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |
| vendor | POST | /api/vendors/me/prices | 400 | ⚠️ |
| vendor | PATCH | /api/vendors/me/prices/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |
| doctor | POST | /api/support/tickets | 400 | ⚠️ |
| doctor | POST | /api/support/tickets/00000000-0000-0000-0000-000000000099/messages | -1 | ⏭️ |
| doctor | POST | /api/support/tickets/00000000-0000-0000-0000-000000000099/reopen | -1 | ⏭️ |
| doctor | POST | /api/bid/projects | 201 | ✅ |
| vendor | POST | /api/bid/projects/00000000-0000-0000-0000-000000000099/responses | -1 | ⏭️ |
| doctor | PATCH | /api/bid/projects/00000000-0000-0000-0000-000000000099/cancel | -1 | ⏭️ |
| vendor | POST | /api/credits/charge | 404 | ⚠️ |
| vendor | PATCH | /api/credits/auto-charge | 200 | ✅ |
| vendor | POST | /api/payments/confirm | 404 | ⚠️ |
| doctor | PATCH | /api/notification-settings | 200 | ✅ |
| doctor | PATCH | /api/profile | 200 | ✅ |
| doctor | PATCH | /api/onboarding | 400 | ⚠️ |
| doctor | POST | /api/geocode | 403 | ⚠️ |
| doctor | POST | /api/files/signed-upload | 400 | ⚠️ |
| doctor | POST | /api/product-recent-views | 400 | ⚠️ |
| vendor | POST | /api/vendors/me/subscriptions | 400 | ⚠️ |
| vendor | POST | /api/vendors/me/membership | 400 | ⚠️ |
| vendor | POST | /api/ads/priority/purchase | 400 | ⚠️ |
| doctor | POST | /api/ads/banners/00000000-0000-0000-0000-000000000099/click | -1 | ⏭️ |
| vendor | POST | /api/refunds | 400 | ⚠️ |
| admin | POST | /api/admin/categories | 409 | ⚠️ |
| admin | PATCH | /api/admin/categories/98e9a64d-46eb-4e5d-a022-17b25fda38b4 | 200 | ✅ |
| admin | POST | /api/admin/verifications/00000000-0000-0000-0000-000000000099/reject | -1 | ⏭️ |
| admin | POST | /api/admin/help-center/categories | 400 | ⚠️ |
| admin | POST | /api/admin/help-center/articles | 400 | ⚠️ |
| admin | POST | /api/admin/reviews/d3d49233-e111-4d83-869e-49d61ee34336/hide | 400 | ⚠️ |
| admin | POST | /api/admin/reviews/d3d49233-e111-4d83-869e-49d61ee34336/unhide | 404 | ⚠️ |
| admin | POST | /api/admin/reports/00000000-0000-0000-0000-000000000099/review | -1 | ⏭️ |
| admin | POST | /api/admin/reports/00000000-0000-0000-0000-000000000099/dismiss | -1 | ⏭️ |
| admin | POST | /api/admin/support/tickets/00000000-0000-0000-0000-000000000099/messages | -1 | ⏭️ |
| admin | PATCH | /api/admin/support/tickets/00000000-0000-0000-0000-000000000099/status | -1 | ⏭️ |
| admin | PATCH | /api/admin/bid-projects/00000000-0000-0000-0000-000000000099/status | -1 | ⏭️ |
| admin | POST | /api/admin/settlements/generate | 400 | ⚠️ |
| admin | POST | /api/admin/ads/campaigns | 400 | ⚠️ |
| admin | POST | /api/admin/credits/00000000-0000-0000-0000-000000000099/adjust | 400 | ⚠️ |
| admin | POST | /api/admin/lead-reports/00000000-0000-0000-0000-000000000099/review | 400 | ⚠️ |
| admin | PATCH | /api/admin/products/00000000-0000-0000-0000-000000000099 | -1 | ⏭️ |