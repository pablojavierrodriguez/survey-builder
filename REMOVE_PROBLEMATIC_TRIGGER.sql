-- =================================================================
-- REMOVE PROBLEMATIC TRIGGER - Simple fix for ALTER TABLE issue
-- =================================================================
-- This script only removes the problematic trigger that causes
-- "cannot ALTER TABLE because it is being used by active queries"

-- =================================================================
-- STEP 1: REMOVE PROBLEMATIC TRIGGER AND FUNCTION
-- =================================================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS auto_enable_rls_trigger ON public.app_settings;

-- Drop the problematic function
DROP FUNCTION IF EXISTS auto_enable_rls_function();

-- =================================================================
-- STEP 2: VERIFICATION
-- =================================================================

-- Check that trigger is removed
SELECT 
    'Trigger removed' as status,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name = 'auto_enable_rls_trigger'
AND event_object_table = 'app_settings'
AND event_object_schema = 'public';

-- Check that function is removed
SELECT 
    'Function removed' as status,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'auto_enable_rls_function';

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'Problematic trigger removed successfully! The setup should now work without ALTER TABLE errors.' as message;