---
description: Git 커밋 생성
---

# Commit - Git 커밋 생성

## 목표

변경 사항을 검토하고 의미 있는 커밋 메시지와 함께 커밋합니다.

## 프로세스

### 1. 변경 사항 확인

```bash
git status
git diff
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
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

### 4. 커밋 메시지 작성

형식:
```
<type>(<scope>): <subject>
```

예시:
```
feat(vendor): 즐겨찾기 토글 API 추가
```

### 5. 커밋 실행

```bash
git add <files>
git commit -m "feat(scope): message"
```

