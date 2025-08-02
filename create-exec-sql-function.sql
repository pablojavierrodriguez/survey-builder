-- Create exec_sql function for setup automation
-- This function allows the setup process to manage RLS automatically

-- =====================================================
-- 1. CREATE EXEC_SQL FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.exec_sql(TEXT);

-- Create function to execute SQL commands
CREATE OR REPLACE FUNCTION public.exec_sql(sql_command TEXT)
RETURNS VOID 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow specific SQL commands for setup
  IF sql_command LIKE 'ALTER TABLE public.app_settings%' OR
     sql_command LIKE 'DROP POLICY%' OR
     sql_command LIKE 'CREATE POLICY%' THEN
    
    EXECUTE sql_command;
  ELSE
    RAISE EXCEPTION 'Unauthorized SQL command: %', sql_command;
  END IF;
END;
$$;

-- =====================================================
-- 2. GRANT EXECUTE PERMISSION
-- =====================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;

-- =====================================================
-- 3. VERIFICATION QUERY
-- =====================================================

-- Check function exists
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'exec_sql';