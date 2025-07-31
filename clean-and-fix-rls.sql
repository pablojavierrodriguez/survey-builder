-- =================================================================
-- CLEAN AND FIX RLS - COMPREHENSIVE SOLUTION
-- =================================================================
-- This script completely cleans all existing policies and applies
-- only simple, non-recursive policies

-- =================================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =================================================================

-- Drop ALL policies from profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Drop ALL policies from pc_survey_data_dev table
DROP POLICY IF EXISTS "Authenticated users can view survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can manage survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Authenticated users can insert survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can view all dev survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Collaborators can view dev survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Public can insert dev survey data" ON pc_survey_data_dev;

-- =================================================================
-- STEP 2: DISABLE RLS TEMPORARILY
-- =================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev DISABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 3: ENABLE RLS
-- =================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 4: CREATE ONLY SIMPLE POLICIES
-- =================================================================

-- PROFILES TABLE - SIMPLE POLICIES ONLY
-- Policy: Users can access their own profile
CREATE POLICY "Users can access own profile" ON profiles
    FOR ALL
    USING (auth.uid() = id);

-- Policy: Allow authenticated users to view all profiles (for admin purposes)
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- SURVEY DATA TABLE - SIMPLE POLICIES ONLY
-- Policy: All authenticated users can view survey data
CREATE POLICY "Authenticated users can view survey data" ON pc_survey_data_dev
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: All authenticated users can insert survey data
CREATE POLICY "Authenticated users can insert survey data" ON pc_survey_data_dev
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =================================================================
-- STEP 5: VERIFICATION
-- =================================================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'pc_survey_data_dev');

-- Check policies (should show only 4 policies total)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'pc_survey_data_dev')
ORDER BY tablename, policyname;

-- Test basic access
SELECT COUNT(*) as profiles_count FROM profiles;
SELECT COUNT(*) as survey_data_count FROM pc_survey_data_dev;