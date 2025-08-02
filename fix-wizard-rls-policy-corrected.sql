-- Fix Wizard RLS Policy Issue - CORRECTED VERSION
-- This script allows the wizard to save initial configuration

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_wizard_and_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_backup_admin_access" ON public.app_settings_backup;

-- =====================================================
-- 2. CREATE NEW POLICIES THAT ALLOW WIZARD ACCESS
-- =====================================================

-- Policy for app_settings - allow initial setup and admin access
CREATE POLICY "app_settings_wizard_and_admin_access" ON public.app_settings
    FOR ALL
    TO authenticated, anon
    USING (
        -- Allow if no settings exist yet (wizard setup)
        (SELECT COUNT(*) FROM public.app_settings) = 0
        OR
        -- Allow if user is admin
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for app_settings_backup - only admins can access
CREATE POLICY "app_settings_backup_admin_access" ON public.app_settings_backup
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Check policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('app_settings', 'app_settings_backup')
AND schemaname = 'public';

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('app_settings', 'app_settings_backup')
AND schemaname = 'public';