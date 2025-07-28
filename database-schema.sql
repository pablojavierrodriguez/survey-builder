-- =================================================================
-- DATABASE SCHEMA FOR PRODUCT SURVEY BUILDER
-- =================================================================
-- This schema supports the current survey structure and both dev/prod environments
-- =================================================================

-- 1. CREATE MAIN SURVEY DATA TABLE (PRODUCTION)
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

-- 2. CREATE DEV SURVEY DATA TABLE
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

-- 3. CREATE USER PROFILES TABLE (extends Supabase auth.users)
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

-- 4. CREATE INDEXES FOR PERFORMANCE
-- =================================================================
-- Main table indexes
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_created_at ON pc_survey_data(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_email ON pc_survey_data(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_role ON pc_survey_data(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_company_size ON pc_survey_data(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_industry ON pc_survey_data(industry);

-- Dev table indexes
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_email ON pc_survey_data_dev(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_company_size ON pc_survey_data_dev(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 5. CREATE USER MANAGEMENT VIEW
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

-- 6. SET UP ROW LEVEL SECURITY (RLS)
-- =================================================================
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- 7. CREATE TRIGGERS AND FUNCTIONS
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

-- Function to get survey statistics
CREATE OR REPLACE FUNCTION get_survey_stats()
RETURNS TABLE(
    total_responses BIGINT,
    avg_salary_min NUMERIC,
    avg_salary_max NUMERIC,
    top_roles TEXT[],
    top_industries TEXT[],
    top_challenges TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_responses,
        AVG(CAST(NULLIF(salary_min, '') AS NUMERIC)) as avg_salary_min,
        AVG(CAST(NULLIF(salary_max, '') AS NUMERIC)) as avg_salary_max,
        ARRAY_AGG(DISTINCT role ORDER BY role) FILTER (WHERE role IS NOT NULL) as top_roles,
        ARRAY_AGG(DISTINCT industry ORDER BY industry) FILTER (WHERE industry IS NOT NULL) as top_industries,
        ARRAY_AGG(DISTINCT main_challenge ORDER BY main_challenge) FILTER (WHERE main_challenge IS NOT NULL) as top_challenges
    FROM pc_survey_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. INSERT DEFAULT ADMIN USER (if needed)
-- =================================================================
-- Uncomment and modify if you need to create a default admin user
/*
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('your_password_here', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Admin User", "role": "admin"}'
);
*/