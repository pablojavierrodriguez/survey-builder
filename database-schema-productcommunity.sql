-- =================================================================
-- DATABASE SCHEMA FOR PRODUCT COMMUNITY SURVEY
-- =================================================================
-- Project: ProductCommunitySurvey
-- Organization: My Product Team Database
-- =================================================================

-- 1. CREATE APP SETTINGS TABLE (Environment Configuration)
-- =================================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Environment identification
    environment TEXT NOT NULL UNIQUE CHECK (environment IN ('dev', 'prod')),
    
    -- Database configuration
    survey_table_name TEXT NOT NULL,
    analytics_table_name TEXT,
    
    -- App configuration
    app_name TEXT NOT NULL,
    app_url TEXT,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    
    -- Feature flags
    enable_analytics BOOLEAN DEFAULT TRUE,
    enable_email_notifications BOOLEAN DEFAULT FALSE,
    enable_export BOOLEAN DEFAULT TRUE,
    
    -- Security settings
    session_timeout INTEGER DEFAULT 28800000, -- 8 hours in milliseconds
    max_login_attempts INTEGER DEFAULT 3,
    
    -- UI/UX settings
    theme_default TEXT DEFAULT 'system' CHECK (theme_default IN ('light', 'dark', 'system')),
    language_default TEXT DEFAULT 'en',
    
    -- Additional configuration
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    version TEXT DEFAULT '1.0.0'
);

-- 2. CREATE MAIN SURVEY DATA TABLE (PRODUCTION)
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Survey Data Fields (matching the current survey structure)
    role TEXT,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT,
    daily_tools TEXT[],
    other_tool TEXT,
    learning_methods TEXT[],
    salary_currency TEXT DEFAULT 'USD',
    salary_min TEXT,
    salary_max TEXT,
    salary_average TEXT,
    email TEXT,
    
    -- Metadata
    session_id TEXT,
    source TEXT DEFAULT 'web',
    user_agent TEXT,
    ip_address INET
);

-- 3. CREATE DEV SURVEY DATA TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data_dev (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Survey Data Fields (matching the current survey structure)
    role TEXT,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT,
    daily_tools TEXT[],
    other_tool TEXT,
    learning_methods TEXT[],
    salary_currency TEXT DEFAULT 'USD',
    salary_min TEXT,
    salary_max TEXT,
    salary_average TEXT,
    email TEXT,
    
    -- Metadata
    session_id TEXT,
    source TEXT DEFAULT 'web',
    user_agent TEXT,
    ip_address INET
);

-- 4. CREATE USER PROFILES TABLE (extends Supabase auth.users)
-- =================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'collaborator', 'viewer')),
    
    -- Profile Settings
    preferences JSONB DEFAULT '{}',
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_confirmed BOOLEAN DEFAULT FALSE
);

-- 5. CREATE INDEXES FOR PERFORMANCE
-- =================================================================
-- App settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment);

