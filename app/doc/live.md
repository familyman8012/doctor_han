• 지금 상태(로컬 Supabase + Next 개발서버)로 브라우저에서 보려면 이렇게 하면 됩니다.

  1. (필요하면) 로컬 Supabase 켜기

  - cd app
  - pnpm db:start
  - 상태 확인은 pnpm db:status (이미 켜져 있으면 생략)

  2. Next 개발서버 띄우기

  - cd app
  - pnpm dev

  3. 브라우저에서 접속

  - http://localhost:3000
  - 관리자 화면은 http://localhost:3000/admin

  만약 “로컬이 아니라 원격 개발용 Supabase(개발서버 DB)”에 붙여서 보고 싶은 거면
  app/.env.local의 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY를 개발용 값으로 바꾸고 pnpm dev를 다시 켜야 합니다. (원
  격 배포된 URL을 보려는 거면 배포 플랫폼/URL을 알려줘야 안내 가능해요.)