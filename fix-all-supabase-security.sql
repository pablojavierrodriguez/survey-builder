-- Fix All Supabase Security Issues
-- This script addresses all security linter errors and warnings

-- =====================================================
-- 1. FIX AUTH USERS EXPOSED - Remove problematic view
-- =====================================================

-- Drop the problematic user_management view that exposes auth.users
DROP VIEW IF EXISTS public.user_management;

-- =====================================================
-- 2. FIX RLS DISABLED - Enable RLS on app_settings tables
-- =====================================================

-- Enable RLS on app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on app_settings_backup table
ALTER TABLE public.app_settings_backup ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE SECURE RLS POLICIES FOR APP_SETTINGS
-- =====================================================

-- Policy for app_settings - only admins can read/write
CREATE POLICY "app_settings_admin_access" ON public.app_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for app_settings_backup - only admins can read/write
CREATE POLICY "app_settings_backup_admin_access" ON public.app_settings_backup
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 4. CREATE SECURE USER MANAGEMENT FUNCTION
-- =====================================================

-- Create a secure function to replace the problematic view
CREATE OR REPLACE FUNCTION public.get_user_management_data()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;

    RETURN QUERY
    SELECT 
        au.id as user_id,
        au.email,
        p.role,
        au.created_at,
        au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE au.id IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin role)
GRANT EXECUTE ON FUNCTION public.get_user_management_data() TO authenticated;

-- =====================================================
-- 5. FIX FUNCTION SEARCH PATH MUTABLE WARNINGS
-- =====================================================

-- Fix get_analytics_data function
CREATE OR REPLACE FUNCTION public.get_analytics_data(
  table_name TEXT,
  page_limit INTEGER DEFAULT 50,
  page_offset INTEGER DEFAULT 0
)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
  total_count INTEGER;
  role_dist JSON;
  seniority_dist JSON;
  company_dist JSON;
  industry_dist JSON;
  tools_usage JSON;
  learning_methods JSON;
  recent_responses JSON;
