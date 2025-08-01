-- =================================================================
-- ENVIRONMENT-BASED SETTINGS STRUCTURE
-- =================================================================
-- This script creates a system to separate dev and prod settings

-- =================================================================
-- STEP 1: UPDATE TABLE STRUCTURE TO SUPPORT ENVIRONMENTS
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
-- STEP 2: INSERT DEV CONFIGURATION
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
-- STEP 3: INSERT PROD CONFIGURATION
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
-- STEP 4: CREATE INDEXES
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);
CREATE INDEX IF NOT EXISTS idx_app_settings_created_at ON app_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_settings ON app_settings USING GIN (settings);

-- =================================================================
-- STEP 5: VERIFICATION
-- =================================================================

-- Check both environments
SELECT 
    'Environment Settings' as status,
    environment,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    settings->'database'->>'environment' as db_environment,
    version
FROM app_settings
ORDER BY environment;