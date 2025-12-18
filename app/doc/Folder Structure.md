# Folder Structure

소유자: Julian Yoon

전체 디렉토리 구조

```jsx
backoffice-project/
├── src/                      # 소스 코드를 모아두는 폴더 (선택 사항)
│   ├── app/                  # Next.js 페이지, 레이아웃, API 라우트
│   │   ├── layout.tsx        # 앱 전체에 적용되는 루트 레이아웃
│   │   ├── page.tsx          # 선택 사항: 앱 루트 페이지 (예: 홈 또는 리디렉트)
│   │   ├── (auth)/           # (라우트 그룹) 인증 관련 페이지 모음 – URL 경로에 나타나지 않음
│   │   │   ├── layout.tsx    # 인증 페이지 전용 레이아웃 (예: 최소한의 레이아웃)
│   │   │   ├── login/        
│   │   │   │   └── page.tsx  # '/login' 페이지 컴포넌트
│   │   │   └── register/
│   │   │       └── page.tsx  # '/register' 페이지 컴포넌트
│   │   ├── admin/        # 대시보드 메인 섹션 (로그인 후 접근하는 내부 페이지들)
│   │   │   ├── layout.tsx    # 대시보드 내 공통 레이아웃 (예: 사이드바, 상단바 포함)
│   │   │   ├── page.tsx      # '/dashboard' 메인 페이지 (예: 요약 화면)
│   │   │   ├── agents/        # '/dashboard/users' 사용자 관리 섹션
│   │   │   │   ├── page.tsx  # 사용자 목록 페이지
│   │   │   │   └── actions.ts # 유저 목록/생성 등 이 라우트 한정 액션
│   │   │   │   └── [id]/     # 동적 경로: '/dashboard/users/사용자ID'
│   │   │   │       └── page.tsx  # 특정 사용자 상세/편집 페이지
│   │   │   ├── groups/     
│   │   │   │   └── page.tsx  # '/dashboard/settings' 설정 페이지
│   │   │   │   └── actions.ts # 설정 페이지 액션
│   │   │   └── ... 기타 필요한 섹션 ...
│   │   └── api/              # 백엔드 API 라우트 (App Router 기반 API 엔드포인트)
│   │       ├── auth/
│   │       │   └── route.ts  # 예시: '/api/auth' 로그인 관련 API 엔드포인트
│   │       └── agents/
│   │           └── route.ts  # 예시: '/api/users' 사용자 API 엔드포인트
│   ├── components/           # 재사용 가능한 UI 컴포넌트 모음
│   │   ├── ui/               # 기본 UI 구성 요소 (버튼, 인풋 등) - Button, Input, Select, Card, Modal, Skeleton
│   │   │   ├── chart/        # 차트 컴포넌트
│   │   │   ├── modal/        # 모달 컴포넌트
│   │   │   ├── Input.tsx     # 예시: 공용 인풋 컴포넌트
│   │   ├── layout/           # 레이아웃 컴포넌트 (헤더, 푸터, 사이드바 등)  
│   │   │   ├── menu-config/       # 메뉴설정              
│   │   │   ├── Navbar.tsx    # 상단 네비게이션 바 컴포넌트
│   │   │   └── Sidebar.tsx   # 사이드바 컴포넌트
│   │   ├── widgets/           # 여러 페이지에서 쓰이는 공통 컴포넌트 - DataTable, DatePicker, Editor, SearchBar, FilterPanel, AddressSearch 등
│   │   │   └── DataTable.tsx # 예시: 표(table) 컴포넌트
│   │   └── features/         # 특정 도메인(기능) 관련 컴포넌트
│   │       └── dashboard/    # 대시보드 관련 컴포넌트
│   │           └── users/    # 사용자 관련 컴포넌트
│   │               ├── UserForm.tsx
│   │               └── UserCard.tsx
│   │           └── settings/ # 설정 관련 컴포넌트
│   │               ├── SettingForm.tsx
│   │               └── SettingCard.tsx
│   ├── server/                # 서버 전용 레이어 (클라이언트 번들 제외)
│   │   ├── a2a/              # a2a SDK 네트워킹 + 스트리밍 + 헬스체크
│   │   ├── actions/              # 다중 라우트에서 공유되는 Server Actions
│   │   │   ├── users.actions.ts        # 인증 관련 API
│   │   │   └── partners.actions.ts        # 사용자 관련 API
│   │   ├── adapters/                         # DB↔DTO 변환 어댑터(순수 변환/검증)
│   │   │   ├── adapter-utils.ts              # (old: _utils.ts)
│   │   │   ├── agent.adapter.ts              # (old: lib/adapter/agent.ts)
│   │   │   ├── chat.adapter.ts               # (old: lib/adapter/chat.ts)
│   │   │   ├── group.adapter.ts              # (old: lib/adapter/group.ts)
│   │   │   ├── okr.adapter.ts                # (old: lib/adapter/okr.ts)
│   │   │   ├── permission.adapter.ts         # (old: lib/adapter/permission.ts)
│   │   │   ├── policy.adapter.ts             # (old: lib/adapter/policy.ts)
│   │   │   ├── resource.adapter.ts           # (old: lib/adapter/resource.ts)
│   │   │   ├── file-converter.adapter.ts    
│   │   │   └── index.ts                      # 필요한 것만 재export
│   │   ├── auth/
│   │   │   ├── auth.ts                     # betterAuth 서버 설정 (googleOidc, db 연동)
│   │   │   ├── with-auth.ts                # API 라우트 보호 래퍼 (withAuth)
│   │   │   ├── with-permission.ts          # PBAC 래퍼 (withPermission, withOKRAuth)
│   │   │   ├── session.ts                  # getServerSession, requireServerAuth 등
│   │   │   └── plugins/
│   │   │       └── google-oidc.ts            # googleOidc 플러그인 (필요 시)
│   │   ├── middleware/with-api-error.ts
│   │   ├── permissions/
│   │   │   └── permission.service.ts       # getPermissionService 구현 위치(이미 있다면 유지)
│   │   ├── db/ (migration폴더, database.ts, migrator.ts / 현재 db/schema 폴더에 있는 interface 들은 types 로 이동)
│   │   │       └── rls.ts                      # withRlsUser/withRlsContext 등 RLS 유틸
│   │   ├── services/                      # 도메인 서비스(DAO·외부API 어댑터·비즈 로직)
│   │   │   ├── agent
│   │   │   └── audit
│   │   │   └── .... 
│   ├── store/                # Zustand 전역 상태 (상태 관리 스토어)
│   │   ├── menuStore.ts      # 인증 관련 전역 상태 (예: 로그인 정보)
│   │   ├── resourceStore.ts      # 사용자 전역 상태 (예: 사용자 목록, 선택된 사용자)
│   │   └── themeStore.ts     # 테마 전역 상태 (예: 다크모드 토글)
│   ├── hooks/                # 커스텀 React 훅 모음
│   │   ├── useAuth.ts        # 예: 인증 상태 확인 및 훅
│   │   └── useDebounce.ts    # 예: 디바운스(debounce) 구현 훅
│   ├── lib/                  # 외부 라이브러리 연동 및 복잡한 비즈니스 로직
│   │   ├── chat/
│   │   └── debug/
│   │   └── okr/
│   │   └── schema/
│   ├── utils/                # 유틸리티 함수 (순수 함수, 포맷터 등)
│   │   ├── dateUtils.ts      # 예: 날짜 포맷 변환 함수
│   │   └── stringUtils.ts    # 예: 문자열 처리 함수
│   ├── styles/               # 전역 스타일 및 Tailwind 설정
│   │   ├── globals.css       # Tailwind base 및 프로젝트 전역 스타일
│   │   └── custom.css        # (필요시) 커스텀 CSS 모음
│   ├── api-client/                  # API  클라이언트 모음
│   │   ├── apiClient.ts      # 예: Axios/Fetch 설정 및 클라이언트
│   │   ├── users.ts            #   사용자 관련 API 클라이언트
│   │   ├── shipping.ts         # 사용자 관련 API 클라이언트
│   ├── types/                # types/는 “작게, 순수 TS만” 유지하고, 나머지 모델/계약은 Zod 스키마 중심으로 lib/schema로 통합!
│   │   ├── globals.d.ts 
│   │   └──  env.d.ts  
│   │   └──  utility.d.ts  // 런타임 코드가 거의/아예 생기지 않으면서 타입 안정성과 표현력을 높여주는 TypeScript 전용 타입들
│   │   └──  external.d.ts  // 서드파티 모듈 보강
│   └── contexts/ (선택)      # 리액트 컨텍스트 모음 (Zustand로 대체 가능)
│       └── ThemeContext.tsx  # 예: 다크/라이트 테마 전환 컨텍스트
├── public/                   # 정적 자산 파일(이미지, 폰트 등)
│   ├── images/               # 이미지 파일들
│   └── favicon.ico           # 파비콘
├── .env                      # 환경변수 파일
├── next.config.js            # Next.js 설정 파일
├── package.json
├── tailwind.config.js        # Tailwind CSS 설정 파일
└── tsconfig.json             # TypeScript 설정 파일

```