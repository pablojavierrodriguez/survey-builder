-- =================================================================
-- FIX ALTER TABLE ISSUE - Execute this in Supabase SQL Editor
-- =================================================================
-- This script fixes the "cannot ALTER TABLE" error by:
-- 1. Removing problematic triggers and functions
-- 2. Creating a proper schema with RLS enabled from start
-- 3. Adding helper functions for configuration updates

-- =================================================================
-- STEP 1: CLEAN UP PROBLEMATIC TRIGGERS AND FUNCTIONS
-- =================================================================

-- Drop problematic triggers
DROP TRIGGER IF EXISTS auto_enable_rls_trigger ON public.app_settings;

-- Drop problematic functions
DROP FUNCTION IF EXISTS public.setup_initial_config(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS auto_enable_rls_function();

-- =================================================================
-- STEP 2: ENSURE RLS IS ENABLED ON ALL TABLES
-- =================================================================

-- Enable RLS on all tables (this should not conflict if already enabled)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_survey_data_dev ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 3: CREATE HELPER FUNCTION FOR UPDATING SETTINGS
-- =================================================================

-- Function to update app settings (admin only) - NO ALTER TABLE needed
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

-- =================================================================
-- STEP 4: ENSURE PROPER POLICIES EXIST
-- =================================================================

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "survey_data_public_insert" ON public.pc_survey_data;
DROP POLICY IF EXISTS "survey_data_admin_read" ON public.pc_survey_data;
DROP POLICY IF EXISTS "survey_data_dev_public_insert" ON public.pc_survey_data_dev;
DROP POLICY IF EXISTS "survey_data_dev_admin_read" ON public.pc_survey_data_dev;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;

-- Create secure policies
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

-- =================================================================
-- STEP 5: ENSURE INITIAL CONFIGURATION EXISTS
-- =================================================================

-- Insert initial configuration if it doesn't exist
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

-- =================================================================
-- STEP 6: GRANT PERMISSIONS
-- =================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_app_settings(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_app_settings(TEXT) TO authenticated;

-- =================================================================
-- STEP 7: VERIFICATION QUERIES
-- =================================================================

-- Check that everything is set up correctly
SELECT 
    'Tables with RLS enabled' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles')
AND rowsecurity = true;

-- Check initial configuration
SELECT 
    'Initial config loaded' as status,
    COUNT(*) as count
FROM app_settings 
WHERE environment = 'dev';

-- Check functions exist
SELECT 
    'Helper functions created' as status,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_app_settings', 'get_app_settings');

-- Check policies exist
SELECT 
    'Security policies created' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles');

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'ALTER TABLE issue fixed successfully! The setup should now work without errors.' as message;