# 신고/제재 시스템 PRD

> 참조: `app/src/lib/schema/review.ts:1`, `app/src/server/auth/guards.ts:1`
> 본 문서는 기존 리뷰 신고 시스템(`review_reports`)과 관리자 UI 패턴을 기반으로 통합 신고/제재 시스템을 정의한다.

## 1. 배경 및 문제 정의

현재 플랫폼에는 리뷰 신고 기능만 존재하며(`review_reports` 테이블), 업체나 사용자에 대한 신고 채널이 없다. 신고가 접수되어도 관리자가 체계적으로 심사하고 제재를 부과할 수 있는 워크플로우가 부재하다. 제재 이력 관리 기능이 없어 반복 위반자 식별이 어렵고, 자동화된 콘텐츠 보호 메커니즘(블라인드)도 없는 상태이다.

- `profiles.status`, `vendors.status`에 'banned' 상태는 존재하나 제재 프로세스와 연결되어 있지 않음 (근거: `app/doc/domains/admin/report-sanction/exploration.md:125-129`)
- 리뷰 신고만 존재하고 업체/사용자 신고 불가 (근거: `app/doc/domains/admin/report-sanction/exploration.md:117-119`)
- 관리자 신고 심사 UI 부재 (근거: `app/doc/domains/admin/report-sanction/exploration.md:38-40`)

## 2. 목표 (Goals)

1. **통합 신고 시스템** - 리뷰/업체/사용자 신고를 단일 `reports` 테이블로 통합하여 일관된 신고 처리 워크플로우 제공
2. **자동 블라인드** - 동일 대상에 대해 신고 5건 이상 누적 시 자동으로 콘텐츠 숨김 처리하여 사용자 보호
3. **3단계 제재 체계** - 경고 -> 일시정지(7일/30일) -> 영구정지의 단계적 제재로 공정한 운영 정책 수립
4. **제재 이력 관리** - `sanctions` 테이블로 모든 제재 이력을 기록하여 반복 위반자 식별 및 제재 근거 확보
5. **신고 심사 UI** - `/admin/reports` 페이지를 통해 관리자가 효율적으로 신고를 심사하고 제재를 부과

## 3. 비범위 (Non-Goals)

- 기존 `review_reports` 테이블 삭제/마이그레이션 (기존 데이터 보존, 신규 신고만 통합 테이블 사용)
- 신고자에게 처리 결과 알림 (후속 단계로 미룸)
- 이의제기/항소 기능 (후속 단계로 미룸)
- AI 기반 자동 스팸 탐지 (후속 단계로 미룸)

## 4. 주요 사용자 및 시나리오

| 사용자 | 시나리오 | 기대 결과 |
| ------ | -------- | --------- |
| 일반 사용자 | 부적절한 리뷰/업체/사용자를 신고 | 신고가 접수되고 관리자 심사 대기열에 추가됨 |
| 관리자 | 접수된 신고 목록 조회 및 필터링 | 신고 유형/상태별로 필터링하여 심사 대상 확인 |
| 관리자 | 신고 내용 검토 후 제재 결정 | 경고/일시정지/영구정지 중 선택하여 제재 부과 |
| 관리자 | 악의적 신고 기각 처리 | 신고를 기각하고 사유 기록 |
| 시스템 | 동일 대상 신고 5건 누적 감지 | 해당 콘텐츠(리뷰) 자동 블라인드 처리 |
| 관리자 | 특정 사용자의 제재 이력 확인 | 과거 경고/정지 이력을 조회하여 적절한 제재 수준 결정 |

## 5. 기능 요구사항

### 5.1 통합 신고 기능

- 신고 대상 유형: 리뷰(review), 업체(vendor), 사용자(profile)
- 신고 사유: spam(스팸), inappropriate(부적절), false_info(허위정보), privacy(개인정보침해), other(기타)
  - 근거: 기존 `ReviewReportReasonSchema` 재사용 (`app/src/lib/schema/review.ts:1`)
- 신고 상태 관리: pending(접수) -> reviewing(심사중) -> resolved(처리완료) / dismissed(기각)
- 동일 사용자가 동일 대상에 중복 신고 불가

### 5.2 자동 블라인드

- 동일 대상(리뷰)에 대해 신고 5건 이상 누적 시 자동으로 `reviews.status`를 'hidden'으로 변경
- 자동 블라인드 시 audit_logs에 `report.auto_blind` 이벤트 기록
- 업체/사용자는 자동 블라인드 대상에서 제외 (관리자 수동 제재만 가능)

### 5.3 3단계 제재 체계

- 제재 유형
  - warning: 경고 (제한 없음, 이력만 기록)
  - suspension: 일시정지 (7일 또는 30일 선택)
  - permanent_ban: 영구정지
- 제재 상태: active(활성) -> expired(만료) / revoked(해제)
- 일시정지 기간 종료 시 자동으로 상태 복원 (배치 또는 로그인 시 체크)
- 영구정지 시 해당 사용자/업체의 status를 'banned'로 변경

### 5.4 제재 이력 관리

- 모든 제재는 `sanctions` 테이블에 기록
- 제재 사유, 기간, 처리 관리자, 관련 신고 ID 저장
- 관리자가 신고 처리 시 해당 대상의 과거 제재 이력 조회 가능

### 5.5 UI 진입점 (상세 설계는 TSD)

- **경로**: `/admin/reports`
- **진입점**: 관리자 사이드바 네비게이션에 '신고 관리' 항목 추가
  - 근거: 기존 네비게이션 패턴 (`app/src/app/(main)/admin/layout.tsx:1`)
- **주요 화면**: 신고 목록 + 필터 + 상세 모달 + 제재 부과 모달
- **레퍼런스**: `/admin/verifications` 페이지 패턴 참조 (목록/필터/모달)

