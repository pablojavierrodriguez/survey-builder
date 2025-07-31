-- =================================================================
-- DEBUG ANALYTICS API - TEST EXACT QUERIES
-- =================================================================
-- This script tests the exact queries that the analytics API uses

-- =================================================================
-- STEP 1: TEST EXACT API QUERIES
-- =================================================================

-- Test 1: Total responses count (exact API query)
SELECT 
    'API Query 1 - Total responses' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 2: Role distribution (exact API query)
SELECT 
    'API Query 2 - Role data' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 3: Seniority distribution (exact API query)
SELECT 
    'API Query 3 - Seniority data' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 4: Company type distribution (exact API query)
SELECT 
    'API Query 4 - Company data' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 5: Industry distribution (exact API query)
SELECT 
    'API Query 5 - Industry data' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 6: Tools usage (exact API query)
SELECT 
    'API Query 6 - Tools data' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 7: Learning methods (exact API query)
SELECT 
    'API Query 7 - Learning data' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 8: Recent responses (exact API query)
SELECT 
    'API Query 8 - Recent responses' as test_name,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- =================================================================
-- STEP 2: TEST WITH SAMPLE DATA
-- =================================================================

-- Show actual data
SELECT 
    'Sample data' as test_name,
    id,
    role,
    seniority,
    company_type,
    industry,
    created_at
FROM pc_survey_data_dev 
LIMIT 5;

-- =================================================================
-- STEP 3: TEST RLS POLICIES
-- =================================================================

-- Check current policies
SELECT 
    'Current policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'pc_survey_data_dev'
ORDER BY policyname;

-- Test if we can access as authenticated user
SELECT 
    'Auth test' as test_name,
    auth.role() as current_role,
    auth.uid() as current_user_id;