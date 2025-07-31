-- =================================================================
-- CREATE APP_SETTINGS TABLE
-- =================================================================
-- This script creates the app_settings table needed for admin settings

-- =================================================================
-- STEP 1: CREATE TABLE
-- =================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    environment TEXT DEFAULT 'dev',
    survey_table_name TEXT DEFAULT 'pc_survey_data_dev',
    analytics_table_name TEXT,
    app_name TEXT DEFAULT 'Product Community Survey',
    app_url TEXT,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    enable_analytics BOOLEAN DEFAULT TRUE,
    enable_email_notifications BOOLEAN DEFAULT FALSE,
    enable_export BOOLEAN DEFAULT TRUE,
    session_timeout INTEGER DEFAULT 28800000,
    max_login_attempts INTEGER DEFAULT 20,
    theme_default TEXT DEFAULT 'system',
    language_default TEXT DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    description TEXT,
    version TEXT DEFAULT '1.0.0'
);

-- =================================================================
-- STEP 2: CREATE INDEXES
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);
CREATE INDEX IF NOT EXISTS idx_app_settings_created_at ON app_settings(created_at);

-- =================================================================
-- STEP 3: INSERT DEFAULT SETTINGS
-- =================================================================

INSERT INTO app_settings (
    id,
    environment,
    survey_table_name,
    app_name,
    app_url,
    maintenance_mode,
    enable_analytics,
    enable_email_notifications,
    enable_export,
    session_timeout,
    max_login_attempts,
    theme_default,
    language_default,
    settings,
    description,
    version
) VALUES (
    1,
    'dev',
    'pc_survey_data_dev',
    'Product Community Survey (DEV)',
    'https://productcommunitysurvey-dev.vercel.app',
    FALSE,
    TRUE,
    FALSE,
    TRUE,
    28800000,
    20,
    'system',
    'en',
    '{"supabase_url": "", "supabase_anon_key": "", "require_https": true, "enable_rate_limit": true, "enforce_strong_passwords": false, "enable_two_factor": false, "admin_email": "", "response_threshold": 10}',
    'Development environment configuration',
    '1.0.0'
) ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- STEP 4: VERIFICATION
-- =================================================================

-- Check if table was created
SELECT 
    'Table created successfully' as status,
    COUNT(*) as settings_count
FROM app_settings;

-- Show sample data
SELECT 
    id,
    environment,
    survey_table_name,
    app_name,
    maintenance_mode,
    enable_analytics,
    created_at
FROM app_settings
ORDER BY created_at DESC
LIMIT 3;