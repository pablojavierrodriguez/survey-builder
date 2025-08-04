-- =================================================================
-- FIXED DATABASE SCHEMA - NO ALTER TABLE NEEDED
-- =================================================================
-- This schema eliminates the need for dynamic ALTER TABLE operations
-- by having RLS enabled from the start with proper initial data

-- 1. CREATE APP SETTINGS TABLE WITH RLS ENABLED FROM START
-- =================================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Environment identification
    environment TEXT NOT NULL UNIQUE CHECK (environment IN ('dev', 'prod')),
    
    -- Database configuration
    survey_table_name TEXT NOT NULL,
    analytics_table_name TEXT,
    
    -- App configuration
    app_name TEXT NOT NULL,
    app_url TEXT,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    
    -- Feature flags
    enable_analytics BOOLEAN DEFAULT TRUE,
    enable_email_notifications BOOLEAN DEFAULT FALSE,
    enable_export BOOLEAN DEFAULT TRUE,
    
    -- Security settings
    session_timeout INTEGER DEFAULT 28800000, -- 8 hours in milliseconds
    max_login_attempts INTEGER DEFAULT 3,
    
    -- UI/UX settings
    theme_default TEXT DEFAULT 'system' CHECK (theme_default IN ('light', 'dark', 'system')),
    language_default TEXT DEFAULT 'en',
    
    -- Additional configuration
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    version TEXT DEFAULT '1.0.0'
);

-- Enable RLS immediately (no ALTER TABLE needed later)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 2. CREATE MAIN SURVEY DATA TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Survey Data Fields
    role TEXT,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT,
    daily_tools TEXT[],
    other_tool TEXT,
    learning_methods TEXT[],
    salary_currency TEXT DEFAULT 'USD',
    salary_min TEXT,
    salary_max TEXT,
    salary_average TEXT,
    email TEXT,
    
    -- Metadata
    session_id TEXT,
    source TEXT DEFAULT 'web',
    user_agent TEXT,
    ip_address INET
);

-- Enable RLS immediately
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;

-- 3. CREATE DEV SURVEY DATA TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data_dev (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Survey Data Fields (same as production)
    role TEXT,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT,
    daily_tools TEXT[],
    other_tool TEXT,
    learning_methods TEXT[],
    salary_currency TEXT DEFAULT 'USD',
    salary_min TEXT,
    salary_max TEXT,
    salary_average TEXT,
    email TEXT,
    
    -- Metadata
    session_id TEXT,
    source TEXT DEFAULT 'web',
    user_agent TEXT,
    ip_address INET
);

-- Enable RLS immediately
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- 4. CREATE PROFILES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS immediately
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREATE INDEXES
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_created_at ON pc_survey_data(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_email ON pc_survey_data(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_role ON pc_survey_data(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_company_size ON pc_survey_data(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_industry ON pc_survey_data(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_seniority ON pc_survey_data(seniority);

CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_email ON pc_survey_data_dev(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_company_size ON pc_survey_data_dev(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_seniority ON pc_survey_data_dev(seniority);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. INSERT INITIAL CONFIGURATION DATA
-- =================================================================
-- This eliminates the need for dynamic setup - data is pre-loaded
INSERT INTO app_settings (environment, survey_table_name, app_name, settings) 
VALUES (
    'dev',
    'pc_survey_data_dev',
    'Product Community Survey (DEV)',
    '{
        "database": {
            "tableName": "pc_survey_data_dev",
            "environment": "development"
        },
        "general": {
            "appName": "Product Community Survey (DEV)",
            "maintenanceMode": false,
            "analyticsEnabled": true,
            "debugMode": true
        }
    }'::jsonb
)
ON CONFLICT (environment) DO NOTHING;

-- 7. CREATE SECURE POLICIES
-- =================================================================
-- App settings - admin only
CREATE POLICY "app_settings_admin_access" ON app_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Survey data - public insert, admin read
CREATE POLICY "survey_data_public_insert" ON pc_survey_data
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "survey_data_admin_read" ON pc_survey_data
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Dev survey data - public insert, admin read
CREATE POLICY "survey_data_dev_public_insert" ON pc_survey_data_dev
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "survey_data_dev_admin_read" ON pc_survey_data_dev
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Profiles - users can read their own, admins can read all
CREATE POLICY "profiles_self_read" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "profiles_admin_read" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 8. CREATE HELPER FUNCTIONS
-- =================================================================
-- Function to update app settings (admin only)
CREATE OR REPLACE FUNCTION update_app_settings(
    target_environment TEXT,
    new_settings JSONB
)
RETURNS JSON 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized - admin access required'
        );
    END IF;

    -- Update settings
    UPDATE app_settings 
    SET 
        settings = new_settings,
        updated_at = NOW()
    WHERE environment = target_environment;

    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Settings updated successfully'
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Environment not found'
        );
    END IF;

    RETURN result;
END;
$$;

-- Function to get app settings
CREATE OR REPLACE FUNCTION get_app_settings(target_environment TEXT DEFAULT 'dev')
RETURNS JSON 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    settings_record RECORD;
    result JSON;
BEGIN
    SELECT * INTO settings_record
    FROM app_settings
    WHERE environment = target_environment;

    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'data', row_to_json(settings_record)
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Settings not found for environment: ' || target_environment
        );
    END IF;

    RETURN result;
END;
$$;

-- 9. GRANT PERMISSIONS
-- =================================================================
GRANT EXECUTE ON FUNCTION update_app_settings(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_app_settings(TEXT) TO authenticated;

-- 10. VERIFICATION
-- =================================================================
-- Check that everything is set up correctly
SELECT 
    'Tables created' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles')

UNION ALL

SELECT 
    'RLS enabled' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles')
AND rowsecurity = true

UNION ALL

SELECT 
    'Initial config loaded' as status,
    COUNT(*) as count
FROM app_settings 
WHERE environment = 'dev';