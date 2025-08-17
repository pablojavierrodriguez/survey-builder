-- Elegant RLS Policy Solution - FINAL VERSION
-- Allow access when no configuration exists (first-time setup)
-- Then restrict to admins only

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_wizard_and_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_elegant_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_backup_admin_access" ON public.app_settings_backup;

-- =====================================================
-- 2. CREATE ELEGANT POLICIES
-- =====================================================

-- Policy for app_settings - elegant solution
CREATE POLICY "app_settings_elegant_access" ON public.app_settings
    FOR ALL
    TO authenticated, anon
    USING (
        -- Allow if no settings exist yet (first-time setup)
        NOT EXISTS (SELECT 1 FROM public.app_settings)
        OR
        -- Allow if user is admin (after setup)
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
