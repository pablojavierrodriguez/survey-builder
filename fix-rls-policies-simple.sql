-- =================================================================
-- SIMPLE RLS POLICIES - NO RECURSION
-- =================================================================
-- This script implements simple RLS policies that avoid recursion
-- by not querying the profiles table from within policies

-- First, enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- PROFILES TABLE POLICIES - SIMPLE APPROACH
-- =================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Simple policy: Users can only access their own profile
CREATE POLICY "Users can access own profile" ON profiles
    FOR ALL
    USING (auth.uid() = id);

-- Simple policy: Allow authenticated users to view all profiles (for admin purposes)
-- This is a temporary solution to avoid recursion while maintaining basic security
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- =================================================================
-- SURVEY DATA TABLE POLICIES - SIMPLE APPROACH
-- =================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can manage survey data" ON pc_survey_data_dev;

-- Simple policy: All authenticated users can view survey data
CREATE POLICY "Authenticated users can view survey data" ON pc_survey_data_dev
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Simple policy: All authenticated users can insert survey data (for form submissions)
CREATE POLICY "Authenticated users can insert survey data" ON pc_survey_data_dev
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'pc_survey_data_dev');

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'pc_survey_data_dev')
ORDER BY tablename, policyname;

-- Test basic access
SELECT COUNT(*) as profiles_count FROM profiles;
SELECT COUNT(*) as survey_data_count FROM pc_survey_data_dev;