-- Enable RLS After Initial Setup
-- Run this AFTER the wizard has completed the initial configuration

-- =====================================================
-- 1. ENABLE RLS ON APP_SETTINGS
-- =====================================================

-- Enable RLS on app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE SECURE POLICY FOR APP_SETTINGS
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;

-- Create policy for app_settings - only admins can access
CREATE POLICY "app_settings_admin_access" ON public.app_settings
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

-- Check RLS is enabled
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