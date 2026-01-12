---
description: 프로젝트 컨텍스트 로드 및 현재 상태 파악
---

# Prime: 프로젝트 컨텍스트 로드

## 목표

코드베이스 구조, 문서, 핵심 파일을 분석하여 프로젝트에 대한 포괄적인 이해를 구축합니다.

## 프로세스

### 0. 생성 문서 갱신 (권장)

!`python3 .claude/scripts/refresh.py --apply`

### 1. 프로젝트 구조 분석

Git 추적 파일 확인:
!`git ls-files | head -100`

디렉토리 구조 확인:
!`find app/src -type d -name "node_modules" -prune -o -type d -print | head -50`

### 2. 핵심 문서 읽기

필수 문서:
- `CLAUDE.md` - 프로젝트 규칙 및 컨벤션
- `.claude/PRD.md` - 제품 요구사항
- `.claude/reference/_generated/project-facts.md` - 현재 레포 사실/스크립트/버전 (자동 생성)
- `app/doc/todo.md` - 현재 개발 진행 상황
- `app/doc/domains/*/prd.md` - 도메인별 요구사항

### 3. 핵심 파일 식별

프로젝트 설정:
- `app/package.json` - 의존성 및 스크립트
- `app/src/lib/database.types.ts` - DB 스키마 타입

주요 엔트리포인트:
- `app/src/app/layout.tsx` - 루트 레이아웃
- `app/src/app/(page)/` - 페이지 구조
- `app/src/app/api/` - API 라우트

### 4. 현재 상태 확인

최근 커밋:
!`git log -10 --oneline`

브랜치 및 상태:
!`git status`

## 출력 리포트

다음 항목을 포함한 요약 제공:

### 프로젝트 개요
- 애플리케이션 목적 및 유형
- 주요 기술 및 프레임워크
- 현재 버전/상태

### 아키텍처
- 전체 구조 및 조직
- 주요 아키텍처 패턴
- 중요 디렉토리 및 목적

### 기술 스택
- 언어 및 버전
- 프레임워크 및 주요 라이브러리
- 빌드 도구 및 패키지 매니저

### 현재 개발 상태
- 활성 브랜치
- 최근 개발 집중 영역
- `app/doc/todo.md` 기준 진행률

### 즉시 확인 필요 사항
- 미완료 기능 또는 알려진 이슈
- 다음 우선순위 작업

**스캔하기 쉽게 - 글머리 기호와 명확한 헤더 사용**
