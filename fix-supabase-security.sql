-- Fix Supabase Security Issues
-- This script addresses all security linter errors

-- =====================================================
-- 1. FIX AUTH USERS EXPOSED - Remove problematic view
-- =====================================================

-- Drop the problematic user_management view that exposes auth.users
DROP VIEW IF EXISTS public.user_management;

-- =====================================================
-- 2. FIX RLS DISABLED - Enable RLS on app_settings tables
-- =====================================================

-- Enable RLS on app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on app_settings_backup table
ALTER TABLE public.app_settings_backup ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE SECURE RLS POLICIES FOR APP_SETTINGS
-- =====================================================

-- Policy for app_settings - only admins can read/write
CREATE POLICY "app_settings_admin_access" ON public.app_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for app_settings_backup - only admins can read/write
CREATE POLICY "app_settings_backup_admin_access" ON public.app_settings_backup
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 4. CREATE SECURE USER MANAGEMENT FUNCTION (OPTIONAL)
-- =====================================================

-- If you need user management functionality, create a secure function instead of a view
CREATE OR REPLACE FUNCTION public.get_user_management_data()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;

    RETURN QUERY
    SELECT 
        au.id as user_id,
        au.email,
        p.role,
        au.created_at,
        au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE au.id IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin role)
GRANT EXECUTE ON FUNCTION public.get_user_management_data() TO authenticated;

-- =====================================================
-- 5. VERIFICATION QUERIES
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

-- Check if problematic view is gone
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE viewname = 'user_management'
AND schemaname = 'public';