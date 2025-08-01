-- =================================================================
-- MIGRATE TO SIMPLIFIED SETTINGS STRUCTURE
-- =================================================================
-- This script migrates the existing app_settings table to use only JSON
-- instead of having redundant separate columns

-- =================================================================
-- STEP 1: BACKUP CURRENT DATA
-- =================================================================

-- Create a backup of current settings
CREATE TABLE IF NOT EXISTS app_settings_backup AS 
SELECT * FROM app_settings;

-- =================================================================
-- STEP 2: MIGRATE TO SIMPLIFIED STRUCTURE
-- =================================================================

-- Drop and recreate the table with simplified structure
DROP TABLE IF EXISTS app_settings;

CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB NOT NULL DEFAULT '{}',
    version TEXT DEFAULT '2.0.0'
);

-- =================================================================
-- STEP 3: MIGRATE EXISTING DATA TO JSON
-- =================================================================

-- Insert migrated data from backup
INSERT INTO app_settings (id, created_at, updated_at, settings, version)
SELECT 
    id,
    created_at,
    updated_at,
    COALESCE(
        CASE 
            WHEN settings IS NOT NULL AND settings != '{}'::jsonb THEN settings
            ELSE jsonb_build_object(
                'database', jsonb_build_object(
                    'url', COALESCE(supabase_url, ''),
                    'apiKey', COALESCE(supabase_anon_key, ''),
                    'tableName', COALESCE(survey_table_name, 'pc_survey_data_dev'),
                    'environment', COALESCE(environment, 'dev')
                ),
                'general', jsonb_build_object(
                    'appName', COALESCE(app_name, 'Product Community Survey'),
                    'publicUrl', COALESCE(app_url, 'https://productcommunitysurvey-dev.vercel.app'),
                    'maintenanceMode', COALESCE(maintenance_mode, false),
                    'analyticsEnabled', COALESCE(enable_analytics, true)
                ),
                'security', jsonb_build_object(
                    'sessionTimeout', COALESCE(session_timeout, 28800000),
                    'maxLoginAttempts', COALESCE(max_login_attempts, 3),
                    'enableRateLimit', true,
                    'enforceStrongPasswords', false,
                    'enableTwoFactor', false
                ),
                'features', jsonb_build_object(
                    'enableExport', COALESCE(enable_export, true),
                    'enableEmailNotifications', COALESCE(enable_email_notifications, false),
                    'enableAnalytics', COALESCE(enable_analytics, true)
                )
            )
        END,
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
    ) as settings,
    COALESCE(version, '2.0.0') as version
FROM app_settings_backup;

-- =================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_app_settings_created_at ON app_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_settings ON app_settings USING GIN (settings);

-- =================================================================
-- STEP 5: VERIFICATION
-- =================================================================

-- Check the migrated structure
SELECT 
    'Migration Complete' as status,
    id,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    settings->'security'->>'sessionTimeout' as session_timeout,
    settings->'features'->>'enableAnalytics' as analytics_enabled,
    version
FROM app_settings
ORDER BY id;

-- =================================================================
-- STEP 6: CLEANUP (OPTIONAL)
-- =================================================================

-- Uncomment the following line to remove the backup table after verification
-- DROP TABLE IF EXISTS app_settings_backup;