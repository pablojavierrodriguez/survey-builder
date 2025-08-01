-- =================================================================
-- SIMPLE FIX: ADD ENVIRONMENT COLUMN
-- =================================================================
-- This script just adds the environment column to the existing table

-- Add environment column if it doesn't exist
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'dev';

-- Update existing records to have environment = 'dev'
UPDATE app_settings SET environment = 'dev' WHERE environment IS NULL;

-- Make environment column NOT NULL
ALTER TABLE app_settings ALTER COLUMN environment SET NOT NULL;

-- Add unique constraint on environment
ALTER TABLE app_settings ADD CONSTRAINT IF NOT EXISTS app_settings_environment_key UNIQUE (environment);

-- Verify the fix
SELECT 
    'Environment column added' as status,
    id,
    environment,
    settings->'general'->>'appName' as app_name,
    version
FROM app_settings
ORDER BY environment;