-- Analytics performance indexes for admin dashboard aggregation queries
-- These indexes optimize the date-range-based COUNT/SUM queries used by analytics endpoints.

-- 1. profiles: role-based user count + date range filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at
  ON profiles (role, created_at);

-- 2. profiles: status-based filtering for active/inactive counts
CREATE INDEX IF NOT EXISTS idx_profiles_status_created_at
  ON profiles (status, created_at);

-- 3. leads: status + date range for lead analytics
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at
  ON leads (status, created_at);

-- 4. leads: vendor + date range for per-vendor lead analytics
CREATE INDEX IF NOT EXISTS idx_leads_vendor_id_created_at
  ON leads (vendor_id, created_at);

-- 5. lead_charges: status + date range for revenue analytics
CREATE INDEX IF NOT EXISTS idx_lead_charges_status_created_at
  ON lead_charges (status, created_at);

-- 6. payments: status + date range for payment analytics
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at
  ON payments (status, created_at);

-- 7. reviews: status + date range for review analytics
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at
  ON reviews (status, created_at);

-- 8. reports: status + date range for report/moderation analytics
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
  ON reports (status, created_at);

-- 9. support_tickets: status + date range for support analytics
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at
  ON support_tickets (status, created_at);
