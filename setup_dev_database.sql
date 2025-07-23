-- =================================================================
-- DEV DATABASE SETUP FOR PRODUCT COMMUNITY SURVEY
-- =================================================================
-- Execute this SQL in Supabase SQL Editor to setup development environment
-- Project: qaauhwulohxeeacexrav.supabase.co

-- 1. CREATE DEV TABLE WITH SALARY FIELDS
-- =================================================================
CREATE TABLE pc_survey_data_dev (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT,
    daily_tools TEXT[], -- Array of strings
    other_tool TEXT,
    learning_methods TEXT[], -- Array of strings
    salary_currency TEXT DEFAULT 'ARS', -- NEW: Currency selection (ARS/USD)
    salary_min TEXT, -- NEW: Minimum salary range (stored as string)
    salary_max TEXT, -- NEW: Maximum salary range (stored as string)
    salary_average TEXT, -- NEW: Average salary (stored as string)
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);
CREATE INDEX idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);
CREATE INDEX idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);
CREATE INDEX idx_pc_survey_data_dev_salary_currency ON pc_survey_data_dev(salary_currency);
CREATE INDEX idx_pc_survey_data_dev_seniority ON pc_survey_data_dev(seniority);
CREATE INDEX idx_pc_survey_data_dev_company_type ON pc_survey_data_dev(company_type);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =================================================================
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES (Same as main table)
-- =================================================================
CREATE POLICY "Enable read access for all users" ON pc_survey_data_dev
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON pc_survey_data_dev
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON pc_survey_data_dev
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON pc_survey_data_dev
    FOR DELETE USING (true);

-- 5. INSERT SAMPLE DATA FOR TESTING (Optional)
-- =================================================================
INSERT INTO pc_survey_data_dev (
    role, seniority, company_type, company_size, industry, 
    product_type, customer_segment, main_challenge,
    daily_tools, learning_methods, 
    salary_currency, salary_min, salary_max, salary_average,
    email
) VALUES 
(
    'Product Manager', 
    'Senior (5-8 years)', 
    'Startup', 
    '51-200 employees', 
    'Technology/Software',
    'B2B Product', 
    'B2B Product', 
    'Finding product-market fit and understanding customer needs deeply',
    ARRAY['Jira', 'Figma', 'Notion', 'Slack'],
    ARRAY['Books', 'Podcasts', 'Community'],
    'USD',
    '85000',
    '115000', 
    '100000',
    'test@example.com'
),
(
    'Product Designer / UX/UI Designer (UXer)', 
    'Mid-level (3-5 years)', 
    'Scale-up', 
    '201-500 employees', 
    'E-commerce/Retail',
    'B2C Product', 
    'B2C Product', 
    'Balancing user needs with business requirements and technical constraints',
    ARRAY['Figma', 'Miro', 'Notion', 'Slack'],
    ARRAY['Courses', 'Community', 'Mentors'],
    'ARS',
    '2125000',
    '2875000', 
    '2500000',
    'designer@example.com'
),
(
    'Product Engineer / Software Engineer (Developer)', 
    'Senior (5-8 years)', 
    'Enterprise', 
    '1000+ employees', 
    'Financial Services',
    'B2B Product', 
    'B2B Product', 
    'Technical debt management and scaling architecture',
    ARRAY['GitHub', 'Jira', 'Slack', 'Linear'],
    ARRAY['Books', 'Community'],
    'USD',
    '95000',
    '135000', 
    '115000',
    'engineer@example.com'
);

-- 6. VERIFICATION QUERIES
-- =================================================================
-- Run these to verify setup worked correctly

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data_dev' 
ORDER BY ordinal_position;

-- Check sample data
SELECT role, salary_currency, salary_average, created_at 
FROM pc_survey_data_dev 
ORDER BY created_at DESC;

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pc_survey_data_dev';

-- =================================================================
-- SETUP COMPLETE!
-- =================================================================
-- After running this SQL:
-- 1. Your dev environment will use 'pc_survey_data_dev' table
-- 2. Main environment will continue using 'pc_survey_data' table  
-- 3. App will auto-detect environment and use appropriate table
-- 4. Sample data will be available for testing salary analytics
-- 5. All security policies are properly configured
-- =================================================================