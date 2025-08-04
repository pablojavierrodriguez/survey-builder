-- =================================================================
-- CLEAN DATABASE - Remove all conflicting policies and triggers
-- =================================================================
-- This script cleans up all the conflicting SQL files and policies
-- that have been created over multiple iterations

-- =================================================================
-- STEP 1: REMOVE ALL PROBLEMATIC TRIGGERS
-- =================================================================

-- Remove all triggers that might cause issues
DROP TRIGGER IF EXISTS auto_enable_rls_trigger ON public.app_settings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =================================================================
-- STEP 2: REMOVE ALL PROBLEMATIC FUNCTIONS
-- =================================================================

-- Remove functions that might cause recursion
DROP FUNCTION IF EXISTS auto_enable_rls_function() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.setup_initial_config(TEXT, TEXT, TEXT, TEXT) CASCADE;

-- =================================================================
-- STEP 3: REMOVE ALL CONFLICTING POLICIES
-- =================================================================

-- Remove all policies from app_settings
DROP POLICY IF EXISTS "Public can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_elegant_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_setup_policy" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_backup_admin_access" ON public.app_settings_backup;

-- Remove all policies from survey tables
DROP POLICY IF EXISTS "Public can insert survey data" ON public.pc_survey_data;
DROP POLICY IF EXISTS "Admins can view all survey data" ON public.pc_survey_data;
DROP POLICY IF EXISTS "Collaborators can view survey data" ON public.pc_survey_data;
DROP POLICY IF EXISTS "Public can insert dev survey data" ON public.pc_survey_data_dev;
DROP POLICY IF EXISTS "Admins can view all dev survey data" ON public.pc_survey_data_dev;
DROP POLICY IF EXISTS "Collaborators can view dev survey data" ON public.pc_survey_data_dev;

-- Remove all policies from profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- =================================================================
-- STEP 4: DISABLE RLS TEMPORARILY FOR SETUP
-- =================================================================

-- Disable RLS on all tables to allow setup
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_survey_data_dev DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 5: VERIFICATION
-- =================================================================

-- Check that all policies are removed
SELECT 
    'Policies removed' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles');

-- Check that triggers are removed
SELECT 
    'Triggers removed' as status,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles');

-- Check RLS status
SELECT 
    'RLS disabled' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles')
AND rowsecurity = false;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'Database cleaned successfully! RLS disabled for setup. No more recursion or conflicts.' as message;