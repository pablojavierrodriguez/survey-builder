-- TEMPORARY FIX: Disable RLS completely to test if that's causing session issues
-- This will allow all operations without restrictions

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on pc_survey_data_dev table (development table)
ALTER TABLE pc_survey_data_dev DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON pc_survey_data_dev TO authenticated;
GRANT ALL ON pc_survey_data_dev TO service_role;

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'pc_survey_data_dev');

-- Check if users can now access the tables
SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'pc_survey_data_dev' as table_name, count(*) as row_count FROM pc_survey_data_dev;