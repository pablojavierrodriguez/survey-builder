-- Create setup function to handle initial configuration
-- This function bypasses RLS issues during setup

-- =====================================================
-- 1. CREATE SETUP FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.setup_initial_config(TEXT, TEXT, TEXT, TEXT);

-- Create function to handle initial setup
CREATE OR REPLACE FUNCTION public.setup_initial_config(
  supabase_url TEXT,
  supabase_key TEXT,
  public_url TEXT DEFAULT NULL,
  app_name TEXT DEFAULT NULL
)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Temporarily disable RLS for app_settings
  ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
  
  -- Insert or update configuration
  INSERT INTO public.app_settings (environment, settings)
  VALUES ('dev', json_build_object(
    'database', json_build_object(
      'url', supabase_url,
      'apiKey', supabase_key,
      'tableName', 'pc_survey_data_dev',
      'environment', 'development'
    ),
    'general', json_build_object(
      'appName', COALESCE(app_name, 'Product Community Survey (DEV)'),
      'publicUrl', COALESCE(public_url, 'https://productcommunitysurvey-dev.vercel.app'),
      'maintenanceMode', false,
      'analyticsEnabled', true
    )
  ))
  ON CONFLICT (environment) 
  DO UPDATE SET 
    settings = EXCLUDED.settings,
    updated_at = NOW();
  
  -- Re-enable RLS
  ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
  
  -- Create secure policy
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
  
  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'Configuración inicial completada exitosamente'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable RLS in case of error
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    
    RETURN result;
END;
$$;

-- =====================================================
-- 2. GRANT EXECUTE PERMISSION
-- =====================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.setup_initial_config(TEXT, TEXT, TEXT, TEXT) TO authenticated;

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
AND routine_name = 'setup_initial_config';