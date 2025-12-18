## 신규 프로젝트 개발 방법 초안.

## 기술 스택

### Core
- **Framework**: Next.js (App Router)
- **Database**: Supabase (Postgres)
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS

### 상태 관리 & 데이터 페칭
- **서버 상태**: React Query (TanStack Query)
- **전역 상태**: Zustand
- **HTTP Client**: Axios
- **폼 관리**: React Hook Form
- **URL 상태**: nuqs (목록 페이지 필터 등)

### UI/UX
- **Toast**: Sonner
그외, `date-fns`, `dayjs`(날짜관련은 dayjs로), `framer-motion` 등 필요한 라이브러리 사용.
폴더 구조는 `app/doc/Folder Structure.md`를 참고하되, 이번 프로젝트에 맞게 적용.

참고: `ncos-prototype/web/src/app/api/order-products` 구현 방식을 참고해 비슷한 양식으로 구현.

1. **요구사항 정리**: `app/doc/domains/<domain>/<slug>/prd.md`에서 목표·제약을 명확히 한다.
2. **데이터 모델링**: (Supabase) 변경이 필요한 테이블/뷰/인덱스/RLS 정책을 정의하고 마이그레이션을 설계한다.
3. **마이그레이션 작성**: `pnpm db:new -- "<name>"`으로 파일을 만들고, `app/supabase/migrations`에 SQL 마이그레이션을 작성한다.
4. **마이그레이션 적용**:
   - 로컬: `pnpm db:start` → `pnpm db:reset`
   - 원격: `pnpm exec supabase link` → `pnpm db:migrate` (내부적으로 `supabase db push`)
5. **타입 갱신**:
   - 로컬: `pnpm db:gen -- --local`
   - 원격: `SUPABASE_PROJECT_ID` 설정 후 `pnpm db:gen` → `src/lib/database.types.ts`
6. **API DTO/검증 정의**: `src/lib/schema`에 Zod 기반 DTO/Contract를 작성한다.
7. **Adapter/Service 구현(선택)**: `src/server/adapter`, `src/server/services`에서 DB ↔ DTO 변환, 트랜잭션, 외부 연동을 처리한다.
8. **HTTP 라우트 구성**: `src/app/api/**/route.ts`에서 BFF 패턴으로 권한 체크, 입력 검증, 에러 포맷을 적용한다.

## Schema & Contract Guidelines
- **Zod DTO 작성 규칙**
  - 요청/응답 DTO는 Zod로 정의하고 `src/lib/schema`에 둔다.
  - 공통 스키마는 export해 재사용하고, 중복 선언은 지양한다.
- **Supabase 스키마 타입**
  - DB 스키마 타입은 `src/lib/database.types.ts`(자동 생성)만 사용하며 직접 수정하지 않는다.
  - 스키마 변경 후 `pnpm db:gen`으로 타입을 갱신한다.
- **데이터 접근 원칙 (Supabase)**
  - **원칙**: 브라우저에서 Supabase(DB) 직접 호출 금지. 모든 데이터 통신은 `src/app/api/**/route.ts`(BFF) + React Query로 처리한다.
  - **예외**: Auth(`supabase.auth.*`)는 허용. Storage는 서버가 Signed URL을 발급하고 클라이언트는 업로드/다운로드만 수행한다.
  - `service_role` 키는 서버 전용이며 클라이언트에 노출하지 않는다.
- **DB Scripts (Supabase CLI 래퍼)**
  - `pnpm db:start`: 로컬 Supabase 시작(도커 필요)
  - `pnpm db:status`: 로컬 URL/키 확인
  - `pnpm db:stop`: 로컬 Supabase 중지
  - `pnpm db:new -- "<name>"`: 마이그레이션 파일 생성
  - `pnpm db:migrate`: 마이그레이션 적용(= `supabase db push`)
  - `pnpm db:reset`: 로컬 DB 초기화(주의: 데이터 삭제)
  - `pnpm db:gen`: 타입 생성(로컬: `-- --local`, 원격: `SUPABASE_PROJECT_ID`, 옵션: `SUPABASE_SCHEMA`)


# 프론트엔드 에러 중앙화 정책 TODO (RMS)

## 목적
- `useQuery`/`useMutation` 등에서 단순 토스트 에러 노출을 공통화하여 중복 `onError` 파편화를 제거한다.
- 커스텀 UI나 추가 액션이 필요한 예외 케이스는 개별 `onError`로 남기되, 명시적으로 목록화한다.
- 백엔드 서비스 레이어가 도메인 메시지/코드를 내려주고, 프론트 전역 핸들러가 그대로 토스트를 띄우는 것을 기본 정책으로 삼는다. 프론트 매핑은 보강책에 한정한다.

