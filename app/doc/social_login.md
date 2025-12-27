# 소셜 로그인 설정 가이드

## 1. Google OAuth 설정

### 1-1. Google Cloud Console 접속

1. https://console.cloud.google.com 접속
2. Google 계정으로 로그인
3. 상단의 프로젝트 선택 드롭다운 클릭 → 새 프로젝트 생성 또는 기존 프로젝트 선택

---

### 1-2. OAuth 동의 화면 설정

#### Step 1: 동의 화면 시작
1. https://console.cloud.google.com/apis/credentials/consent 접속
2. "Google 인증 플랫폼이 아직 구성되지 않음" 화면이 나오면 **"시작하기"** 버튼 클릭

#### Step 2: 앱 정보 입력
| 필드 | 입력값 | 설명 |
|------|--------|------|
| 앱 이름 | 메디허브 (또는 서비스명) | 사용자에게 표시될 앱 이름 |
| 사용자 지원 이메일 | 본인 이메일 선택 | 드롭다운에서 선택 |

#### Step 3: 대상 선택
- **"외부"** 선택 (일반 사용자 대상 서비스인 경우)
- "다음" 클릭

#### Step 4: 연락처 정보
- 개발자 연락처 이메일 입력
- "다음" 클릭 → "만들기" 클릭

