-- Create Automatic RLS Trigger
-- Enables RLS automatically after first configuration is saved

-- =====================================================
-- 1. DROP EXISTING TRIGGERS AND FUNCTIONS
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS auto_enable_rls_trigger ON public.app_settings;
DROP FUNCTION IF EXISTS auto_enable_rls_function();

-- =====================================================
-- 2. CREATE FUNCTION TO ENABLE RLS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_enable_rls_function()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Check if this is the first record being inserted
  IF TG_OP = 'INSERT' THEN
    -- Enable RLS on app_settings
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create admin-only policy
    DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
    
    CREATE POLICY "app_settings_admin_access" ON public.app_settings
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
      
    -- Log the action
    RAISE NOTICE 'RLS enabled automatically after first configuration';
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. CREATE TRIGGER
-- =====================================================

-- Create trigger that fires after INSERT
CREATE TRIGGER auto_enable_rls_trigger
  AFTER INSERT ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_enable_rls_function();

-- =====================================================
-- 4. INITIAL SETUP - DISABLE RLS FOR FIRST CONFIG
-- =====================================================

-- Disable RLS initially to allow first configuration
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_enable_rls_trigger'
AND event_object_table = 'app_settings'
AND event_object_schema = 'public';

-- Check function exists
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'auto_enable_rls_function';

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'app_settings'
AND schemaname = 'public';