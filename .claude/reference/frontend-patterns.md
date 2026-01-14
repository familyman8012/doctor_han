# Frontend 패턴 (React Query / Form / UI)

이 문서는 Medihub 프론트엔드의 “규칙(Policy)”과 구현 패턴을 정리합니다.

## 0) 핵심 원칙

1. **데이터 통신은 BFF + Axios**: 클라이언트는 `/api/**`(BFF)만 호출합니다.
2. **React Query는 컴포넌트에서 직접 사용**: 커스텀 훅 래핑 금지.
3. **에러 처리는 중앙화**: `onError`를 각 쿼리/뮤테이션에 달지 않습니다.

## 1) React Query 패턴

### (A) 쿼리

- `useQuery`는 컴포넌트에서 직접 선언합니다.
- `queryKey`는 “도메인 + 파라미터”로 안정적으로 구성합니다.

예시(요약):

```ts
const { data, isLoading } = useQuery({
  queryKey: ["vendors", filter],
  queryFn: async () => {
    const res = await api.get("/api/vendors", { params: filter });
    return res.data.data;
  },
});
```

### (B) 뮤테이션

- 성공 시 invalidate로 갱신합니다.
- `onError`는 달지 않습니다(중앙 에러 핸들러에서 처리).

```ts
const mutation = useMutation({
  mutationFn: (payload) => api.post("/api/vendors/me", payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
});
```

### (C) 중앙 에러 처리

프로젝트는 QueryCache/MutationCache 레벨에서 에러를 처리합니다.

- 파일: `app/src/app/providers.tsx`
- 연계: `app/src/api-client/error-handler` (Axios interceptor 포함)

결론: 각 `useQuery/useMutation`에 `onError`를 추가하지 않습니다.

## 2) Axios / API Client

- 권장: `app/src/api-client/client`(프로젝트 설정에 맞는 Axios 인스턴스)
- 응답 파싱 시 `data.data`(표준 응답 포맷)를 전제로 합니다.

## 3) 폼(React Hook Form + Zod)

### (A) 원칙

- UI는 `react-hook-form`을 사용합니다.
- 입력 검증 스키마는 `app/src/lib/schema/*.ts`의 Zod 스키마를 재사용합니다(가능하면 DRY).

### (B) 금지 패턴

- “필드 메타 배열”로 폼을 구성하는 방식(가독성/타입 안정성 저하) 금지.
- 서버 액션 기반 submit 금지.

## 4) 파일/페이지 구조

페이지는 “한 폴더에 응집”시키고, 필요한 경우에만 분리합니다.

예:

```
app/src/app/(page)/vendors/
├── page.tsx
├── component/
│   ├── VendorCard.tsx
│   └── modal/
│       └── ContactModal.tsx
├── utils.ts
└── constants.ts
```