## 작업 원칙
- 단순 토스트: 중앙 에러 핸들러(`src/api-client/error-handler.ts`/`client.ts`)에서 처리하도록 래퍼(예: `withToastError` 등)를 우선 적용한다.
- 커스텀 처리: 추가 UI/로깅/리트라이 제어가 필요한 경우에만 개별 `onError`를 유지한다. 이유를 주석으로 남긴다.
- 실패는 가시화: 토스트 메시지 규칙(문구, 지속시간, i18n 여부)과 로깅 방식을 명시한다.
- DRY: 동일 패턴의 `onError`를 발견하면 즉시 공통화 대상으로 등록하고 제거한다.
- 메시지 소스 일원화: 사용자 친화 메시지는 백엔드 서비스 레이어에서 도메인 예외(`ValidationError`/`BusinessError`)로 내려보내고, 프론트 전역 핸들러가 그대로 토스트로 사용한다. 프론트 매핑 파일은 백엔드 수정이 어려울 때의 보강책으로만 사용한다.

- api client 는 /Users/julian/workspace/doctor_han/app/src/api-client 에 제작.

- UI 는 /Users/julian/workspace/doctor_han/app/src/app/(page) 쪽에 UI 를 구현하려고 하는데,
- 이 프로젝트내에서 모듈화,   관심사 분리, 코드정리등을 하면서  제작되었으면 좋겠어. 
- 컴포넌트는 해당 폴더내에 component 폴더를 만들어서 그 폴더 안에 만들어주고,
- Modal 은 따로,해당 폴더의 component 폴더 안에 modal 폴더를 만들어서 거기에다 모아줬으면 좋겠고.
- util 이나, 상수는 component 폴더가 아니라, 따로 해당폴더의 component 레벨로util 폴더나 constant폴더를 만들어서 거기에 넣어주되,
- util 파일 및 상수파일은, 여러개 만들지 말고, 하나의 파일 안에, 주석으로 구분할 수 있게끔만 구분해서, util, constant 파일을 여러개 만들지 않았으면 좋겠어. (각 1개씩의 파일에 모아줘)  각 utils.ts 랑 constants.ts 라는 네이밍으로 파일을 만들어서 util과 constant 는 거기에 모아줘.
- 개인적으로는 코드가 지나치게 추상화되  거나 (물론 필요에의해, custom hook 이나 util파일로 뺀다거나, 다른 컴포넌트로 뺀다거나 할 수 있지), 장황한걸 싫어하고, 간결한 표현과 es6 을 잘활용했으면 좋겠어.
- 간결한 표현이란 예를 들어, data.todo.map 이렇게 표현할 수 있는 걸 굳이  const todo = data.todo; todo.map 이런식으로 분리해서 표현하는 걸 싫어한다는 의미야. 다만, 지나치게 복잡해질 것 같으면 이렇게 하긴 해야겠지. (체이닝을 예로 들자면, 체이닝을 왠만한 경우는 직접하되, 복잡함이 많이 증대될때만 const todo = data.todo;  이런식으로 상수빼서 하는거지. 그외에도 1줄로 표현할 수 있는걸 2~3줄로 표현하려고 하지 마.)
- 현재 에러는 중앙화를 하고 있으니, useQuery나 useMutation 시, onError 부분은 작성하지 말고 진행해줘.
- 하나의 파일이 길기보다는, 필요하다면 파일을 생성해서 파일 분리를 하는 걸 선호해.  그리고 파일명은 너무 길지 않게 했으면 좋겠어.  파일명은, SalesOrderClaimCreateModal.tsx 이렇게보다는, ClaimCreateModal.tsx  이런식으로 파일명을 선호해.
- css의 작성순서는 다음을 따른다.
1. 시각적/레이아웃
overflow, visibility, display, position, top/right/bottom/left, flex,flex와 연관된 속성들 
2. 박스 모델 width, height, margin,padding
3. 폰트 및 텍스트
font, text-align, vertical-align, letter-spacing, word-spacing, word-break, word-wrap
white-space, text-indent, text-decoration, text-transform, text-overflow, text-shadow, color
4. 사용자 인터페이스
outline, cursor, opacity
5. 위에서 언급되지 않은 그밖의 속성들
border, box-shadow, background
- 현재 우리의 시스템은
    - /Users/julian/workspace/doctor_han/app/src/components/ui 에  Badge, Button, ButtonGroup, Checkbox, Empty(Empty시 나타나는 표시), ErrorText, InfoBox, Input, InputNumber(<input type=”number” 은 사용하지 말고 이걸 대신 사용), NumericInput, PlainElements (일반 input 등 폼요소에 대한 css 표현), Radio, Select, Skeleton, Spinner, Tab, Toggle, Tooltip 이 있어서, 기본적인 ui 제작시 이러한 컴포넌트들을 적극 활용해주었으면 좋겠고, (특정 페이지에서 특정하게 필요한 컴포넌트는 제외) (agent-ncos 폴더는 현재 우리의 디자인시스템과는 다르기때문에 사용을 자제하도록해)
    - /Users/julian/workspace/doctor_han/app/src/components/widgets 에는 주소입력폼을 정리한 AddressForm, CheckBoxGroup, CountrySelector, DatePicker, DateRange, DateTimePicker, ImageUploader, ListTable, Pagination, RadioGroup, TanstackTable (목록테이블시사용), Upload (파일업로드), UploadBlock (파일업로드를 컴포넌트화 해서 여러 페이지에서 사용중) 으로 기능성 컴포넌트가 있으니, 이것들도 참고해.
