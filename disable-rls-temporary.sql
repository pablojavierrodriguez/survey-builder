-- =================================================================
-- TEMPORARY RLS DISABLE - QUICK FIX
-- =================================================================
-- This script temporarily disables RLS to get the app working
-- WARNING: This removes security, use only for development/testing

-- Disable RLS on both tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can manage survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Authenticated users can insert survey data" ON pc_survey_data_dev;

-- =================================================================
-- VERIFICATION
-- =================================================================

-- Check RLS status (should show rowsecurity = false)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'pc_survey_data_dev');

-- Test access (should work without errors)
SELECT COUNT(*) as profiles_count FROM profiles;
SELECT COUNT(*) as survey_data_count FROM pc_survey_data_dev;

-- Check if any policies remain (should be empty)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('profiles', 'pc_survey_data_dev');