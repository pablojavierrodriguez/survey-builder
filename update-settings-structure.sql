-- =================================================================
-- UPDATE SETTINGS STRUCTURE - SIMPLE VERSION
-- =================================================================
-- This script simply updates the app_settings table to the new structure

-- =================================================================
-- STEP 1: DROP AND RECREATE TABLE
-- =================================================================

-- Drop the existing table
DROP TABLE IF EXISTS app_settings;

-- Create the new simplified structure
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

INSERT INTO app_settings (id, settings, version) VALUES (
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
    }'::jsonb,
    '2.0.0'
);

-- =================================================================
-- STEP 3: CREATE INDEXES
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_app_settings_created_at ON app_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_settings ON app_settings USING GIN (settings);

-- =================================================================
-- STEP 4: VERIFICATION
-- =================================================================

SELECT 
    'Settings Updated' as status,
    id,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    version
FROM app_settings
WHERE id = 1;