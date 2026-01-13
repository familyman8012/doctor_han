---
description: 계획 실행
---

# Execute - 계획 실행

## 목적

수립된 계획을 단계별로 실행합니다. 이 명령은 PIV (Prime-Implement-Validate) 루프의 세 번째 단계입니다.

## 사용법

```
/execute [plan-file]
```

예시:
- `/execute .agents/plans/vendor__favorites.md`
- `/execute vendor__favorites` (`.agents/plans/` 자동 추가)

## 선행 조건

- `/plan-feature` 명령으로 계획 파일 생성 완료
- 계획 파일 검토 및 승인

## 실행 프로세스

### 1. 계획 파일 로드

```
.agents/plans/[feature-name].md
```

### 2. Context References 확인

계획 파일의 "Context References" 섹션에 명시된 파일들을 읽습니다:
- 참조 패턴 파일
- 관련 기존 구현
- 의존성 파일

### 3. 순차적 태스크 실행

계획 파일의 "Step-by-Step Tasks" 섹션을 **위에서 아래로** 순차 실행합니다.

각 태스크마다:
1. **태스크 파악**: ACTION/FILE/PATTERN/VALIDATE 확인
2. **구현**: 계획에 있는 변경만 수행(계획 외 “개선” 금지)
3. **검증**: VALIDATE 명령 실행, 실패 시 즉시 수정 후 재검증
4. **기록(권장)**: `Progress Log (append-only)`에 3~6줄로 누적 기록

### 4. 최종 검증

모든 태스크 완료 후:

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## 핵심 규칙

- **순서 엄수**: 태스크를 건너뛰거나 순서를 변경하지 않습니다.
- **즉시 검증**: 각 태스크 완료 후 즉시 VALIDATE를 실행합니다.
- **패턴 준수**: 계획에 명시된 패턴/참조 파일을 따릅니다.
- **계획 외 변경 금지**: 필요한 변경이 생기면 plan부터 갱신합니다.
- 스펙이 비어 있거나(PRD/TSD DoR FAIL), 구현과 충돌하면 **구현을 중단**하고 스펙부터 보강합니다.

