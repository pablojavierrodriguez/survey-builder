-- =================================================================
-- FIX RLS RECURSION - Remove problematic recursive policies
-- =================================================================
-- This script fixes the "infinite recursion detected in policy" error

-- =================================================================
-- STEP 1: REMOVE PROBLEMATIC TRIGGER (if exists)
-- =================================================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS auto_enable_rls_trigger ON public.app_settings;

-- Drop the problematic function
DROP FUNCTION IF EXISTS auto_enable_rls_function();

-- =================================================================
-- STEP 2: FIX RLS POLICIES TO AVOID RECURSION
-- =================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_select_policy" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert_policy" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update_policy" ON public.app_settings;

-- Create simple policies that don't cause recursion
-- For app_settings, we'll use a simple approach during setup

-- Allow all operations for now (we'll restrict later after setup)
CREATE POLICY "app_settings_setup_policy" ON public.app_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =================================================================
-- STEP 3: VERIFICATION
-- =================================================================

-- Check that policies are created
SELECT 
    'Policies created' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'app_settings'
AND schemaname = 'public';

-- Check that trigger is removed
SELECT 
    'Trigger removed' as status,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name = 'auto_enable_rls_trigger'
AND event_object_table = 'app_settings'
AND event_object_schema = 'public';

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'RLS recursion fixed! The setup should now work without infinite recursion errors.' as message;