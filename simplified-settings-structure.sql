-- =================================================================
-- SIMPLIFIED SETTINGS STRUCTURE - JSON ONLY
-- =================================================================
-- This script simplifies the app_settings table to use only JSON
-- instead of having redundant separate columns

-- =================================================================
-- STEP 1: CREATE SIMPLIFIED TABLE STRUCTURE
-- =================================================================

-- Drop the existing table and recreate with simplified structure
DROP TABLE IF EXISTS app_settings;

CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB NOT NULL DEFAULT '{}',
    version TEXT DEFAULT '2.0.0'
);

-- =================================================================
-- STEP 2: INSERT DEFAULT CONFIGURATION
-- =================================================================

INSERT INTO app_settings (id, settings) VALUES (
    1,
    '{
        "database": {
            "url": "",
            "apiKey": "",
            "tableName": "pc_survey_data_dev",
            "environment": "dev"
        },
        "general": {
            "appName": "Product Community Survey",
            "publicUrl": "https://productcommunitysurvey-dev.vercel.app",
            "maintenanceMode": false,
            "analyticsEnabled": true
        },
        "security": {
            "sessionTimeout": 28800000,
            "maxLoginAttempts": 3,
            "enableRateLimit": true,
            "enforceStrongPasswords": false,
            "enableTwoFactor": false
        },
        "features": {
            "enableExport": true,
            "enableEmailNotifications": false,
            "enableAnalytics": true
        }
    }'::jsonb
);

-- =================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_app_settings_created_at ON app_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_settings ON app_settings USING GIN (settings);

-- =================================================================
-- STEP 4: VERIFICATION
-- =================================================================

-- Check the simplified structure
SELECT 
    'Simplified Settings' as check_type,
    id,
    settings,
    version,
    created_at
FROM app_settings
WHERE id = 1;

-- Test JSON queries
SELECT 
    'JSON Test' as test_type,
    settings->>'database' as database_config,
    settings->'general'->>'appName' as app_name,
    settings->'security'->>'sessionTimeout' as session_timeout,
    settings->'features'->>'enableAnalytics' as analytics_enabled
FROM app_settings
WHERE id = 1;