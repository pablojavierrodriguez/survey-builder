-- =================================================================
-- TEST AUTH POLICIES - DIAGNOSE SESSION ISSUE
-- =================================================================
-- This script tests if the auth policies are working correctly

-- =================================================================
-- STEP 1: CHECK CURRENT POLICIES
-- =================================================================

-- Check current policies on profiles table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =================================================================
-- STEP 2: TEST POLICY LOGIC
-- =================================================================

-- Check if we can query profiles table (this should work for any authenticated user)
-- Note: Run this as an authenticated user
SELECT 
    'Can query profiles' as test,
    COUNT(*) as result
FROM profiles;

-- Check specific user profile (replace with actual user ID)
-- This should work for the user's own profile
SELECT 
    'User profile exists' as test,
    COUNT(*) as result
FROM profiles 
WHERE id = '1f41c68b-b7bd-43db-9e30-44f1a85c84d5';

-- =================================================================
-- STEP 3: SIMPLIFY PROFILES POLICIES
-- =================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create very simple policy: Allow all authenticated users to access profiles
CREATE POLICY "Allow all authenticated users" ON profiles
    FOR ALL
    USING (auth.role() = 'authenticated');

-- =================================================================
-- STEP 4: VERIFICATION
-- =================================================================

-- Check new policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test access again
SELECT 
    'After fix - Can query profiles' as test,
    COUNT(*) as result
FROM profiles;