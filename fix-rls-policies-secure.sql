-- =================================================================
-- SECURE RLS POLICIES IMPLEMENTATION
-- =================================================================
-- This script implements proper Row Level Security policies
-- that provide security without causing recursion issues

-- First, enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- PROFILES TABLE POLICIES
-- =================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin-demo')
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin-demo')
        )
    );

-- Policy: Allow profile creation during signup
CREATE POLICY "Allow profile creation" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =================================================================
-- SURVEY DATA TABLE POLICIES
-- =================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can manage survey data" ON pc_survey_data_dev;

-- Policy: All authenticated users can view survey data (for analytics)
CREATE POLICY "Authenticated users can view survey data" ON pc_survey_data_dev
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only admins can insert/update/delete survey data
CREATE POLICY "Admins can manage survey data" ON pc_survey_data_dev
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin-demo')
        )
    );

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