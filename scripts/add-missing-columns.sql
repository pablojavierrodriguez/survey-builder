-- Add the missing demographic columns to your existing table
ALTER TABLE pc_survey_data 
ADD COLUMN IF NOT EXISTS other_role TEXT,
ADD COLUMN IF NOT EXISTS seniority TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS customer_segment TEXT;

-- Update the existing company_type column to also store company_size data
-- (This maintains backward compatibility)

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data' 
ORDER BY ordinal_position;

-- Test that we can insert with the new structure
INSERT INTO pc_survey_data (
    role,
    other_role,
    seniority,
    company_type,
    company_size,
    industry,
    product_type,
    customer_segment,
    main_challenge,
    daily_tools,
    learning_methods,
    content_preferences,
    email
) VALUES (
    'Product Manager',
    NULL,
    'Senior (5-8 years)',
    'Scale-up (Series D+)',
    'Scale-up (Series D+)',
    'Technology/Software',
    'SaaS (B2B)',
    'B2B Product',
    'Test insert after adding columns',
    ARRAY['Jira', 'Figma'],
    ARRAY['Books', 'Community'],
    ARRAY['content'],
    'test@example.com'
);

-- Clean up the test record
DELETE FROM pc_survey_data WHERE main_challenge = 'Test insert after adding columns';
