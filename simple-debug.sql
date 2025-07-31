-- =================================================================
-- SIMPLE DEBUG - BASIC TESTS
-- =================================================================

-- Test 1: Check if table exists and has data
SELECT 
    'Table exists' as test,
    COUNT(*) as result
FROM information_schema.tables 
WHERE table_name = 'pc_survey_data_dev';

-- Test 2: Count total rows
SELECT 
    'Total rows' as test,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 3: Show sample data
SELECT 
    'Sample data' as test,
    id,
    role,
    seniority,
    created_at
FROM pc_survey_data_dev 
LIMIT 3;

-- Test 4: Check RLS status
SELECT 
    'RLS status' as test,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pc_survey_data_dev';

-- Test 5: Check policies
SELECT 
    'Policies' as test,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'pc_survey_data_dev';