-- Create the complete table structure if it doesn't exist
CREATE TABLE IF NOT EXISTS pc_survey_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT NOT NULL,
    daily_tools TEXT[] DEFAULT '{}',
    learning_methods TEXT[] DEFAULT '{}',
    content_preferences TEXT[] DEFAULT '{}',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE pc_survey_data 
ADD COLUMN IF NOT EXISTS other_role TEXT,
ADD COLUMN IF NOT EXISTS seniority TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS customer_segment TEXT;

-- Ensure array columns have proper defaults
ALTER TABLE pc_survey_data 
ALTER COLUMN daily_tools SET DEFAULT '{}',
ALTER COLUMN learning_methods SET DEFAULT '{}',
ALTER COLUMN content_preferences SET DEFAULT '{}';

-- Enable Row Level Security if not already enabled
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts" ON pc_survey_data;
DROP POLICY IF EXISTS "Users can view own responses" ON pc_survey_data;

-- Create policies for anonymous access
CREATE POLICY "Allow anonymous inserts" ON pc_survey_data
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy for authenticated users to view data
CREATE POLICY "Allow authenticated select" ON pc_survey_data
    FOR SELECT TO authenticated
    USING (true);

-- Add helpful indexes for analytics
CREATE INDEX IF NOT EXISTS idx_pc_survey_role ON pc_survey_data(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_seniority ON pc_survey_data(seniority);
CREATE INDEX IF NOT EXISTS idx_pc_survey_company_size ON pc_survey_data(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_industry ON pc_survey_data(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_product_type ON pc_survey_data(product_type);
CREATE INDEX IF NOT EXISTS idx_pc_survey_customer_segment ON pc_survey_data(customer_segment);
CREATE INDEX IF NOT EXISTS idx_pc_survey_created_at ON pc_survey_data(created_at);

-- Verify the final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data' 
ORDER BY ordinal_position;
