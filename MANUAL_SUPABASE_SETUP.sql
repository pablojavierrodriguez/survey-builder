-- =================================================================
-- MANUAL SUPABASE SETUP - EJECUTAR EN SUPABASE SQL EDITOR
-- Project: qaauhwulohxeeacexrav.supabase.co
-- =================================================================

-- 1. BACKUP EXISTING PRODUCTION DATA (SAFETY FIRST)
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data_backup AS 
SELECT * FROM pc_survey_data;

-- 2. ADD SALARY FIELDS TO PRODUCTION TABLE (WITHOUT LOSING DATA)
-- =================================================================
ALTER TABLE pc_survey_data 
ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'ARS',
ADD COLUMN IF NOT EXISTS salary_min TEXT,
ADD COLUMN IF NOT EXISTS salary_max TEXT,
ADD COLUMN IF NOT EXISTS salary_average TEXT;

-- 3. CREATE INDEXES FOR PRODUCTION TABLE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_salary_currency ON pc_survey_data(salary_currency);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_seniority ON pc_survey_data(seniority);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_industry ON pc_survey_data(industry);

-- 4. CREATE DEV TABLE WITH ALL FIELDS
-- =================================================================
CREATE TABLE IF NOT EXISTS pc_survey_data_dev (
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
  daily_tools TEXT[],
  other_tool TEXT,
  learning_methods TEXT[],
  salary_currency TEXT DEFAULT 'ARS',
  salary_min TEXT,
  salary_max TEXT,
  salary_average TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE INDEXES FOR DEV TABLE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_salary_currency ON pc_survey_data_dev(salary_currency);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_seniority ON pc_survey_data_dev(seniority);
CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_company_type ON pc_survey_data_dev(company_type);

-- 6. ENABLE RLS FOR DEV TABLE
-- =================================================================
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- 7. DROP EXISTING POLICIES (IF ANY) AND CREATE NEW ONES FOR DEV
-- =================================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Enable insert access for all users" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Enable update access for all users" ON pc_survey_data_dev;
DROP POLICY IF EXISTS "Enable delete access for all users" ON pc_survey_data_dev;

CREATE POLICY "Enable read access for all users" ON pc_survey_data_dev FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON pc_survey_data_dev FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON pc_survey_data_dev FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON pc_survey_data_dev FOR DELETE USING (true);

-- 8. INSERT SAMPLE DATA FOR DEV (WITH SALARY EXAMPLES)
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
),
(
  'Product Owner', 
  'Mid-level (3-5 years)', 
  'Enterprise', 
  '500-1000 employees', 
  'Healthcare',
  'B2B Product', 
  'B2B Product', 
  'Managing stakeholder expectations and prioritizing features effectively',
  ARRAY['Jira', 'Confluence', 'Miro', 'Teams'],
  ARRAY['Courses', 'Conferences', 'Mentors'],
  'ARS',
  '1800000',
  '2400000', 
  '2100000',
  'po@example.com'
),
(
  'Product Analyst', 
  'Junior (1-3 years)', 
  'Startup', 
  '11-50 employees', 
  'FinTech',
  'B2C Product', 
  'B2C Product', 
  'Learning to translate data insights into actionable product decisions',
  ARRAY['Google Analytics', 'Mixpanel', 'SQL', 'Tableau'],
  ARRAY['Books', 'Online courses', 'Community'],
  'USD',
  '55000',
  '75000', 
  '65000',
  'analyst@example.com'
);

-- 9. CREATE USER MANAGEMENT TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'collaborator', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- 10. ENABLE RLS FOR USER MANAGEMENT TABLE
-- =================================================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 11. CREATE POLICIES FOR USER MANAGEMENT
-- =================================================================
DROP POLICY IF EXISTS "Users can view their own data" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;

CREATE POLICY "Users can view their own data" ON app_users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON app_users FOR ALL USING (true);

-- 12. VERIFICATION QUERIES
-- =================================================================
-- Check production table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data' 
ORDER BY ordinal_position;

-- Check dev table structure  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data_dev' 
ORDER BY ordinal_position;

-- Check sample data in dev
SELECT role, salary_currency, salary_average, created_at 
FROM pc_survey_data_dev 
ORDER BY created_at DESC;

-- Check production data count
SELECT COUNT(*) as production_records FROM pc_survey_data;

-- Check dev data count
SELECT COUNT(*) as dev_records FROM pc_survey_data_dev;

-- Check backup
SELECT COUNT(*) as backup_records FROM pc_survey_data_backup;

-- =================================================================
-- SETUP COMPLETE!
-- =================================================================
-- After running this SQL:
-- 1. Production table has salary fields added (data preserved)
-- 2. Dev table created with sample data including salaries
-- 3. User management table ready for app users
-- 4. All indexes and security policies configured
-- 5. Backup of original production data created
-- =================================================================