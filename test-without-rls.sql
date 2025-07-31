-- =================================================================
-- TEST WITHOUT RLS - TEMPORARY DISABLE
-- =================================================================
-- This script temporarily disables RLS to test if that's the issue

-- =================================================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- =================================================================

-- Disable RLS on survey data table
ALTER TABLE pc_survey_data_dev DISABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 2: TEST QUERIES WITHOUT RLS
-- =================================================================

-- Test total count
SELECT 
    'Without RLS - Total responses' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test sample data
SELECT 
    'Without RLS - Sample data' as test_name,
    id,
    role,
    seniority,
    company_type,
    industry,
    created_at
FROM pc_survey_data_dev 
LIMIT 3;

-- =================================================================
-- STEP 3: RE-ENABLE RLS
-- =================================================================

-- Re-enable RLS
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 4: VERIFY RLS IS BACK ON
-- =================================================================

-- Check RLS status
SELECT 
    'RLS status after re-enable' as test_name,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'pc_survey_data_dev';