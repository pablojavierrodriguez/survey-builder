-- =================================================================
-- MIGRATE TO ENVIRONMENT-BASED SETTINGS
-- =================================================================
-- This script migrates the existing app_settings table to support environments

-- =================================================================
-- STEP 1: BACKUP CURRENT DATA
-- =================================================================

-- Create a backup of current settings
CREATE TABLE IF NOT EXISTS app_settings_backup AS 
SELECT * FROM app_settings;

-- =================================================================
-- STEP 2: DROP AND RECREATE TABLE WITH ENVIRONMENT SUPPORT
-- =================================================================

-- Drop the existing table
DROP TABLE IF EXISTS app_settings;

-- Create the new structure with environment support
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    environment TEXT NOT NULL DEFAULT 'dev',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB NOT NULL DEFAULT '{}',
    version TEXT DEFAULT '2.0.0',
    UNIQUE(environment)
);

-- =================================================================
-- STEP 3: INSERT DEV CONFIGURATION
-- =================================================================

INSERT INTO app_settings (environment, settings, version) VALUES (
    'dev',
    '{
        "database": {
            "url": "",
            "apiKey": "",
            "tableName": "pc_survey_data_dev",
            "environment": "dev"
        },
        "general": {
            "appName": "Product Community Survey (DEV)",
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
-- STEP 4: INSERT PROD CONFIGURATION
-- =================================================================

INSERT INTO app_settings (environment, settings, version) VALUES (
    'prod',
    '{
        "database": {
            "url": "",
            "apiKey": "",
            "tableName": "pc_survey_data",
            "environment": "prod"
        },
        "general": {
            "appName": "Product Community Survey",
            "publicUrl": "https://productcommunitysurvey.vercel.app",
            "maintenanceMode": false,
            "analyticsEnabled": true
        },
        "security": {
            "sessionTimeout": 28800000,
            "maxLoginAttempts": 3,
            "enableRateLimit": true,
            "enforceStrongPasswords": true,
            "enableTwoFactor": false
        },
        "features": {
            "enableExport": true,
            "enableEmailNotifications": true,
            "enableAnalytics": true
        }
    }'::jsonb,
    '2.0.0'
);

-- =================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);
CREATE INDEX IF NOT EXISTS idx_app_settings_created_at ON app_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_settings ON app_settings USING GIN (settings);

-- =================================================================
-- STEP 6: VERIFICATION
-- =================================================================

-- Check the migrated structure
SELECT 
    'Migration Complete' as status,
    id,
    environment,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    settings->'database'->>'environment' as db_environment,
    version
FROM app_settings
ORDER BY environment;

-- =================================================================
-- STEP 7: CLEANUP (OPTIONAL)
-- =================================================================

-- Uncomment the following line to remove the backup table after verification
-- DROP TABLE IF EXISTS app_settings_backup;