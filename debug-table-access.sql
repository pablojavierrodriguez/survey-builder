-- =================================================================
-- DEBUG TABLE ACCESS - VERIFY DATA AND PERMISSIONS
-- =================================================================
-- This script helps debug why data is not loading

-- =================================================================
-- STEP 1: CHECK TABLE EXISTS AND HAS DATA
-- =================================================================

-- Check if table exists
SELECT 
    'Table exists' as check_type,
    COUNT(*) as result
FROM information_schema.tables 
WHERE table_name = 'pc_survey_data_dev';

-- Check total rows in table
SELECT 
    'Total rows in pc_survey_data_dev' as check_type,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Check sample data
SELECT 
    'Sample data' as check_type,
    id,
    role,
    seniority,
    created_at
FROM pc_survey_data_dev 
LIMIT 3;

-- =================================================================
-- STEP 2: CHECK RLS POLICIES
-- =================================================================

-- Check RLS status
SELECT 
    'RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'pc_survey_data_dev';

-- Check policies
SELECT 
    'Policies' as check_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'pc_survey_data_dev'
ORDER BY policyname;

-- =================================================================
-- STEP 3: TEST ACCESS AS AUTHENTICATED USER
-- =================================================================

-- Test basic select (should work for authenticated users)
SELECT 
    'Test authenticated access' as check_type,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test specific columns that analytics needs
SELECT 
    'Test role column' as check_type,
    COUNT(*) as result
FROM pc_survey_data_dev 
WHERE role IS NOT NULL;

SELECT 
    'Test seniority column' as check_type,
    COUNT(*) as result
FROM pc_survey_data_dev 
WHERE seniority IS NOT NULL;

-- =================================================================
-- STEP 4: CHECK FOR ANY ERRORS
-- =================================================================

-- Check if there are any constraint violations
SELECT 
    'Constraint check' as check_type,
    'No constraint violations found' as result
WHERE NOT EXISTS (
    SELECT 1 FROM pc_survey_data_dev 
    WHERE id IS NULL OR created_at IS NULL
);