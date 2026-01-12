# Database Migration Skill

## 목적

Supabase 마이그레이션 생성 및 관리를 위한 스킬

## 트리거

- "테이블 만들어줘"
- "마이그레이션 생성"
- "DB 스키마 변경"
- "RLS 정책 추가"

## 명령어

```bash
# 모든 pnpm 커맨드는 app/에서 실행
cd app

# 새 마이그레이션 생성
pnpm db:new -- "migration_name"

# 로컬 DB 초기화 (마이그레이션 전체 재적용)
pnpm db:reset

# 마이그레이션 적용
pnpm db:migrate

# 타입 생성
pnpm db:gen -- --local

# 상태 확인
pnpm db:status
```

## 마이그레이션 템플릿

### 테이블 생성
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_[table_name].sql

-- 테이블 생성
CREATE TABLE [table_name] (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),

  -- 필드
  name TEXT NOT NULL,
  description TEXT,
  -- 가능하면 enum 타입 사용 권장 (예: public.vendor_status)
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'banned')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_[table]_owner ON [table_name](owner_user_id);
CREATE INDEX idx_[table]_status ON [table_name](status);
CREATE INDEX idx_[table]_created ON [table_name](created_at DESC);

-- RLS 활성화
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "[table]_select_all" ON [table_name]
  FOR SELECT USING (true);

CREATE POLICY "[table]_insert_auth" ON [table_name]
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "[table]_update_own" ON [table_name]
  FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "[table]_delete_own" ON [table_name]
  FOR DELETE USING (auth.uid() = owner_user_id);

-- updated_at 트리거
CREATE TRIGGER [table]_set_updated_at
  BEFORE UPDATE ON [table_name]
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### 컬럼 추가
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_[column]_to_[table].sql

ALTER TABLE [table_name]
  ADD COLUMN [column_name] [TYPE] [CONSTRAINTS];

-- 예시
ALTER TABLE vendors
  ADD COLUMN rating_avg NUMERIC(2,1) DEFAULT 0,
  ADD COLUMN review_count INTEGER DEFAULT 0;
```

### 컬럼 수정
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_alter_[column]_in_[table].sql

-- 타입 변경
ALTER TABLE [table_name]
  ALTER COLUMN [column_name] TYPE [NEW_TYPE];

-- NOT NULL 추가
ALTER TABLE [table_name]
  ALTER COLUMN [column_name] SET NOT NULL;

-- 기본값 변경
ALTER TABLE [table_name]
  ALTER COLUMN [column_name] SET DEFAULT [value];
```

### 인덱스 추가
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_index_[name].sql

-- 단일 컬럼 인덱스
CREATE INDEX idx_[table]_[column] ON [table_name]([column_name]);

-- 복합 인덱스
CREATE INDEX idx_[table]_[col1]_[col2] ON [table_name]([col1], [col2]);

-- 유니크 인덱스
CREATE UNIQUE INDEX idx_[table]_[column]_unique ON [table_name]([column_name]);

-- Partial 인덱스
CREATE INDEX idx_[table]_active ON [table_name](status)
  WHERE status = 'active';
```

### RLS 정책 추가
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_rls_[policy_name].sql

-- 모든 사용자 조회 허용
CREATE POLICY "[table]_select_public" ON [table_name]
  FOR SELECT USING (true);

-- 인증된 사용자만
CREATE POLICY "[table]_select_auth" ON [table_name]
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 본인 데이터만
CREATE POLICY "[table]_select_own" ON [table_name]
  FOR SELECT USING (auth.uid() = owner_user_id);

-- 역할 기반
CREATE POLICY "[table]_select_role" ON [table_name]
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin')
    )
  );

-- 조건부 공개
CREATE POLICY "[table]_select_approved" ON [table_name]
  FOR SELECT USING (status = 'active' OR auth.uid() = owner_user_id);
```

### 함수 생성
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_function_[name].sql

-- updated_at 자동 갱신 함수 (공통)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 관리자 확인 함수
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 업체 소유자 확인 함수
CREATE OR REPLACE FUNCTION public.is_vendor_owner(vendor_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 사용자 역할 조회 함수
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 리뷰 통계 업데이트 함수
CREATE OR REPLACE FUNCTION public.refresh_vendor_rating(target_vendor_id uuid)
RETURNS VOID AS $$
BEGIN
  UPDATE vendors
  SET
    review_count = (SELECT COUNT(*) FROM reviews WHERE vendor_id = target_vendor_id AND status = 'published'),
    rating_avg = (SELECT AVG(rating) FROM reviews WHERE vendor_id = target_vendor_id AND status = 'published')
  WHERE id = target_vendor_id;
END;
$$ LANGUAGE plpgsql;
```

## 타입 정의

### 자주 사용하는 타입
```sql
-- UUID
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- 텍스트
name TEXT NOT NULL
description TEXT

-- 숫자
price INTEGER DEFAULT 0
rating_avg NUMERIC(2,1) DEFAULT 0

-- 불리언
is_active BOOLEAN DEFAULT true

-- 타임스탬프
created_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ

-- JSON
metadata JSONB DEFAULT '{}'::jsonb

-- 배열
tags TEXT[]

-- Enum (CHECK 사용)
status TEXT CHECK (status IN ('pending', 'approved', 'rejected'))
```

## 워크플로우

### 새 테이블 추가
1. `cd app && pnpm db:new -- "create_[table_name]"`
2. SQL 작성
3. `cd app && pnpm db:reset` (로컬)
4. `cd app && pnpm db:gen -- --local`
5. 코드에서 타입 사용

### 스키마 변경
1. `cd app && pnpm db:new -- "alter_[description]"`
2. SQL 작성 (ALTER TABLE)
3. `cd app && pnpm db:reset`
4. `cd app && pnpm db:gen -- --local`

### 배포
1. 로컬에서 테스트 완료
2. `cd app && pnpm db:migrate` (프로덕션)
3. 프로덕션 타입 생성

## 주의사항

1. **파괴적 변경 주의**: DROP, TRUNCATE는 신중하게
2. **백업 먼저**: 프로덕션 변경 전 백업
3. **순서 중요**: FK가 있는 테이블은 참조 테이블 먼저 생성
4. **RLS 필수**: 모든 테이블에 RLS 활성화
5. **인덱스 계획**: 쿼리 패턴 고려하여 인덱스 설계
