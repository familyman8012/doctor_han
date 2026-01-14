# `.agents/` (Plans)

이 폴더는 “대화 컨텍스트”를 파일로 외부화하여, 긴 작업에서도 컨텍스트 오염을 줄이기 위한 저장소입니다.

## Folders

- `.agents/plans/`: 기능별 구현 계획서(Plan Mode 산출물)
- `.agents/plans/templates/`: 계획 템플릿

## Recommended Loop

1. `/refresh`로 생성 문서 갱신(권장)
2. `/prime <domain/feature>`로 프로젝트 컨텍스트 로드
   - 도메인 PRD: `app/doc/domains/**/prd.md`
   - 코드: `app/src/**`
   - `pnpm` 커맨드: `cd app`에서 실행
3. (필수) PRD DoR 통과(없거나 미완성이면 `/new-prd`, `@spec-writer`)
4. `/plan-feature <domain/feature>`로 `.agents/plans/<domain>__<feature>.md` 생성/갱신
5. (컨텍스트 리셋) 새 세션에서 `/execute <plan>`로 구현
6. `/validate` → `/code-review` → commit
