-- ============================================
-- Fix: infinite recursion in bid_projects RLS
-- ============================================
-- Problem: bid_projects_select_vendor checks bid_responses,
-- and bid_responses_select_doctor checks bid_projects,
-- creating a circular RLS evaluation loop.
--
-- Solution: Use SECURITY DEFINER helper functions that bypass RLS
-- to break the cross-table reference cycle.
-- ============================================

-- 1. Helper function: check if current user owns a bid_project
--    Used by bid_responses, bid_contracts, bid_scores, bid_status_history
--    to verify doctor access without triggering bid_projects RLS.
CREATE OR REPLACE FUNCTION public.is_bid_project_doctor(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bid_projects
    WHERE id = p_project_id
      AND doctor_user_id = auth.uid()
  );
$$;

-- 2. Helper function: check if current user's vendor has a bid_response for a project
--    Used by bid_projects to verify vendor access without triggering bid_responses RLS.
CREATE OR REPLACE FUNCTION public.is_bid_project_vendor(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bid_responses br
    JOIN vendors v ON v.id = br.vendor_id
    WHERE br.project_id = p_project_id
      AND v.owner_user_id = auth.uid()
  );
$$;

-- 3. Helper function: check if current user owns a vendor
--    Used by bid_responses, bid_contracts, bid_scores
--    to verify vendor access without triggering vendors RLS.
CREATE OR REPLACE FUNCTION public.is_bid_vendor_owner(p_vendor_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors
    WHERE id = p_vendor_id
      AND owner_user_id = auth.uid()
  );
$$;

-- ============================================
-- 4. Replace bid_projects policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "bid_projects_select_doctor" ON public.bid_projects;
DROP POLICY IF EXISTS "bid_projects_select_vendor" ON public.bid_projects;
DROP POLICY IF EXISTS "bid_projects_select_admin" ON public.bid_projects;
DROP POLICY IF EXISTS "bid_projects_insert_doctor" ON public.bid_projects;
DROP POLICY IF EXISTS "bid_projects_update_doctor" ON public.bid_projects;
DROP POLICY IF EXISTS "bid_projects_update_admin" ON public.bid_projects;

-- Recreate: doctor sees own projects (no cross-table ref, no change needed but recreate for consistency)
CREATE POLICY "bid_projects_select_doctor"
  ON public.bid_projects FOR SELECT
  USING (doctor_user_id = auth.uid());

-- Recreate: vendor sees projects they have a bid_response for (uses helper to avoid recursion)
CREATE POLICY "bid_projects_select_vendor"
  ON public.bid_projects FOR SELECT
  USING (public.is_bid_project_vendor(id));

-- Recreate: admin sees all
CREATE POLICY "bid_projects_select_admin"
  ON public.bid_projects FOR SELECT
  USING (public.is_admin());

-- Recreate: doctor inserts own projects
CREATE POLICY "bid_projects_insert_doctor"
  ON public.bid_projects FOR INSERT
  WITH CHECK (doctor_user_id = auth.uid());

-- Recreate: doctor updates own projects
CREATE POLICY "bid_projects_update_doctor"
  ON public.bid_projects FOR UPDATE
  USING (doctor_user_id = auth.uid());

-- Recreate: admin updates any project
CREATE POLICY "bid_projects_update_admin"
  ON public.bid_projects FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- 5. Replace bid_responses policies
-- ============================================

DROP POLICY IF EXISTS "bid_responses_select_doctor" ON public.bid_responses;
DROP POLICY IF EXISTS "bid_responses_select_vendor" ON public.bid_responses;
DROP POLICY IF EXISTS "bid_responses_update_vendor" ON public.bid_responses;
DROP POLICY IF EXISTS "bid_responses_select_admin" ON public.bid_responses;
DROP POLICY IF EXISTS "bid_responses_update_admin" ON public.bid_responses;

-- Doctor sees responses for their projects (uses helper to avoid recursion)
CREATE POLICY "bid_responses_select_doctor"
  ON public.bid_responses FOR SELECT
  USING (public.is_bid_project_doctor(project_id));

-- Vendor sees own responses (uses helper to avoid recursion)
CREATE POLICY "bid_responses_select_vendor"
  ON public.bid_responses FOR SELECT
  USING (public.is_bid_vendor_owner(vendor_id));

-- Vendor updates own responses (uses helper to avoid recursion)
CREATE POLICY "bid_responses_update_vendor"
  ON public.bid_responses FOR UPDATE
  USING (public.is_bid_vendor_owner(vendor_id));

-- Admin sees all
CREATE POLICY "bid_responses_select_admin"
  ON public.bid_responses FOR SELECT
  USING (public.is_admin());

-- Admin updates all
CREATE POLICY "bid_responses_update_admin"
  ON public.bid_responses FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- 6. Replace bid_project_scores policies
-- ============================================

DROP POLICY IF EXISTS "bid_scores_select_doctor" ON public.bid_project_scores;
DROP POLICY IF EXISTS "bid_scores_select_vendor" ON public.bid_project_scores;
DROP POLICY IF EXISTS "bid_scores_select_admin" ON public.bid_project_scores;

-- Doctor sees scores for their projects (uses helper)
CREATE POLICY "bid_scores_select_doctor"
  ON public.bid_project_scores FOR SELECT
  USING (public.is_bid_project_doctor(project_id));

-- Vendor sees own scores (uses helper)
CREATE POLICY "bid_scores_select_vendor"
  ON public.bid_project_scores FOR SELECT
  USING (public.is_bid_vendor_owner(vendor_id));

-- Admin sees all
CREATE POLICY "bid_scores_select_admin"
  ON public.bid_project_scores FOR SELECT
  USING (public.is_admin());

-- ============================================
-- 7. Replace bid_contracts policies
-- ============================================

DROP POLICY IF EXISTS "bid_contracts_select_doctor" ON public.bid_contracts;
DROP POLICY IF EXISTS "bid_contracts_select_vendor" ON public.bid_contracts;
DROP POLICY IF EXISTS "bid_contracts_select_admin" ON public.bid_contracts;
DROP POLICY IF EXISTS "bid_contracts_update_admin" ON public.bid_contracts;

-- Doctor sees contracts for their projects (uses helper)
CREATE POLICY "bid_contracts_select_doctor"
  ON public.bid_contracts FOR SELECT
  USING (public.is_bid_project_doctor(project_id));

-- Vendor sees own contracts (uses helper)
CREATE POLICY "bid_contracts_select_vendor"
  ON public.bid_contracts FOR SELECT
  USING (public.is_bid_vendor_owner(vendor_id));

-- Admin sees all
CREATE POLICY "bid_contracts_select_admin"
  ON public.bid_contracts FOR SELECT
  USING (public.is_admin());

-- Admin updates all
CREATE POLICY "bid_contracts_update_admin"
  ON public.bid_contracts FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- 8. Replace bid_project_status_history policies
-- ============================================

DROP POLICY IF EXISTS "bid_status_history_select_doctor" ON public.bid_project_status_history;
DROP POLICY IF EXISTS "bid_status_history_select_admin" ON public.bid_project_status_history;

-- Doctor sees history for their projects (uses helper)
CREATE POLICY "bid_status_history_select_doctor"
  ON public.bid_project_status_history FOR SELECT
  USING (public.is_bid_project_doctor(project_id));

-- Admin sees all
CREATE POLICY "bid_status_history_select_admin"
  ON public.bid_project_status_history FOR SELECT
  USING (public.is_admin());
