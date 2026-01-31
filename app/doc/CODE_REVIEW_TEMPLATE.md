# PR 코드 리뷰 가이드

PR 리뷰 시 일관된 양식으로 코멘트를 작성하기 위한 가이드입니다.

---

## 심각도 분류

| 이모지 | 레벨 | 의미 | 조치 |
|--------|------|------|------|
| 🔴 | Critical | 버그, 컴파일 에러, 데이터 불일치 | **머지 차단** |
| 🟡 | Important | 코드 품질, DRY 위반, 타입 안전성 | 권장 수정 |
| 🟢 | Suggestions | 리팩토링, 성능 개선, 컴포넌트 분리 | 선택 |
| ✅ | Positive | 잘 된 점 | 칭찬 |

---

## 리뷰 코멘트 템플릿

```markdown
# PR #[번호] 코드 리뷰

## 🔴 Critical (머지 차단)

### 1. [이슈 제목]

**파일:** `파일명.tsx:라인번호`

[문제 설명]

**현재 코드:**
```typescript
// 문제가 되는 코드
```

**수정 방법:**
```diff
- 삭제할 코드
+ 추가할 코드
```

---

## 🟡 Important (권장 수정)

### 2. [이슈 제목]

**파일:** `파일명.tsx:라인번호`

[문제 설명]

**권장:** [간단한 수정 방향]

---

## 🟢 Suggestions (개선 제안)

### 3. [이슈 제목]

[개선 제안 내용]

---

## ✅ Positive (잘 된 점)

1. [칭찬할 점 1]
2. [칭찬할 점 2]

---

## 📋 요약

| 구분 | 개수 | 조치 |
|------|------|------|
| Critical | N | **필수 수정** |
| Important | N | 권장 수정 |
| Suggestions | N | 선택 |

[머지 가능 여부 및 조건]
```

---

## 이슈 작성 규칙

1. **파일:라인번호** 반드시 명시
2. **현재 코드** 블록으로 문제 상황 제시
3. **수정 방법** diff 형식 또는 코드 블록으로 제시
4. 복잡한 수정은 `<details>` 태그로 접기

---

## 피드백 리뷰 템플릿 (수정 후 재리뷰)

```markdown
## PR 피드백 적용 리뷰 결과 ([커밋해시])

### ✅ 잘 수정된 부분

#### 1. [수정된 항목]
- [변경 내용 설명]

---

**결론**: [머지 가능 여부]
```

---

## 예시

### Critical 이슈 예시

```markdown
### 1. Promise.all 부분 실패 처리 미흡

**파일:** `ShipmentLineEditModal.tsx:104-120`

`Promise.all`은 첫 번째 실패에서 즉시 reject되어, 성공분이 있어도 `onSuccess`가 실행되지 않습니다.
DB는 부분 수정 상태인데 UI는 전체 실패로 표시되어 데이터 불일치가 발생합니다.

**현재 코드:**
```typescript
const updatePromises = selectedLineIds.map((lineId) =>
    fulfillmentOrderLineApi.update(orderId, lineId, fieldsToUpdate),
);
return Promise.all(updatePromises);
```

**수정 방법:**
```typescript
const results = await Promise.allSettled(updatePromises);
const succeeded = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

if (failed.length > 0) {
    toast.error(`${succeeded.length}개 성공, ${failed.length}개 실패`);
} else {
    toast.success(`${succeeded.length}개 수정 완료`);
}
```
```

### Important 이슈 예시

```markdown
### 2. console.log 잔존

**파일:** `ShipmentLineEditModal.tsx:295, 300, 334`

프로덕션 코드에 디버그용 로그가 남아있습니다.

**권장:** 해당 라인 삭제
```
