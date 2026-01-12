# `.agents/` (Plans & Reviews)

이 폴더는 “대화 컨텍스트”를 파일로 외부화하여, 긴 작업에서도 에이전트 성능 저하(컨텍스트 오염)를 줄이기 위한 저장소입니다.

## Folders

- `.agents/plans/`: 기능별 구현 계획서(Plan Mode 산출물)
- `.agents/code-reviews/`: 코드 리뷰 결과(선택)

## Recommended Loop

1. `/prime`로 프로젝트 컨텍스트 로드
2. `/plan-feature <feature>`로 `.agents/plans/<feature>.md` 생성/갱신
3. (컨텍스트 리셋) 새 세션에서 `/execute <plan>`로 구현
4. `/validate` → `/commit`

