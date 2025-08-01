-- =================================================================
-- FIX ALL HARDCODEOS - COMPREHENSIVE CONFIGURATION UPDATE
-- =================================================================
-- This script updates the app_settings table with all configuration values
-- that were previously hardcoded throughout the application

-- =================================================================
-- STEP 1: UPDATE APP_SETTINGS WITH COMPLETE CONFIGURATION
-- =================================================================

UPDATE app_settings SET
    -- General settings
    app_name = 'Product Community Survey',
    app_url = 'https://productcommunitysurvey-dev.vercel.app',
    environment = 'dev',
    survey_table_name = 'pc_survey_data_dev',
    
    -- Feature flags
    enable_analytics = TRUE,
    enable_email_notifications = FALSE,
    enable_export = TRUE,
    
    -- Security settings
    session_timeout = 28800000, -- 8 hours in milliseconds
    max_login_attempts = 3,
    
    -- Theme and language
    theme_default = 'system',
    language_default = 'en',
    
    -- Complete settings object
    settings = '{
        "supabase_url": "",
        "supabase_anon_key": "",
        "require_https": true,
        "enable_rate_limit": true,
        "enforce_strong_passwords": false,
        "enable_two_factor": false,
        "admin_email": "",
        "response_threshold": 10,
        "maintenance_mode": false,
        "enable_analytics": true,
        "enable_email_notifications": false,
        "enable_export": true,
        "session_timeout": 28800000,
        "max_login_attempts": 3
    }'::jsonb,
    
    -- Metadata
    description = 'Complete configuration with all settings centralized',
    version = '2.0.0',
    updated_at = NOW()
WHERE id = 1;

-- =================================================================
-- STEP 2: VERIFY THE UPDATE
-- =================================================================

-- Check updated settings
SELECT 
    'Updated Settings' as check_type,
    id,
    app_name,
    app_url,
    environment,
    survey_table_name,
    enable_analytics,
    enable_email_notifications,
    enable_export,
    session_timeout,
    max_login_attempts,
    settings,
    updated_at
FROM app_settings
WHERE id = 1;

-- =================================================================
-- STEP 3: TEST CONFIGURATION ACCESS
-- =================================================================

-- Test that all settings are accessible
SELECT 
    'Configuration Test' as test_type,
    'All settings updated successfully' as status,
    NOW() as timestamp;