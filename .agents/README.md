# `.agents/` (Plans & Reviews)

이 폴더는 “대화 컨텍스트”를 파일로 외부화하여, 긴 작업에서도 에이전트 성능 저하(컨텍스트 오염)를 줄이기 위한 저장소입니다.

## Folders

- `.agents/plans/`: 기능별 구현 계획서(Plan Mode 산출물)
- `.agents/plans/templates/`: 계획 템플릿(Feature/Bugfix)
- `.agents/code-reviews/`: 코드 리뷰 결과(선택)

## Recommended Loop

1. `/refresh`로 생성 문서 갱신(권장)
2. `/prime <domain/feature>`로 프로젝트 컨텍스트 로드
3. (필수) PRD/TSD DoR 통과(없거나 미완성이면 `/new-prd`, `/new-tsd`, `@spec-writer`)
4. `/plan-feature <domain/feature>`로 `.agents/plans/<domain>__<feature>.md` 생성/갱신
5. (컨텍스트 리셋) 새 세션에서 `/execute <plan>`로 구현
6. `/validate` → `/code-review` → `/commit`
