-- =================================================================
-- TEST ENVIRONMENT-BASED SETTINGS
-- =================================================================
-- This script tests the environment-based settings system

-- =================================================================
-- STEP 1: CHECK CURRENT TABLE STRUCTURE
-- =================================================================

-- Check if the table exists and has the right structure
SELECT 
    'Table Structure Check' as test,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'app_settings'
ORDER BY ordinal_position;

-- =================================================================
-- STEP 2: CHECK CURRENT DATA
-- =================================================================

-- Check what settings exist
SELECT 
    'Current Settings' as test,
    id,
    environment,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    settings->'database'->>'url' as has_url,
    settings->'database'->>'apiKey' as has_api_key,
    version,
    created_at,
    updated_at
FROM app_settings
ORDER BY environment;

-- =================================================================
-- STEP 3: TEST ENVIRONMENT DETECTION
-- =================================================================

-- Simulate environment detection
SELECT 
    'Environment Detection Test' as test,
    CASE 
        WHEN 'dev' = 'dev' THEN 'DEV Environment'
        WHEN 'prod' = 'prod' THEN 'PROD Environment'
        ELSE 'Unknown Environment'
    END as environment_type,
    CASE 
        WHEN 'dev' = 'dev' THEN 'pc_survey_data_dev'
        WHEN 'prod' = 'prod' THEN 'pc_survey_data'
        ELSE 'unknown_table'
    END as expected_table,
    CASE 
        WHEN 'dev' = 'dev' THEN 'Product Community Survey (DEV)'
        WHEN 'prod' = 'prod' THEN 'Product Community Survey'
        ELSE 'Unknown App'
    END as expected_app_name;

-- =================================================================
-- STEP 4: TEST SETTINGS PRIORITY
-- =================================================================

-- Test priority logic (this would be done in the application)
SELECT 
    'Settings Priority Test' as test,
    '1. User DB Settings' as priority_1,
    '2. Environment Variables' as priority_2,
    '3. Empty Placeholders' as priority_3;

-- =================================================================
-- STEP 5: VERIFY ENVIRONMENT-SPECIFIC CONFIGURATIONS
-- =================================================================

-- Check dev environment settings
SELECT 
    'DEV Environment Settings' as test,
    environment,
    settings->'database'->>'tableName' as table_name,
    settings->'general'->>'appName' as app_name,
    settings->'security'->>'enforceStrongPasswords' as strict_passwords,
    settings->'features'->>'enableEmailNotifications' as email_notifications
FROM app_settings 
WHERE environment = 'dev';

-- Check prod environment settings
SELECT 
    'PROD Environment Settings' as test,
    environment,
    settings->'database'->>'tableName' as table_name,
    settings->'general'->>'appName' as app_name,
    settings->'security'->>'enforceStrongPasswords' as strict_passwords,
    settings->'features'->>'enableEmailNotifications' as email_notifications
FROM app_settings 
WHERE environment = 'prod';

-- =================================================================
-- STEP 6: TEST CONFIGURATION COMPLETENESS
-- =================================================================

-- Check if configurations are complete
SELECT 
    'Configuration Completeness' as test,
    environment,
    CASE 
        WHEN settings->'database'->>'url' IS NOT NULL AND settings->'database'->>'url' != '' 
        THEN 'Configured'
        ELSE 'Not Configured'
    END as database_url_status,
    CASE 
        WHEN settings->'database'->>'apiKey' IS NOT NULL AND settings->'database'->>'apiKey' != '' 
        THEN 'Configured'
        ELSE 'Not Configured'
    END as database_key_status,
    CASE 
        WHEN settings->'database'->>'url' IS NOT NULL AND settings->'database'->>'url' != '' 
         AND settings->'database'->>'apiKey' IS NOT NULL AND settings->'database'->>'apiKey' != ''
        THEN 'Fully Configured'
        ELSE 'Needs Configuration'
    END as overall_status
FROM app_settings
ORDER BY environment;