-- Ultra-simple initialization script - NO foreign keys, NO complex constraints

-- 1. Create survey responses table (main data)
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    
    -- Survey fields (normalized)
    role TEXT,
    seniority TEXT,
    company_size TEXT,
    industry TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create simple app settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create simple profiles table (NO foreign keys)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple policies (allow all for now)
CREATE POLICY "Allow all survey_responses" ON public.survey_responses FOR ALL USING (true);
CREATE POLICY "Allow all app_settings" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Allow all profiles" ON public.profiles FOR ALL USING (true);

-- 6. Insert basic app settings
INSERT INTO public.app_settings (key, value) VALUES 
('app_name', '"Survey Builder"'::jsonb),
('app_description', '"Product Role Survey Application"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Done!
