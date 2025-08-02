-- Database Performance Optimization Indexes
-- This script adds indexes to improve query performance

-- =====================================================
-- SURVEY DATA TABLE INDEXES
-- =====================================================

-- Primary indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_survey_data_created_at ON pc_survey_data_dev(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_data_updated_at ON pc_survey_data_dev(updated_at DESC);

-- Role-based filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_survey_data_role ON pc_survey_data_dev(role);

-- Industry and company type filtering
CREATE INDEX IF NOT EXISTS idx_survey_data_industry ON pc_survey_data_dev(industry);
CREATE INDEX IF NOT EXISTS idx_survey_data_company_type ON pc_survey_data_dev(company_type);
CREATE INDEX IF NOT EXISTS idx_survey_data_company_size ON pc_survey_data_dev(company_size);

-- Product and customer filtering
CREATE INDEX IF NOT EXISTS idx_survey_data_product_type ON pc_survey_data_dev(product_type);
CREATE INDEX IF NOT EXISTS idx_survey_data_customer_segment ON pc_survey_data_dev(customer_segment);

-- Salary range filtering
CREATE INDEX IF NOT EXISTS idx_survey_data_salary_min ON pc_survey_data_dev(salary_min);
CREATE INDEX IF NOT EXISTS idx_survey_data_salary_max ON pc_survey_data_dev(salary_max);

-- Seniority filtering
CREATE INDEX IF NOT EXISTS idx_survey_data_seniority ON pc_survey_data_dev(seniority);

-- Session and source tracking
CREATE INDEX IF NOT EXISTS idx_survey_data_session_id ON pc_survey_data_dev(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_data_source ON pc_survey_data_dev(source);

-- =====================================================
-- PROFILES TABLE INDEXES
-- =====================================================

-- Role-based access (most important for auth)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Email lookup (assuming email column exists)
-- CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- APP SETTINGS TABLE INDEXES
-- =====================================================

-- Environment-based settings lookup
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Analytics queries: role + created_at
CREATE INDEX IF NOT EXISTS idx_survey_data_role_created_at ON pc_survey_data_dev(role, created_at DESC);

-- Filtering by role and industry
CREATE INDEX IF NOT EXISTS idx_survey_data_role_industry ON pc_survey_data_dev(role, industry);

-- Salary analysis: role + salary range
CREATE INDEX IF NOT EXISTS idx_survey_data_role_salary ON pc_survey_data_dev(role, salary_min, salary_max);

-- Company analysis: role + company type + size
CREATE INDEX IF NOT EXISTS idx_survey_data_role_company ON pc_survey_data_dev(role, company_type, company_size);

-- =====================================================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- =====================================================

-- Only non-null salary data for analytics
CREATE INDEX IF NOT EXISTS idx_survey_data_salary_not_null ON pc_survey_data_dev(salary_min, salary_max) 
WHERE salary_min IS NOT NULL AND salary_max IS NOT NULL;

-- Only completed surveys (has email)
CREATE INDEX IF NOT EXISTS idx_survey_data_completed ON pc_survey_data_dev(created_at DESC) 
WHERE email IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('pc_survey_data_dev', 'profiles', 'app_settings')
ORDER BY tablename, indexname;

-- Show index usage statistics (run after some usage)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('pc_survey_data_dev', 'profiles', 'app_settings')
-- ORDER BY idx_scan DESC;