-- Fix: ON DELETE CASCADE → SET NULL for sanctions.created_by
-- This preserves audit trail when admin accounts are deleted

-- Step 1: Make created_by nullable FIRST (required before SET NULL constraint)
ALTER TABLE public.sanctions
    ALTER COLUMN created_by DROP NOT NULL;

-- Step 2: Drop existing constraint
ALTER TABLE public.sanctions
    DROP CONSTRAINT IF EXISTS sanctions_created_by_fkey;

-- Step 3: Add new constraint with SET NULL
ALTER TABLE public.sanctions
    ADD CONSTRAINT sanctions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