### 5.6 API / 데이터

- 필요한 API 엔드포인트:
  - `GET /api/admin/reports` - 신고 목록 조회 (필터: 유형, 상태, 검색어)
  - `GET /api/admin/reports/:id` - 신고 상세 조회
  - `POST /api/admin/reports/:id/review` - 신고 심사 시작 (상태: reviewing)
  - `POST /api/admin/reports/:id/resolve` - 신고 처리 완료 + 제재 부과
  - `POST /api/admin/reports/:id/dismiss` - 신고 기각
  - `GET /api/admin/sanctions` - 제재 목록 조회
  - `GET /api/admin/sanctions/target/:targetType/:targetId` - 특정 대상의 제재 이력 조회
  - `POST /api/admin/sanctions/:id/revoke` - 제재 해제
- 기존 신고 API 유지 (새 신고는 통합 reports 테이블 사용):
  - `POST /api/reviews/:id/report` - 리뷰 신고 (reports 테이블에 저장)
  - `POST /api/vendors/:id/report` - 업체 신고 (신규)
  - `POST /api/users/:id/report` - 사용자 신고 (신규)

### 5.7 권한/보안

- 모든 관리자 API는 `withRole(["admin"])` 가드 적용
  - 근거: 기존 관리자 API 패턴 (`app/src/server/auth/guards.ts:1`)
- RLS 정책:
  - `reports` 테이블: admin은 전체 접근, 일반 사용자는 본인 신고만 INSERT 가능
  - `sanctions` 테이블: admin만 전체 접근 가능
- 모든 제재 액션은 `audit_logs`에 기록
  - 근거: 기존 감사 로그 패턴 (`app/doc/domains/admin/report-sanction/exploration.md:121-123`)

## 6. 비기능 요구사항 (NFR)

- 성능/응답성:
  - (API) 신고 목록 조회 p95 응답 시간 목표: 500ms 이하
  - (목록 API) 페이지네이션: page, pageSize(기본 20, 최대 100), 정렬 키: created_at DESC
  - (프론트) 검색 트리거: 버튼/Enter submit (입력 즉시 검색 금지)
  - (데이터 규모 가정) 예상 신고 건수: 월 100~500건, 최대 연간 10,000건
- 안정성/복구:
  - 제재 부과 실패 시 트랜잭션 롤백 (신고 상태 변경 + 제재 생성 + 대상 상태 변경 원자성 보장)
  - 자동 블라인드 실패 시 로그 기록 후 관리자 수동 처리 유도
- 관측(로그/감사/지표):
  - 감사 로그 필수: report.resolve, report.dismiss, sanction.create, sanction.revoke, report.auto_blind
  - 장애 분석을 위한 로그 키: reportId, sanctionId, targetType, targetId, actorUserId

## 7. 엣지 케이스

- 동일 사용자가 동일 대상에 중복 신고 시도 -> 에러 반환 (409 Conflict)
- 이미 처리된(resolved/dismissed) 신고를 다시 처리 시도 -> 에러 반환 (400 Bad Request)
- 자동 블라인드 대상이 이미 숨김 상태인 경우 -> 상태 변경 스킵, 로그만 기록
- 영구정지된 사용자에게 추가 제재 부과 시도 -> 경고 표시 후 허용 (이력 기록 목적)
- 일시정지 중 추가 신고/제재 발생 -> 새 제재로 기간 갱신 (기존 제재는 revoked)
- 존재하지 않는 대상(삭제된 리뷰 등)에 대한 신고 -> 신고 접수 후 '대상 없음' 상태로 자동 종료

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
| ------ | ---- | ---- |
| 악의적 대량 신고 공격 | 정상 콘텐츠 자동 블라인드 | 자동 블라인드는 리뷰에만 적용, 업체/사용자는 수동 심사 필수 |
| 관리자 과실로 잘못된 영구정지 | 사용자 피해, 이의제기 불가 | 영구정지 시 확인 모달 2단계 적용, 해제(revoke) 기능 제공 |
| 제재 만료 처리 누락 | 일시정지 기간 종료 후에도 제한 유지 | 로그인 시 만료 체크 로직 추가, 관리자 대시보드에 만료 예정 목록 표시 |
| 기존 review_reports와의 데이터 불일치 | 신고 통계 오류 | 기존 테이블 유지하고 신규 신고만 reports 사용, 통계 시 양쪽 합산 |

## 9. 롤아웃 / 백로그

1. 1차 릴리스 범위
   - reports, sanctions 테이블 생성 및 RLS 정책
   - 관리자 신고 심사 UI (/admin/reports)
   - 리뷰 신고 API 통합 (기존 API는 유지하되 내부적으로 reports 테이블 사용)
   - 수동 제재 부과 기능 (경고/일시정지/영구정지)
   - 자동 블라인드 (신고 5건 이상)

2. 후속 백로그 항목
   - [ ] 업체/사용자 신고 UI (업체 상세, 프로필 페이지에 신고 버튼)
   - [ ] 신고자에게 처리 결과 알림 (이메일/푸시)
   - [ ] 일시정지 자동 만료 배치 처리
   - [ ] 관리자 대시보드에 신고/제재 통계 위젯
   - [ ] 이의제기/항소 기능

## 10. 오픈 이슈 / 결정 필요

- [ ] (선택) 자동 블라인드 임계치(5건) 조정 가능하게 할지 - 현재는 하드코딩 예정
- [ ] (선택) 제재 해제(revoke) 시 사유 필수 입력 여부 - 현재는 필수로 계획
- [ ] (선택) 기존 review_reports 데이터를 reports로 마이그레이션할지 - 현재는 미룸
