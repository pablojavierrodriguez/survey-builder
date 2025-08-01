-- =================================================================
-- QUICK FIX: ADD ENVIRONMENT COLUMN TO EXISTING TABLE
-- =================================================================
-- This script adds the environment column to the existing app_settings table

-- =================================================================
-- STEP 1: ADD ENVIRONMENT COLUMN
-- =================================================================

-- Add environment column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_settings' AND column_name = 'environment'
    ) THEN
        ALTER TABLE app_settings ADD COLUMN environment TEXT DEFAULT 'dev';
    END IF;
END $$;

-- =================================================================
-- STEP 2: UPDATE EXISTING RECORDS
-- =================================================================

-- Update existing records to have environment = 'dev'
UPDATE app_settings SET environment = 'dev' WHERE environment IS NULL;

-- =================================================================
-- STEP 3: MAKE ENVIRONMENT NOT NULL
-- =================================================================

-- Make environment column NOT NULL
ALTER TABLE app_settings ALTER COLUMN environment SET NOT NULL;

-- =================================================================
-- STEP 4: ADD UNIQUE CONSTRAINT
-- =================================================================

-- Add unique constraint on environment
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'app_settings_environment_key'
    ) THEN
        ALTER TABLE app_settings ADD CONSTRAINT app_settings_environment_key UNIQUE (environment);
    END IF;
END $$;

-- =================================================================
-- STEP 5: INSERT PROD ENVIRONMENT IF NOT EXISTS
-- =================================================================

-- Insert prod environment if it doesn't exist
INSERT INTO app_settings (environment, settings, version) 
SELECT 'prod', 
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
WHERE NOT EXISTS (
    SELECT 1 FROM app_settings WHERE environment = 'prod'
);

-- =================================================================
-- STEP 6: CREATE INDEXES
-- =================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);
CREATE INDEX IF NOT EXISTS idx_app_settings_settings ON app_settings USING GIN (settings);

-- =================================================================
-- STEP 7: VERIFICATION
-- =================================================================

-- Check the updated structure
SELECT 
    'Quick Fix Applied' as status,
    id,
    environment,
    settings->'general'->>'appName' as app_name,
    settings->'database'->>'tableName' as table_name,
    version
FROM app_settings
ORDER BY environment;