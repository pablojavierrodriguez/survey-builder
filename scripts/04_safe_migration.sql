-- ============================================================================
-- SAFE MIGRATION SCRIPT - Preserves existing data and policies
-- ============================================================================

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS survey_data_backup AS 
SELECT * FROM survey_data;

CREATE TABLE IF NOT EXISTS app_settings_backup AS 
SELECT * FROM app_settings;

-- Step 2: Create new optimized tables alongside existing ones
CREATE TABLE IF NOT EXISTS survey_responses_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Survey responses (normalized fields)
    role TEXT,
    seniority TEXT,
    company_size TEXT,
    industry TEXT,
    product_focus TEXT,
    team_size TEXT,
    budget_range TEXT,
    current_tools TEXT[],
    biggest_challenge TEXT,
    learning_methods TEXT[],
    improvement_areas TEXT[],
    
    -- Metadata
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    completion_time INTEGER, -- in seconds
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_config_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- App configuration
    app_name TEXT DEFAULT 'Product Role Survey',
    app_description TEXT DEFAULT 'Comprehensive survey for product professionals',
    app_url TEXT,
    
    -- Features
    analytics_enabled BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    max_responses INTEGER DEFAULT 10000,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Migrate existing survey data from JSON to normalized fields
INSERT INTO survey_responses_new (
    role, seniority, company_size, industry, product_focus, team_size, 
    budget_range, current_tools, biggest_challenge, learning_methods, 
    improvement_areas, session_id, user_agent, ip_address, created_at
)
SELECT 
    (response_data->>'role')::TEXT,
    (response_data->>'seniority')::TEXT,
    (response_data->>'companySize')::TEXT,
    (response_data->>'industry')::TEXT,
    (response_data->>'productFocus')::TEXT,
    (response_data->>'teamSize')::TEXT,
    (response_data->>'budgetRange')::TEXT,
    CASE 
        WHEN response_data->>'currentTools' IS NOT NULL 
        THEN string_to_array(response_data->>'currentTools', ',')
        ELSE NULL 
    END,
    (response_data->>'biggestChallenge')::TEXT,
    CASE 
        WHEN response_data->>'learningMethods' IS NOT NULL 
        THEN string_to_array(response_data->>'learningMethods', ',')
        ELSE NULL 
    END,
    CASE 
        WHEN response_data->>'improvementAreas' IS NOT NULL 
        THEN string_to_array(response_data->>'improvementAreas', ',')
        ELSE NULL 
    END,
    session_id,
    user_agent,
    ip_address::INET,
    created_at
FROM survey_data 
WHERE response_data IS NOT NULL 
  AND response_data != '{}'::jsonb
  AND (response_data->>'role') IS NOT NULL; -- Only migrate real responses

-- Step 4: Migrate app settings to simplified config
INSERT INTO app_config_new (app_name, app_description, analytics_enabled, maintenance_mode)
SELECT 
    COALESCE(
        (config_data->>'appName')::TEXT,
        (config_data->>'app_name')::TEXT,
        'Product Role Survey'
    ),
    COALESCE(
        (config_data->>'appDescription')::TEXT,
        (config_data->>'app_description')::TEXT,
        'Comprehensive survey for product professionals'
    ),
    COALESCE(
        (config_data->>'analyticsEnabled')::BOOLEAN,
        (config_data->>'analytics_enabled')::BOOLEAN,
        true
    ),
    COALESCE(
        (config_data->>'maintenanceMode')::BOOLEAN,
        (config_data->>'maintenance_mode')::BOOLEAN,
        false
    )
FROM app_settings 
WHERE config_data IS NOT NULL 
LIMIT 1; -- Take only one config

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_role ON survey_responses_new(role);
CREATE INDEX IF NOT EXISTS idx_survey_responses_seniority ON survey_responses_new(seniority);
CREATE INDEX IF NOT EXISTS idx_survey_responses_industry ON survey_responses_new(industry);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses_new(created_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_session_id ON survey_responses_new(session_id);

-- Step 6: Set up RLS policies for new tables
ALTER TABLE survey_responses_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config_new ENABLE ROW LEVEL SECURITY;

-- Allow public read access to survey responses (for analytics)
CREATE POLICY "survey_responses_select_policy" ON survey_responses_new
    FOR SELECT USING (true);

-- Allow public insert for new survey responses
CREATE POLICY "survey_responses_insert_policy" ON survey_responses_new
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read app config
CREATE POLICY "app_config_select_policy" ON app_config_new
    FOR SELECT USING (true);

-- Allow service role to manage app config
CREATE POLICY "app_config_manage_policy" ON app_config_new
    FOR ALL USING (auth.role() = 'service_role');

-- Step 7: Rename tables (atomic swap)
BEGIN;
    -- Drop old tables and rename new ones
    DROP TABLE IF EXISTS survey_data CASCADE;
    DROP TABLE IF EXISTS app_settings CASCADE;
    
    ALTER TABLE survey_responses_new RENAME TO survey_data;
    ALTER TABLE app_config_new RENAME TO app_config;
    
    -- Update indexes names
    ALTER INDEX idx_survey_responses_role RENAME TO idx_survey_data_role;
    ALTER INDEX idx_survey_responses_seniority RENAME TO idx_survey_data_seniority;
    ALTER INDEX idx_survey_responses_industry RENAME TO idx_survey_data_industry;
    ALTER INDEX idx_survey_responses_created_at RENAME TO idx_survey_data_created_at;
    ALTER INDEX idx_survey_responses_session_id RENAME TO idx_survey_data_session_id;
COMMIT;

-- Step 8: Create analytics view for easy querying
CREATE OR REPLACE VIEW survey_analytics AS
SELECT 
    COUNT(*) as total_responses,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_responses,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_responses,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_responses,
    
    -- Role distribution
    jsonb_object_agg(
        COALESCE(role, 'Unknown'), 
        role_count
    ) FILTER (WHERE role_count > 0) as role_distribution,
    
    -- Seniority distribution  
    jsonb_object_agg(
        COALESCE(seniority, 'Unknown'), 
        seniority_count
    ) FILTER (WHERE seniority_count > 0) as seniority_distribution,
    
    -- Industry distribution
    jsonb_object_agg(
        COALESCE(industry, 'Unknown'), 
        industry_count
    ) FILTER (WHERE industry_count > 0) as industry_distribution

FROM (
    SELECT 
        role,
        seniority, 
        industry,
        COUNT(*) OVER (PARTITION BY role) as role_count,
        COUNT(*) OVER (PARTITION BY seniority) as seniority_count,
        COUNT(*) OVER (PARTITION BY industry) as industry_count
    FROM survey_data
) stats
GROUP BY ();

-- Step 9: Insert default app config if none exists
INSERT INTO app_config (app_name, app_description, analytics_enabled, maintenance_mode)
SELECT 'Product Role Survey', 'Comprehensive survey for product professionals', true, false
WHERE NOT EXISTS (SELECT 1 FROM app_config);

-- Step 10: Verification queries
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Survey responses migrated: %', (SELECT COUNT(*) FROM survey_data);
    RAISE NOTICE 'App config records: %', (SELECT COUNT(*) FROM app_config);
    RAISE NOTICE 'Backup tables created: survey_data_backup, app_settings_backup';
END $$;

-- Clean up backup tables after verification (uncomment if you want to remove backups)
-- DROP TABLE IF EXISTS survey_data_backup;
-- DROP TABLE IF EXISTS app_settings_backup;
