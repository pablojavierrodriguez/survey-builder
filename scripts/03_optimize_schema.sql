-- 🚀 WORLD-CLASS SURVEY BUILDER SCHEMA OPTIMIZATION
-- Escalable, Simple, y Optimizado para Performance

-- ============================================================================
-- 1. OPTIMIZED SURVEY RESPONSES TABLE
-- ============================================================================
-- Normalizing survey_data with specific fields instead of JSON blob
DROP TABLE IF EXISTS public.survey_responses CASCADE;
CREATE TABLE public.survey_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Session & Tracking
    session_id TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    
    -- Survey Response Fields (Normalized)
    role TEXT NOT NULL CHECK (role IN ('product_manager', 'designer', 'developer', 'analyst', 'other')),
    seniority TEXT NOT NULL CHECK (seniority IN ('junior', 'mid', 'senior', 'lead', 'director', 'vp')),
    company_size TEXT NOT NULL CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    industry TEXT NOT NULL,
    
    -- Tools & Methods (Arrays for multi-select)
    tools_used TEXT[] DEFAULT '{}',
    learning_methods TEXT[] DEFAULT '{}',
    
    -- Additional Fields
    experience_years INTEGER CHECK (experience_years >= 0 AND experience_years <= 50),
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_survey_responses_created_at ON public.survey_responses(created_at DESC);
CREATE INDEX idx_survey_responses_role ON public.survey_responses(role);
CREATE INDEX idx_survey_responses_seniority ON public.survey_responses(seniority);
CREATE INDEX idx_survey_responses_session ON public.survey_responses(session_id);

-- ============================================================================
-- 2. SIMPLIFIED APP CONFIGURATION
-- ============================================================================
-- Single global configuration instead of environment-specific
DROP TABLE IF EXISTS public.app_config CASCADE;
CREATE TABLE public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- App Identity
    app_name TEXT NOT NULL DEFAULT 'Survey Builder',
    app_description TEXT DEFAULT 'Professional survey collection platform',
    
    -- URLs & Environment
    public_url TEXT NOT NULL DEFAULT 'https://survey-builder.vercel.app',
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    
    -- Features
    maintenance_mode BOOLEAN DEFAULT FALSE,
    analytics_enabled BOOLEAN DEFAULT TRUE,
    auth_required BOOLEAN DEFAULT FALSE,
    
    -- Limits & Performance
    max_responses_per_session INTEGER DEFAULT 1,
    response_rate_limit INTEGER DEFAULT 100, -- per hour
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO public.app_config (app_name, public_url, environment) 
VALUES ('Survey Builder', 'https://survey-builder.vercel.app', 'production');

-- ============================================================================
-- 3. OPTIMIZED USER PROFILES
-- ============================================================================
-- Enhanced profiles with proper role management
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- User Info
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Role & Permissions
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'admin', 'super_admin')),
    permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_active ON public.profiles(is_active);

-- ============================================================================
-- 4. ANALYTICS & INSIGHTS TABLE
-- ============================================================================
-- Dedicated analytics table for performance
CREATE TABLE public.survey_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Time Period
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    
    -- Metrics
    total_responses INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Distributions (Pre-calculated for performance)
    role_distribution JSONB DEFAULT '{}',
    seniority_distribution JSONB DEFAULT '{}',
    industry_distribution JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, hour)
);

-- Performance Indexes
CREATE INDEX idx_analytics_date ON public.survey_analytics(date DESC);
CREATE INDEX idx_analytics_hour ON public.survey_analytics(date, hour);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Survey Responses: Public read/write for survey submission
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert survey responses" ON public.survey_responses
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view all responses" ON public.survey_responses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- App Config: Admin only
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app config" ON public.app_config
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Profiles: Users can view their own, admins can view all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Analytics: Admin only
ALTER TABLE public.survey_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics" ON public.survey_analytics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- 6. TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_survey_responses_updated_at BEFORE UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. DATA MIGRATION FROM OLD SCHEMA
-- ============================================================================

-- Migrate existing data if any real responses exist
DO $$
BEGIN
    -- Only migrate if there are real survey responses (not test data)
    IF EXISTS (
        SELECT 1 FROM public.survey_data 
        WHERE response_data::text NOT LIKE '%"test"%' 
        AND response_data::text NOT LIKE '%"timestamp": "2024-01-01"%'
    ) THEN
        -- Migrate real survey responses
        INSERT INTO public.survey_responses (
            session_id, user_agent, ip_address, 
            role, seniority, company_size, industry,
            created_at
        )
        SELECT 
            COALESCE(session_id, 'migrated-' || id::text),
            user_agent,
            ip_address::inet,
            COALESCE(response_data->>'role', 'other'),
            COALESCE(response_data->>'seniority', 'mid'),
            COALESCE(response_data->>'company_size', 'medium'),
            COALESCE(response_data->>'industry', 'technology'),
            created_at
        FROM public.survey_data
        WHERE response_data::text NOT LIKE '%"test"%';
    END IF;
END $$;

-- ============================================================================
-- 8. CLEANUP OLD TABLES
-- ============================================================================

-- Remove old inefficient tables
DROP TABLE IF EXISTS public.survey_data CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- ============================================================================
-- 9. CREATE ADMIN USER
-- ============================================================================

-- Create default admin profile for immediate access
INSERT INTO public.profiles (id, email, full_name, role, permissions)
VALUES (
    gen_random_uuid(),
    'admin@survey-builder.app',
    'Survey Admin',
    'super_admin',
    '{"read": true, "write": true, "admin": true, "super_admin": true}'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- OPTIMIZATION COMPLETE! 🚀
-- 
-- Benefits:
-- ✅ Normalized data structure (no more JSON blobs)
-- ✅ Proper indexes for fast queries
-- ✅ Simplified configuration management
-- ✅ Enhanced security with RLS
-- ✅ Auto-updating timestamps
-- ✅ Data integrity with constraints
-- ✅ Scalable analytics pre-calculation
-- ✅ World-class database design
-- ============================================================================