BEGIN
  -- Get total count
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO total_count;
  
  -- Get role distribution
  EXECUTE format('
    SELECT json_object_agg(role, count) as distribution
    FROM (
      SELECT role, COUNT(*) as count
      FROM %I
      WHERE role IS NOT NULL
      GROUP BY role
      ORDER BY count DESC
    ) t
  ', table_name) INTO role_dist;
  
  -- Get seniority distribution
  EXECUTE format('
    SELECT json_object_agg(seniority, count) as distribution
    FROM (
      SELECT seniority, COUNT(*) as count
      FROM %I
      WHERE seniority IS NOT NULL
      GROUP BY seniority
      ORDER BY count DESC
    ) t
  ', table_name) INTO seniority_dist;
  
  -- Get company type distribution
  EXECUTE format('
    SELECT json_object_agg(company_type, count) as distribution
    FROM (
      SELECT company_type, COUNT(*) as count
      FROM %I
      WHERE company_type IS NOT NULL
      GROUP BY company_type
      ORDER BY count DESC
    ) t
  ', table_name) INTO company_dist;
  
  -- Get industry distribution
  EXECUTE format('
    SELECT json_object_agg(industry, count) as distribution
    FROM (
      SELECT industry, COUNT(*) as count
      FROM %I
      WHERE industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
    ) t
  ', table_name) INTO industry_dist;
  
  -- Get tools usage (flattened from arrays)
  EXECUTE format('
    SELECT json_object_agg(tool, count) as distribution
    FROM (
      SELECT unnest(daily_tools) as tool, COUNT(*) as count
      FROM %I
      WHERE daily_tools IS NOT NULL AND array_length(daily_tools, 1) > 0
      GROUP BY tool
      ORDER BY count DESC
    ) t
  ', table_name) INTO tools_usage;
  
  -- Get learning methods (flattened from arrays)
  EXECUTE format('
    SELECT json_object_agg(method, count) as distribution
    FROM (
      SELECT unnest(learning_methods) as method, COUNT(*) as count
      FROM %I
      WHERE learning_methods IS NOT NULL AND array_length(learning_methods, 1) > 0
      GROUP BY method
      ORDER BY count DESC
    ) t
  ', table_name) INTO learning_methods;
  
  -- Get recent responses (paginated)
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''id'', id,
        ''created_at'', created_at,
        ''role'', role,
        ''seniority'', seniority,
        ''company_type'', company_type,
        ''industry'', industry,
        ''email'', email
      )
    ) as responses
    FROM (
      SELECT id, created_at, role, seniority, company_type, industry, email
      FROM %I
      ORDER BY created_at DESC
      LIMIT %s OFFSET %s
    ) t
  ', table_name, page_limit, page_offset) INTO recent_responses;
  
  -- Build final result
  result := json_build_object(
    'totalResponses', total_count,
    'roleDistribution', COALESCE(role_dist, '{}'::json),
    'seniorityDistribution', COALESCE(seniority_dist, '{}'::json),
    'companyDistribution', COALESCE(company_dist, '{}'::json),
    'industryDistribution', COALESCE(industry_dist, '{}'::json),
    'toolsUsage', COALESCE(tools_usage, '{}'::json),
    'learningMethods', COALESCE(learning_methods, '{}'::json),
    'recentResponses', COALESCE(recent_responses, '[]'::json),
    'pagination', json_build_object(
      'page', (page_offset / page_limit) + 1,
      'limit', page_limit,
      'total', total_count,
      'totalPages', CEIL(total_count::float / page_limit)
    )
  );
  
  RETURN result;
END;
$$;

-- Fix get_paginated_survey_data function
CREATE OR REPLACE FUNCTION public.get_paginated_survey_data(
  table_name TEXT,
  page_limit INTEGER DEFAULT 50,
  page_offset INTEGER DEFAULT 0,
  filters JSON DEFAULT '{}'::json
)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
  total_count INTEGER;
  where_clause TEXT := '';
  filter_conditions TEXT[] := ARRAY[]::TEXT[];
  filter_key TEXT;
  filter_value TEXT;
BEGIN
  -- Build WHERE clause from filters
  FOR filter_key, filter_value IN SELECT * FROM json_each_text(filters)
  LOOP
    filter_conditions := array_append(filter_conditions, 
      format('%I = %L', filter_key, filter_value));
  END LOOP;
  
  IF array_length(filter_conditions, 1) > 0 THEN
    where_clause := 'WHERE ' || array_to_string(filter_conditions, ' AND ');
  END IF;
  
  -- Get total count with filters
  EXECUTE format('SELECT COUNT(*) FROM %I %s', table_name, where_clause) INTO total_count;
  
  -- Get paginated data
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''id'', id,
        ''created_at'', created_at,
        ''updated_at'', updated_at,
        ''role'', role,
        ''other_role'', other_role,
        ''seniority'', seniority,
        ''company_type'', company_type,
        ''company_size'', company_size,
        ''industry'', industry,
        ''product_type'', product_type,
        ''customer_segment'', customer_segment,
        ''main_challenge'', main_challenge,
        ''daily_tools'', daily_tools,
        ''other_tool'', other_tool,
        ''learning_methods'', learning_methods,
        ''salary_currency'', salary_currency,
        ''salary_min'', salary_min,
        ''salary_max'', salary_max,
        ''salary_average'', salary_average,
        ''email'', email,
        ''session_id'', session_id,
        ''source'', source,
        ''user_agent'', user_agent,
        ''ip_address'', ip_address
      )
    ) as data
    FROM (
      SELECT *
      FROM %I
      %s
      ORDER BY created_at DESC
      LIMIT %s OFFSET %s
    ) t
  ', table_name, where_clause, page_limit, page_offset) INTO result;
  
  -- Return result with pagination info
  RETURN json_build_object(
    'data', COALESCE(result, '[]'::json),
    'pagination', json_build_object(
      'page', (page_offset / page_limit) + 1,
      'limit', page_limit,
      'total', total_count,
      'totalPages', CEIL(total_count::float / page_limit)
    )
  );
END;
$$;

-- Fix get_quick_stats function
CREATE OR REPLACE FUNCTION public.get_quick_stats(table_name TEXT)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
  total_responses INTEGER;
  today_responses INTEGER;
  this_week_responses INTEGER;
  this_month_responses INTEGER;
BEGIN
  -- Get total responses
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO total_responses;
  
  -- Get today's responses
  EXECUTE format('
    SELECT COUNT(*) FROM %I 
    WHERE DATE(created_at) = CURRENT_DATE
  ', table_name) INTO today_responses;
  
  -- Get this week's responses
  EXECUTE format('
    SELECT COUNT(*) FROM %I 
    WHERE created_at >= DATE_TRUNC(''week'', CURRENT_DATE)
  ', table_name) INTO this_week_responses;
  
  -- Get this month's responses
  EXECUTE format('
    SELECT COUNT(*) FROM %I 
    WHERE created_at >= DATE_TRUNC(''month'', CURRENT_DATE)
  ', table_name) INTO this_month_responses;
  
  result := json_build_object(
    'totalResponses', total_responses,
    'todayResponses', today_responses,
    'thisWeekResponses', this_week_responses,
    'thisMonthResponses', this_month_responses
  );
  
  RETURN result;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Fix update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only allow admins to update user roles
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE profiles.user_id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Fix get_app_settings function
CREATE OR REPLACE FUNCTION public.get_app_settings(env TEXT DEFAULT 'dev')
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  SELECT settings INTO result
  FROM public.app_settings
  WHERE environment = env;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Fix get_survey_stats function
CREATE OR REPLACE FUNCTION public.get_survey_stats(table_name TEXT)
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_build_object(
      ''total_responses'', COUNT(*),
      ''unique_emails'', COUNT(DISTINCT email),
      ''avg_salary'', AVG(salary_average),
      ''top_roles'', (
        SELECT json_agg(role_count)
        FROM (
          SELECT json_build_object(''role'', role, ''count'', COUNT(*)) as role_count
          FROM %I
          WHERE role IS NOT NULL
          GROUP BY role
          ORDER BY COUNT(*) DESC
          LIMIT 5
        ) t
      )
    )
    FROM %I
  ', table_name, table_name) INTO result;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Fix get_survey_stats_dev function
CREATE OR REPLACE FUNCTION public.get_survey_stats_dev()
RETURNS JSON 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN get_survey_stats('pc_survey_data_dev');
END;
$$;

-- =====================================================
-- 6. GRANT EXECUTE PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_analytics_data(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_paginated_survey_data(TEXT, INTEGER, INTEGER, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quick_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_settings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_survey_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_survey_stats_dev() TO authenticated;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('app_settings', 'app_settings_backup')
AND schemaname = 'public';

-- Check policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('app_settings', 'app_settings_backup')
AND schemaname = 'public';

-- Check if problematic view is gone
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE viewname = 'user_management'
AND schemaname = 'public';

-- Check functions have search_path set
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_analytics_data',
    'get_paginated_survey_data', 
    'get_quick_stats',
    'handle_new_user',
    'update_user_role',
    'get_app_settings',
    'get_survey_stats',
    'get_survey_stats_dev',
    'get_user_management_data'
);