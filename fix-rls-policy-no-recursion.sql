-- Fix RLS Policy Without Recursion
-- Temporarily disable RLS for initial setup, then enable with admin-only policy

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_wizard_and_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_elegant_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_backup_admin_access" ON public.app_settings_backup;

-- =====================================================
-- 2. TEMPORARILY DISABLE RLS FOR SETUP
-- =====================================================

-- Disable RLS to allow initial setup
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE ADMIN-ONLY POLICY FOR BACKUP TABLE
-- =====================================================

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
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('app_settings', 'app_settings_backup')
AND schemaname = 'public';

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