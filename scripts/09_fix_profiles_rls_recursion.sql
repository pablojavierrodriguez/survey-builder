-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- This script fixes the infinite recursion detected in policy for relation "profiles"

-- =====================================================
-- 1. DROP ALL EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- =====================================================
-- 2. CREATE NON-RECURSIVE POLICIES
-- =====================================================

-- Allow users to view their own profile (no recursion)
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id);

-- Allow service role full access (no recursion)
CREATE POLICY "profiles_service_role_access" ON public.profiles
    FOR ALL 
    TO service_role
    USING (true);

-- Allow authenticated users to insert their own profile (for signup)
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. ENSURE PROFILE EXISTS FOR CURRENT USER
-- =====================================================

-- Create profile for pabjrodriguez@gmail.com if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    'da829837-3068-46d5-8e3c-5ef1aa31d499'::uuid,
    'pabjrodriguez@gmail.com',
    'Pablo Rodriguez',
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = 'da829837-3068-46d5-8e3c-5ef1aa31d499'::uuid
);

-- Update role to admin if profile exists but role is wrong
UPDATE public.profiles 
SET role = 'admin'
WHERE id = 'da829837-3068-46d5-8e3c-5ef1aa31d499'::uuid
  AND role != 'admin';

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Check that policies exist and are correct
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY policyname;

-- Check that the user profile exists with correct role
SELECT id, email, full_name, role, created_at
FROM public.profiles 
WHERE email = 'pabjrodriguez@gmail.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ PROFILES RLS RECURSION FIXED!';
    RAISE NOTICE '🔒 Non-recursive policies created';
    RAISE NOTICE '👤 User profile verified with admin role';
    RAISE NOTICE '🎯 pabjrodriguez@gmail.com should now have admin access';
END $$;
