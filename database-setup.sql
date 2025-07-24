-- =================================================================
-- DATABASE SETUP SCRIPT FOR PRODUCT SURVEY BUILDER
-- =================================================================
-- Instructions:
-- 1. Create a new Supabase project
-- 2. Run this script in the Supabase SQL Editor
-- 3. Configure authentication providers in Supabase dashboard
-- =================================================================

-- 1. CREATE MAIN SURVEY DATA TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User Information
    name TEXT,
    email TEXT,
    
    -- Experience Information
    experience_level TEXT,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    
    -- Salary Information
    salary_currency TEXT DEFAULT 'USD',
    salary_min TEXT,
    salary_max TEXT,
    salary_average TEXT,
    
    -- Additional Fields
    comments TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Metadata
    session_id TEXT,
    source TEXT DEFAULT 'web'
);

-- 2. CREATE USER PROFILES TABLE (extends Supabase auth.users)
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

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_created_at ON pc_survey_data(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_email ON pc_survey_data(email);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_satisfaction ON pc_survey_data(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 4. CREATE USER MANAGEMENT VIEW
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

-- 5. SET UP ROW LEVEL SECURITY (RLS)
-- =================================================================
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Survey data policies (public read for analytics)
CREATE POLICY "Public can insert survey data" ON pc_survey_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view survey data" ON pc_survey_data
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 6. CREATE PROFILE TRIGGER (auto-create profile on signup)
-- =================================================================
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

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. CREATE HELPER FUNCTIONS
-- =================================================================

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;
    
    -- Validate role
    IF new_role NOT IN ('admin', 'collaborator', 'viewer') THEN
        RAISE EXCEPTION 'Invalid role specified';
    END IF;
    
    -- Update the role
    UPDATE profiles 
    SET role = new_role, updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get survey statistics
CREATE OR REPLACE FUNCTION get_survey_stats()
RETURNS TABLE (
    total_responses BIGINT,
    avg_satisfaction NUMERIC,
    latest_response TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_responses,
        AVG(satisfaction_score::NUMERIC) as avg_satisfaction,
        MAX(created_at) as latest_response
    FROM pc_survey_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- SETUP COMPLETE
-- =================================================================
-- Next steps:
-- 1. Configure authentication providers in Supabase dashboard
-- 2. Add environment variables to your application
-- 3. Test the authentication flow
-- =================================================================