- React-hook-form 의 경우는,

```
const sections: HeaderSection[] = [
		{
			key: "order",
			title: orderSectionTitle,
			content: (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					{creatorInfo && (
						<div className="group">
							<UserSelect
								label="생성자"
								value={creatorInfo.userId}
								valueType="userId"
								disabled
								placeholder={
									creatorInfo.name ?? creatorInfo.email ?? "생성자 정보 없음"
								}
								showCurrentUserFirst={false}
								filterDeleted={false}
							/>
							{!creatorInfo.name && creatorInfo.email && (
								<p className="mt-1 text-xs text-[#5f6b6d]">
									{creatorInfo.email}
								</p>
							)}
						</div>
					)}
				</div>)
			... }
			
			같은 객체배열형식의 meta 적인 표현 방식보다, 
```

```
import { useForm } from "react-hook-form";

export default function SimpleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("name", { required: "이름을 입력해주세요." })}
        placeholder="이름"
      />
      {errors.name && <p>{errors.name.message}</p>}
       <Controller
        name="name"
        control={control}
        rules={{ required: "이름을 입력해주세요." }}
        render={({ field }) => (
          <input {...field} placeholder="이름" />
        )}
      />
			 {errors.name && <p>{errors.name.message}</p>}
      <input
        {...register("email", {
          required: "이메일을 입력해주세요.",
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "올바른 이메일 형식이 아닙니다."
          }
        })}
        placeholder="이메일"
      />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit">전송</button>
    </form>
  );
}
```

처럼, jsx 내에 자연스럽게 register 와 Controller 를 사용하는 방식으로 작성해줘. 

- 날짜 관련해서는, dayjs 를 이용해.
- lodash 가 설치되어있으니,  복잡한 **데이터 가공/변형**할 때

입력/스크롤 같은 이벤트를 **debounce/throttle**로 최적화할 때, **깊은 비교나 깊은 복사**가 필요할 때 등 

**JS 내장 기능 + React 자체 도구** “이건 너무 지저분한데?” 싶을 때 사용해줘.

---

```markdown

## 개발 규칙

### 1. Server Action 사용 금지
- Next.js App Router의 Server Action, Form Action 사용하지 않음
- 모든 데이터 통신은 API Route + React Query로 처리

### 2. React Query 사용 패턴

#### ❌ 하지 말 것: Custom Hook으로 감싸기
```typescript
// hooks/useTodos.ts - 이렇게 하지 말 것
export const useTodos = () => {
  return useQuery({
    queryKey: ["todos"],
    queryFn: todosApi.getAll,
  });
};

// 컴포넌트
const { data } = useTodos();
```

#### ✅ 할 것: 컴포넌트에서 직접 사용
```typescript
// 컴포넌트에서 직접 사용
export function TodoList() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Query Key도 사용처에서 직접 정의
  const { data, isLoading } = useQuery({
    queryKey: ['todos', filter], // 직접 정의, 간단명료
    queryFn: () => todosApi.getAll({ status: filter }),
  });

  // Mutation도 직접 사용
  const createMutation = useMutation({
    mutationFn: todosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['todos'] // 관련 쿼리 무효화
      });
    }
  });

  return (
    // UI 구현...
  );
}
```

### 3. 낙관적 업데이트(Optimistic Update) 사용 원칙

**문제점:**
1. 롤백 복잡도 증가 - 실패 시 원상복구 로직이 복잡해짐
2. 데이터 불일치 - 클라이언트: "성공!" → 서버: "실패!" → 사용자: "???"
3. 디버깅 어려움 - 실제 데이터인지 낙관적 데이터인지 구분 어려움

**원칙:** 정말 효과적일 때만 사용 (좋아요, 북마크 등 간단한 토글)

### 4. URL 상태 관리 (nuqs)
- 목록 페이지의 필터, 정렬, 페이지네이션 등은 `useState` 대신 `nuqs` 사용
- URL에 상태를 저장하여 공유 가능한 링크 생성

---

## UI 개발시 컴포넌트 및 스타일 가이드 

DESIGN.md 문서를 확인해서 진행.

```
