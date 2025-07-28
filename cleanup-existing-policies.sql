-- =================================================================
-- CLEANUP EXISTING POLICIES
-- =================================================================
-- Run this script first if you get policy conflicts
-- =================================================================

-- Drop existing policies for app_settings
DROP POLICY IF EXISTS "Public can read app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;

-- Drop existing policies for pc_survey_data
DROP POLICY IF EXISTS "Public can insert survey data" ON pc_survey_data;
DROP POLICY IF EXISTS "Admins can view all survey data" ON pc_survey_data;
DROP POLICY IF EXISTS "Collaborators can view survey data" ON pc_survey_data;
DROP POLICY IF EXISTS "Enable read access for all users" ON pc_survey_data;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON pc_survey_data;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON pc_survey_data;

-- Drop existing policies for pc_survey_data_dev
DROP POLICY IF EXISTS "Public can insert dev survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can view all dev survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Collaborators can view dev survey data" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Enable read access for all users" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON pc_survey_data_dev;

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- List remaining policies (for verification)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles')
ORDER BY tablename, policyname;