#### Step 5: 승인된 도메인 추가
1. 좌측 메뉴에서 **"브랜딩"** 클릭
2. "승인된 도메인" 섹션에서 **"+ 도메인 추가"** 클릭
3. Supabase 도메인 입력 (https:// 제외):
   ```
   qhyzwhblglxodbcbkgem.supabase.co
   ```
4. **"저장"** 클릭

#### Step 6: Scopes(범위) 설정
1. 좌측 메뉴에서 **"데이터 액세스"** 클릭
2. **"범위 추가 또는 삭제"** 버튼 클릭
3. 검색창에서 다음 3개를 찾아 체크:
   - `userinfo.email` - 이메일 주소 조회
   - `userinfo.profile` - 이름, 프로필 사진 조회
   - `openid` - OpenID Connect 인증
4. **"업데이트"** 클릭 → **"저장"** 클릭

---

### 1-3. OAuth Client ID 생성

#### Step 1: 클라이언트 만들기
1. 좌측 메뉴에서 **"클라이언트"** 클릭
2. **"+ 클라이언트 만들기"** 버튼 클릭

#### Step 2: 클라이언트 정보 입력
| 필드 | 입력값 |
|------|--------|
| 애플리케이션 유형 | **웹 애플리케이션** 선택 |
| 이름 | 메디허브 (아무거나 OK) |

#### Step 3: 승인된 JavaScript 원본 추가
**"+ URI 추가"** 버튼을 클릭하여 다음 URL들을 추가:
```
http://localhost:3000
https://doctor-han.vercel.app
```
> ⚠️ 끝에 슬래시(/) 없이 입력

#### Step 4: 승인된 리디렉션 URI 추가
**"+ URI 추가"** 버튼을 클릭하여 다음 URL 추가:
```
https://qhyzwhblglxodbcbkgem.supabase.co/auth/v1/callback
```

#### Step 5: 저장 및 키 확인
1. **"만들기"** 버튼 클릭
2. 생성된 **Client ID**와 **Client Secret** 복사해두기
   - 예: Client ID = `123456789-abcdefg.apps.googleusercontent.com`
   - 예: Client Secret = `GOCSPX-xxxxxxxxxxxxxxxx`

---

### 1-4. Supabase Dashboard 설정

1. https://supabase.com/dashboard 접속 → 프로젝트 선택
2. 좌측 메뉴 **"Authentication"** 클릭
3. **"Providers"** 탭 클릭
4. **"Google"** 항목 찾아서 클릭하여 확장
5. 다음 값 입력:
   | 필드 | 입력값 |
   |------|--------|
   | Google enabled | **ON** (토글 활성화) |
   | Client ID | 위에서 복사한 Client ID |
   | Client Secret | 위에서 복사한 Client Secret |
6. **"Save"** 버튼 클릭

---

## 2. Kakao OAuth 설정

> ⚠️ **주의**: 카카오 개발자 콘솔이 2024년 개편되어 Redirect URI, Client Secret 설정 위치가 변경되었습니다.
> 기존: `제품 설정 → 카카오 로그인 → 보안`
> 현재: `앱 → 플랫폼 키 → REST API 키` 상세 화면

---

### 2-1. 카카오 개발자 콘솔 접속

1. https://developers.kakao.com 접속 → 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기** 클릭
3. 앱 이름, 사업자명 입력 후 저장

---

### 2-2. 카카오 로그인 활성화 (필수)

#### Step 1: 카카오 로그인 ON
1. 좌측 메뉴 **카카오 로그인** 클릭
2. **활성화 설정** → 상태를 **ON**으로 변경

> ⚠️ OFF 상태면 `KOE004` 에러 발생

---

### 2-3. REST API 키 확인 및 Redirect URI / Client Secret 설정

> 📍 **핵심**: 개편 후 Redirect URI와 Client Secret이 모두 **플랫폼 키 상세 화면**으로 이동했습니다.

#### Step 1: REST API 키 상세 화면 진입
1. 좌측 메뉴 **앱 설정** → **앱 키** 클릭
2. **REST API 키** 항목의 **상세** 버튼 클릭 (또는 키 클릭)

#### Step 2: REST API 키 복사 (Client ID)
```
REST API 키 = Supabase의 Client ID로 사용
```

#### Step 3: Redirect URI 등록
1. 같은 화면에서 **카카오 로그인 리다이렉트 URI** 섹션 찾기
2. **등록** 버튼 클릭
3. Supabase Callback URL 입력:
   ```
   https://qhyzwhblglxodbcbkgem.supabase.co/auth/v1/callback
   ```

> ✅ 정확한 값은 Supabase 대시보드 > Authentication > Providers > Kakao의 "Callback URL"을 복사해서 붙여넣기

#### Step 4: Client Secret 발급 및 활성화
1. 같은 화면에서 **클라이언트 시크릿** 섹션 찾기
2. **카카오 로그인** 항목을 **ON**으로 활성화
3. **코드 생성** 버튼 클릭
4. 생성된 코드 복사 (Supabase의 Client Secret으로 사용)

---

### 2-4. 동의항목(Scopes) 설정

1. 좌측 메뉴 **카카오 로그인** → **동의항목** 클릭
2. 필요한 항목 설정:

| 항목 | 권장 설정 | 용도 |
|------|----------|------|
| 닉네임 | 필수 동의 | 사용자 이름 표시 |
| 프로필 사진 | 선택 동의 | 프로필 이미지 |
| 카카오계정(이메일) | 필수 동의 | 사용자 식별 (중요!) |

> ⚠️ 이메일을 사용자 식별에 쓰려면 이메일 동의항목이 반드시 필요합니다.

---

### 2-5. 호출 허용 IP (선택사항)

| 환경 | 설정 |
|------|------|
| 고정 IP 서버 | IP 등록하면 보안 강화 |
| Vercel/서버리스 | **비워두기** (IP가 바뀌므로) |

---

### 2-6. Supabase Dashboard 설정

1. https://supabase.com/dashboard 접속 → 프로젝트 선택
2. 좌측 메뉴 **Authentication** → **Providers** 탭
3. **Kakao** 클릭하여 확장
4. 다음 값 입력:

| 필드 | 입력값 |
|------|--------|
| Kakao enabled | **ON** |
| Client ID | 카카오 **REST API 키** |
| Client Secret | 카카오 **클라이언트 시크릿 코드** |

5. **Save** 클릭

---

### 2-7. Supabase URL Configuration

1. **Authentication** → **URL Configuration**
2. 다음 URL들이 허용 목록에 있는지 확인:
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   https://doctor-han.vercel.app
   https://doctor-han.vercel.app/auth/callback
   ```

  ---
  3. Local/Production 도메인 설정

  Redirect URL Allow List

  Supabase Dashboard → Authentication → URL Configuration

  # Local 개발
  http://localhost:3000
  http://localhost:3000/auth/callback

  # Production
  https://your-domain.com
  https://your-domain.com/auth/callback

  ---



### 2-5. 플랫폼 등록 (웹) -> 이건 이제 카카오 로그인같은데서 안쓰고, 제품링크관리 (카카오 공유등) 에서만 사용됨.

1. 좌측 메뉴 **앱 설정** → **플랫폼** 클릭
2. **Web** 플랫폼 등록
3. 사이트 도메인 추가:
   ```
   http://localhost:3000
   https://doctor-han.vercel.app
   ```

> 💡 Supabase Provider 방식이면 Kakao JS SDK를 직접 쓰지 않으므로 JS 키 도메인 설정은 생략 가능



  4. Next.js 코드 구현

  4-1. Callback Route 생성

  app/auth/callback/route.ts:

  import { NextResponse } from 'next/server'
  import { createClient } from '@/utils/supabase/server'

  export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/'

    if (!next.startsWith('/')) {
      next = '/'
    }

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const isLocalEnv = process.env.NODE_ENV === 'development'
        const forwardedHost = request.headers.get('x-forwarded-host')

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  4-2. 로그인 함수

  // Google 로그인
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  // Kakao 로그인
  async function signInWithKakao() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  ---
  5. 환경별 Redirect URL 정리

  | 환경  | Supabase Callback URL                          | 앱 Redirect URL                       |
  |-------|------------------------------------------------|---------------------------------------|
  | Local | https://<PROJECT>.supabase.co/auth/v1/callback | http://localhost:3000/auth/callback   |
  | Prod  | https://<PROJECT>.supabase.co/auth/v1/callback | https://your-domain.com/auth/callback |

  참고: OAuth Provider(Google/Kakao)에는 Supabase callback URL을, Supabase URL Configuration에는 앱의 redirect URL을 등록합니다.