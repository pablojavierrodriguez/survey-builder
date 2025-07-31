-- TEMPORARY FIX: Disable RLS completely to test if that's causing session issues
-- This will allow all operations without restrictions

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on survey_data table  
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON survey_data TO authenticated;
GRANT ALL ON survey_data TO service_role;

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'survey_data');

-- Check if users can now access the tables
SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'survey_data' as table_name, count(*) as row_count FROM survey_data;