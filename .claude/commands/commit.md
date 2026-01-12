---
description: "Git 커밋 생성"
---

# Commit: Git 커밋 생성

## 목표

변경 사항을 검토하고 의미 있는 커밋 메시지와 함께 커밋합니다.

## 프로세스

### 1. 변경 사항 확인

```bash
# 상태 확인
git status

# 변경 내용 확인
git diff

# 스테이징된 변경 확인
git diff --cached
```

### 2. 최근 커밋 스타일 확인

```bash
git log -5 --oneline
```

### 3. 검증 실행

커밋 전 필수 검증:
```bash
cd app
pnpm type-check
pnpm lint
pnpm test
```

### 4. 커밋 메시지 작성

**형식:**
```
<타입>(<범위>): <제목>

<본문 - 선택>
```

**타입:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 포맷팅, 세미콜론 등
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**범위 예시:**
- `auth`, `vendor`, `lead`, `review`, `admin`
- `api`, `ui`, `db`

**예시:**
```
feat(vendor): 업체 검색 필터 기능 추가

- 카테고리별 필터링
- 지역별 필터링
- nuqs를 사용한 URL 상태 관리
```

### 5. 커밋 실행

```bash
# 파일 스테이징
git add <files>

# 커밋
git commit -m "커밋 메시지"
```

## 커밋 규칙

### 커밋 단위
- 하나의 논리적 변경 = 하나의 커밋
- 관련 없는 변경은 분리
- 작동하는 상태로 커밋

### 금지 사항
- 깨진 코드 커밋
- 민감 정보 포함 (.env, 비밀번호 등)
- node_modules, .next 등 빌드 산출물
- 의미 없는 메시지 ("fix", "update" 등)

### 커밋 메시지 언어
- 한글 또는 영어 일관되게 사용
- 프로젝트 기존 스타일 따르기

## 완료 확인

```bash
# 커밋 확인
git log -1

# 변경 사항 확인
git show HEAD --stat
```
