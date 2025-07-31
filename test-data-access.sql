-- =================================================================
-- TEST DATA ACCESS - SIMPLE VERIFICATION
-- =================================================================

-- Test 1: Basic table access
SELECT 
    'Test 1: Table exists' as test,
    COUNT(*) as result
FROM information_schema.tables
WHERE table_name = 'pc_survey_data_dev';

-- Test 2: Count total rows
SELECT 
    'Test 2: Total rows' as test,
    COUNT(*) as result
FROM pc_survey_data_dev;

-- Test 3: Show sample data
SELECT 
    'Test 3: Sample data' as test,
    id,
    role,
    seniority,
    created_at
FROM pc_survey_data_dev
LIMIT 3;

-- Test 4: Check RLS status
SELECT 
    'Test 4: RLS status' as test,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'pc_survey_data_dev';

-- Test 5: Check policies
SELECT 
    'Test 5: Policies' as test,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'pc_survey_data_dev';

-- Test 6: Test authenticated access
SELECT 
    'Test 6: Auth test' as test,
    auth.role() as current_role,
    auth.uid() as current_user_id;

-- Test 7: Test data access with auth
SELECT 
    'Test 7: Data with auth' as test,
    COUNT(*) as accessible_records
FROM pc_survey_data_dev;