-- Performance Optimized Database Functions
-- These functions provide optimized data retrieval for analytics

-- =====================================================
-- ANALYTICS DATA FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_analytics_data(
  table_name TEXT,
  page_limit INTEGER DEFAULT 50,
  page_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- PAGINATED DATA FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_paginated_survey_data(
  table_name TEXT,
  page_limit INTEGER DEFAULT 50,
  page_offset INTEGER DEFAULT 0,
  filters JSON DEFAULT '{}'::json
)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- QUICK STATS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_quick_stats(table_name TEXT)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the functions
-- SELECT get_quick_stats('pc_survey_data_dev');
-- SELECT get_analytics_data('pc_survey_data_dev', 10, 0);
-- SELECT get_paginated_survey_data('pc_survey_data_dev', 10, 0, '{"role": "developer"}'::json);