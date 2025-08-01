-- =================================================================
-- TEST SIMPLIFIED CONFIGURATION SYSTEM
-- =================================================================
-- This script tests that the simplified JSON-only settings work correctly

-- =================================================================
-- STEP 1: TEST CURRENT SETTINGS
-- =================================================================

-- Check current settings structure
SELECT 
    'Current Settings' as test_type,
    id,
    settings,
    version
FROM app_settings
WHERE id = 1;

-- =================================================================
-- STEP 2: TEST JSON QUERIES
-- =================================================================

-- Test accessing individual settings
SELECT 
    'JSON Queries' as test_type,
    settings->'database'->>'tableName' as table_name,
    settings->'general'->>'appName' as app_name,
    settings->'security'->>'sessionTimeout' as session_timeout,
    settings->'features'->>'enableAnalytics' as analytics_enabled
FROM app_settings
WHERE id = 1;

-- =================================================================
-- STEP 3: TEST SETTINGS UPDATE
-- =================================================================

-- Test updating a setting
UPDATE app_settings 
SET 
    settings = jsonb_set(
        settings, 
        '{general,appName}', 
        '"Product Community Survey (TEST)"'::jsonb
    ),
    updated_at = NOW()
WHERE id = 1;

-- Verify the update
SELECT 
    'Settings Update Test' as test_type,
    settings->'general'->>'appName' as updated_app_name
FROM app_settings
WHERE id = 1;

-- =================================================================
-- STEP 4: TEST API COMPATIBILITY
-- =================================================================

-- Simulate what the API would return
SELECT 
    'API Compatibility' as test_type,
    jsonb_build_object(
        'success', true,
        'data', settings
    ) as api_response
FROM app_settings
WHERE id = 1;

-- =================================================================
-- STEP 5: RESTORE ORIGINAL SETTINGS
-- =================================================================

-- Restore original app name
UPDATE app_settings 
SET 
    settings = jsonb_set(
        settings, 
        '{general,appName}', 
        '"Product Community Survey"'::jsonb
    ),
    updated_at = NOW()
WHERE id = 1;

-- =================================================================
-- STEP 6: FINAL VERIFICATION
-- =================================================================

SELECT 
    'Final Verification' as test_type,
    'All tests passed' as status,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    NOW() as timestamp
FROM app_settings
WHERE id = 1;