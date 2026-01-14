# DB 마이그레이션 템플릿 (Supabase SQL)

이 문서는 Medihub에서 자주 쓰는 **Supabase SQL 마이그레이션 템플릿**을 모아둡니다.

## 0) 핵심 원칙

1. **단일 출처**: 스키마 변경은 `app/supabase/migrations/*.sql`만 사용합니다.
2. **기존 파일 수정 금지**: 커밋된 마이그레이션은 수정하지 않습니다(새 마이그레이션으로 정정).
3. **권한은 RLS로 강제**: API 가드만 믿지 말고 DB에서 마지막으로 막습니다.

## 1) 새 테이블 생성(+ updated_at 트리거)

```sql
-- 테이블 생성
create table public.example_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신(프로젝트에 set_updated_at() 함수가 존재한다는 전제)
create trigger example_items_set_updated_at
before update on public.example_items
for each row execute function public.set_updated_at();
```

## 2) 컬럼 추가/변경

```sql
alter table public.example_items
add column description text;
```

주의: 대용량 테이블에 `not null` + default를 추가하면 락/리라이트 비용이 커질 수 있습니다. 필요 시 단계적으로 수행합니다.

## 3) 인덱스 추가

```sql
create index example_items_owner_user_id_idx
  on public.example_items(owner_user_id);
```

## 4) Enum 타입 추가

```sql
create type public.example_status as enum ('draft', 'active', 'inactive');

alter table public.example_items
add column status public.example_status not null default 'draft';
```

## 5) RLS 활성화 + 정책 템플릿

```sql
alter table public.example_items enable row level security;

-- 조회: 본인 소유 row만
create policy "example_items_select_own"
on public.example_items
for select
using (owner_user_id = auth.uid());

-- 생성: 본인 소유로만 생성 가능
create policy "example_items_insert_own"
on public.example_items
for insert
with check (owner_user_id = auth.uid());

-- 수정: 본인 소유 row만
create policy "example_items_update_own"
on public.example_items
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- 삭제: 본인 소유 row만
create policy "example_items_delete_own"
on public.example_items
for delete
using (owner_user_id = auth.uid());
```

권장: 정책 이름은 “테이블_동작_조건” 형태로 규칙화합니다.

## 6) 보안/정합성 체크리스트

- [ ] 테이블에 RLS가 켜져 있는가?
- [ ] SELECT/INSERT/UPDATE/DELETE 정책이 의도대로 있는가?
- [ ] server-side 가드(`withRole/withApproved...`)와 정책이 충돌하지 않는가?
- [ ] 마이그레이션 후 `cd app && pnpm db:gen`을 실행했는가?

