# 소셜 로그인(카카오/구글) 프론트엔드 구현 계획

## 구현 범위

- [x] Supabase Auth Provider 설정 완료 (카카오/구글)
- [ ] 로그인/가입 화면에 소셜 버튼 추가
- [ ] OAuth 콜백 라우트 구현
- [ ] 마이페이지 소셜 계정 연결 UI
- [ ] 최초 로그인 온보딩 플로우

---

## 파일 구조

### 신규 생성
```
src/
├── lib/constants/oauth.ts              # OAuth 상수 (provider 정보)
├── components/auth/SocialLoginButtons.tsx  # 소셜 로그인 버튼 컴포넌트
├── app/auth/callback/route.ts          # OAuth 콜백 핸들러
├── app/(auth)/onboarding/page.tsx      # 소셜 로그인 후 온보딩
├── app/(main)/mypage/settings/page.tsx # 계정 설정 (소셜 연결)
└── hooks/useSocialAccounts.ts          # 소셜 계정 관리 훅
```

### 수정
```
src/
├── app/(auth)/login/page.tsx           # 소셜 버튼 추가
├── app/(auth)/signup/page.tsx          # 소셜 버튼 추가
└── app/(main)/mypage/layout.tsx        # "계정 설정" 네비게이션 추가
```

---

## Phase 1: 소셜 로그인 버튼 (기초)

### 1.1 상수 정의 (`/src/lib/constants/oauth.ts`)
```typescript
export const SOCIAL_PROVIDERS = [
  { id: "kakao", name: "카카오", bgColor: "bg-[#FEE500]", textColor: "text-[#191919]" },
  { id: "google", name: "Google", bgColor: "bg-white", textColor: "text-gray-700", border: true },
] as const;
```

### 1.2 버튼 컴포넌트 (`/src/components/auth/SocialLoginButtons.tsx`)
- Props: `mode: "login" | "signup" | "link"`, `returnUrl?: string`
- 로그인/가입: `supabase.auth.signInWithOAuth()`
- 계정 연결: `supabase.auth.linkIdentity()`

### 1.3 로그인/가입 페이지 수정
- **소셜 버튼을 폼 위에 배치** (소셜 먼저 → "또는" 구분선 → 이메일 폼)
- 트렌드: 소셜 로그인 유도에 효과적

---

## Phase 2: OAuth 콜백 (`/src/app/auth/callback/route.ts`)

### 처리 플로우
```
1. code 파라미터 수신
2. exchangeCodeForSession(code)
3. mode=link이면 → returnUrl로 바로 리다이렉트
4. 프로필 존재 여부 확인
   - 없으면 → /onboarding
   - 있으면 → returnUrl (기본 "/")
```

### 에러 처리
- OAuth 취소/실패 → `/login?error=...`
- code 없음 → `/login?error=no_code`

---

## Phase 3: 온보딩 (`/src/app/(auth)/onboarding/page.tsx`)

### UI
```
┌─────────────────────────────────────┐
│  메디허브에 오신 것을 환영합니다      │
│                                     │
│  회원 유형을 선택해주세요            │
│  [한의사]        [업체]             │
│                                     │
│  닉네임: [________________]         │
│                                     │
│  [시작하기]                         │
└─────────────────────────────────────┘
```

### 동작
- 기존 signup 페이지의 RoleCard 재사용
- POST /api/profile 호출 → 역할별 인증 페이지 이동

---

## Phase 4: 계정 설정 (`/src/app/(main)/mypage/settings/page.tsx`)

### UI
```
소셜 계정 연결

┌─────────────────────────────────────┐
│ [카카오]  연결됨: user@kakao.com    │
│                        [연결 해제]  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [Google]  연결되지 않음             │
│                        [연결하기]   │
└─────────────────────────────────────┘
```

### 기능
- `supabase.auth.getUserIdentities()` - 연결 상태 조회
- `supabase.auth.linkIdentity()` - 계정 연결
- ~~`supabase.auth.unlinkIdentity()`~~ - **P2+로 이관** (락아웃 방지 정책 필요)

### 마이페이지 네비게이션 추가
```typescript
{ href: "/mypage/settings", label: "계정 설정", icon: Settings }
```

---

## 구현 순서

| 순서 | 작업 | 예상 |
|------|------|------|
| 1 | oauth.ts 상수 + SocialLoginButtons 컴포넌트 | 30분 |
| 2 | 로그인/가입 페이지에 버튼 추가 | 20분 |
| 3 | /auth/callback 라우트 구현 | 30분 |
| 4 | /onboarding 페이지 구현 | 40분 |
| 5 | useSocialAccounts 훅 + settings 페이지 | 40분 |
| 6 | 마이페이지 레이아웃 수정 | 10분 |
| 7 | 테스트 및 에러 처리 | 30분 |

---

## 참조 파일

- `/src/app/(auth)/login/page.tsx` - 로그인 폼 패턴
- `/src/app/(auth)/signup/page.tsx` - RoleCard, 프로필 생성
- `/src/server/supabase/browser.ts` - Supabase 클라이언트
- `/src/app/(main)/mypage/layout.tsx` - NAV_ITEMS 구조