-- Main table indexes
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_created_at ON pc_survey_data(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_email ON pc_survey_data(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_role ON pc_survey_data(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_company_size ON pc_survey_data(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_industry ON pc_survey_data(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_seniority ON pc_survey_data(seniority);

-- Dev table indexes
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_email ON pc_survey_data_dev(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_company_size ON pc_survey_data_dev(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_seniority ON pc_survey_data_dev(seniority);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. CREATE USER MANAGEMENT VIEW
-- =================================================================
CREATE OR REPLACE VIEW user_management AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    p.last_sign_in_at,
    p.email_confirmed,
    au.email_confirmed_at,
    au.last_sign_in_at as auth_last_sign_in
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- 7. SET UP ROW LEVEL SECURITY (RLS)
-- =================================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for App Settings (Admin read/write, Public read)
CREATE POLICY "Public can read app settings" ON app_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage app settings" ON app_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for Survey Data (Public insert, Admin read)
CREATE POLICY "Public can insert survey data" ON pc_survey_data
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all survey data" ON pc_survey_data
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Collaborators can view survey data" ON pc_survey_data
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'collaborator')
    )
);

-- RLS Policies for Dev Survey Data
CREATE POLICY "Public can insert dev survey data" ON pc_survey_data_dev
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all dev survey data" ON pc_survey_data_dev
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Collaborators can view dev survey data" ON pc_survey_data_dev
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'collaborator')
    )
);

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 8. CREATE TRIGGERS AND FUNCTIONS
-- =================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET role = new_role, updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get app settings by environment
CREATE OR REPLACE FUNCTION get_app_settings(target_environment TEXT DEFAULT NULL)
RETURNS TABLE(
    environment TEXT,
    survey_table_name TEXT,
    app_name TEXT,
    app_url TEXT,
    maintenance_mode BOOLEAN,
    enable_analytics BOOLEAN,
    enable_email_notifications BOOLEAN,
    enable_export BOOLEAN,
    session_timeout INTEGER,
    max_login_attempts INTEGER,
    theme_default TEXT,
    language_default TEXT,
    settings JSONB
) AS $$
BEGIN
    -- If no environment specified, try to detect from context
    IF target_environment IS NULL THEN
        -- Default to dev for safety
        target_environment := 'dev';
    END IF;
    
    RETURN QUERY
    SELECT 
        s.environment,
        s.survey_table_name,
        s.app_name,
        s.app_url,
        s.maintenance_mode,
        s.enable_analytics,
        s.enable_email_notifications,
        s.enable_export,
        s.session_timeout,
        s.max_login_attempts,
        s.theme_default,
        s.language_default,
        s.settings
    FROM app_settings s
    WHERE s.environment = target_environment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get survey statistics for production
CREATE OR REPLACE FUNCTION get_survey_stats()
RETURNS TABLE(
    total_responses BIGINT,
    avg_salary_min NUMERIC,
    avg_salary_max NUMERIC,
    top_roles TEXT[],
    top_industries TEXT[],
    top_challenges TEXT[],
    top_company_sizes TEXT[],
    top_seniority_levels TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_responses,
        AVG(CAST(NULLIF(salary_min, '') AS NUMERIC)) as avg_salary_min,
        AVG(CAST(NULLIF(salary_max, '') AS NUMERIC)) as avg_salary_max,
        ARRAY_AGG(DISTINCT role ORDER BY role) FILTER (WHERE role IS NOT NULL) as top_roles,
        ARRAY_AGG(DISTINCT industry ORDER BY industry) FILTER (WHERE industry IS NOT NULL) as top_industries,
        ARRAY_AGG(DISTINCT main_challenge ORDER BY main_challenge) FILTER (WHERE main_challenge IS NOT NULL) as top_challenges,
        ARRAY_AGG(DISTINCT company_size ORDER BY company_size) FILTER (WHERE company_size IS NOT NULL) as top_company_sizes,
        ARRAY_AGG(DISTINCT seniority ORDER BY seniority) FILTER (WHERE seniority IS NOT NULL) as top_seniority_levels
    FROM pc_survey_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get survey statistics for development
CREATE OR REPLACE FUNCTION get_survey_stats_dev()
RETURNS TABLE(
    total_responses BIGINT,
    avg_salary_min NUMERIC,
    avg_salary_max NUMERIC,
    top_roles TEXT[],
    top_industries TEXT[],
    top_challenges TEXT[],
    top_company_sizes TEXT[],
    top_seniority_levels TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_responses,
        AVG(CAST(NULLIF(salary_min, '') AS NUMERIC)) as avg_salary_min,
        AVG(CAST(NULLIF(salary_max, '') AS NUMERIC)) as avg_salary_max,
        ARRAY_AGG(DISTINCT role ORDER BY role) FILTER (WHERE role IS NOT NULL) as top_roles,
        ARRAY_AGG(DISTINCT industry ORDER BY industry) FILTER (WHERE industry IS NOT NULL) as top_industries,
        ARRAY_AGG(DISTINCT main_challenge ORDER BY main_challenge) FILTER (WHERE main_challenge IS NOT NULL) as top_challenges,
        ARRAY_AGG(DISTINCT company_size ORDER BY company_size) FILTER (WHERE company_size IS NOT NULL) as top_company_sizes,
        ARRAY_AGG(DISTINCT seniority ORDER BY seniority) FILTER (WHERE seniority IS NOT NULL) as top_seniority_levels
    FROM pc_survey_data_dev;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. INSERT DEFAULT APP SETTINGS
-- =================================================================

-- Development environment settings
INSERT INTO app_settings (
    environment,
    survey_table_name,
    app_name,
    app_url,
    maintenance_mode,
    enable_analytics,
    enable_email_notifications,
    enable_export,
    session_timeout,
    max_login_attempts,
    theme_default,
    language_default,
    description,
    version
) VALUES (
    'dev',
    'pc_survey_data_dev',
    'Product Community Survey (DEV)',
    'http://localhost:3000',
    FALSE,
    TRUE,
    FALSE,
    TRUE,
    28800000,
    3,
    'system',
    'en',
    'Development environment configuration',
    '1.0.0'
) ON CONFLICT (environment) DO UPDATE SET
    survey_table_name = EXCLUDED.survey_table_name,
    app_name = EXCLUDED.app_name,
    app_url = EXCLUDED.app_url,
    maintenance_mode = EXCLUDED.maintenance_mode,
    enable_analytics = EXCLUDED.enable_analytics,
    enable_email_notifications = EXCLUDED.enable_email_notifications,
    enable_export = EXCLUDED.enable_export,
    session_timeout = EXCLUDED.session_timeout,
    max_login_attempts = EXCLUDED.max_login_attempts,
    theme_default = EXCLUDED.theme_default,
    language_default = EXCLUDED.language_default,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    updated_at = NOW();

-- Production environment settings
INSERT INTO app_settings (
    environment,
    survey_table_name,
    app_name,
    app_url,
    maintenance_mode,
    enable_analytics,
    enable_email_notifications,
    enable_export,
    session_timeout,
    max_login_attempts,
    theme_default,
    language_default,
    description,
    version
) VALUES (
    'prod',
    'pc_survey_data',
    'Product Community Survey',
    'https://your-vercel-domain.vercel.app',
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    28800000,
    3,
    'system',
    'en',
    'Production environment configuration',
    '1.0.0'
) ON CONFLICT (environment) DO UPDATE SET
    survey_table_name = EXCLUDED.survey_table_name,
    app_name = EXCLUDED.app_name,
    app_url = EXCLUDED.app_url,
    maintenance_mode = EXCLUDED.maintenance_mode,
    enable_analytics = EXCLUDED.enable_analytics,
    enable_email_notifications = EXCLUDED.enable_email_notifications,
    enable_export = EXCLUDED.enable_export,
    session_timeout = EXCLUDED.session_timeout,
    max_login_attempts = EXCLUDED.max_login_attempts,
    theme_default = EXCLUDED.theme_default,
    language_default = EXCLUDED.language_default,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    updated_at = NOW();

-- 10. INSERT SAMPLE DATA FOR TESTING (DEV TABLE ONLY)
-- =================================================================
INSERT INTO pc_survey_data_dev (
    role, seniority, company_size, industry, product_type, 
    main_challenge, daily_tools, learning_methods, email
) VALUES 
(
    'Product Manager', 
    'Senior (5-8 years)', 
    'Growth-stage Startup (Series A-C)', 
    'Technology/Software', 
    'SaaS (B2B)',
    'Balancing user needs with business goals',
    ARRAY['Figma', 'Notion', 'Slack'],
    ARRAY['Online courses', 'Industry conferences'],
    'test@example.com'
),
(
    'Product Designer / UX/UI Designer (UXer)', 
    'Mid-level (2-5 years)', 
    'Early-stage Startup (Pre-seed/Seed)', 
    'Technology/Software', 
    'Mobile App',
    'Designing for multiple platforms',
    ARRAY['Figma', 'Sketch', 'Miro'],
    ARRAY['Design communities', 'Mentorship'],
    'designer@example.com'
),
(
    'Product Engineer / Software Engineer (Developer)', 
    'Staff/Principal (8+ years)', 
    'Scale-up (Series D+)', 
    'Technology/Software', 
    'API/Developer Tools',
    'Technical debt management',
    ARRAY['VS Code', 'Git', 'Docker'],
    ARRAY['Open source contributions', 'Tech blogs'],
    'engineer@example.com'
);

-- 11. VERIFICATION QUERIES
-- =================================================================
-- Run these queries to verify the setup:

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles');

-- Check app settings
SELECT * FROM app_settings ORDER BY environment;

-- Check sample data
SELECT COUNT(*) as dev_responses FROM pc_survey_data_dev;
SELECT COUNT(*) as prod_responses FROM pc_survey_data;

-- Test functions
SELECT * FROM get_app_settings('dev');
SELECT * FROM get_survey_stats_dev() LIMIT 1;