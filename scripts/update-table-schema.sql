-- Update the pc_survey_data table to include new demographic fields
ALTER TABLE pc_survey_data 
ADD COLUMN IF NOT EXISTS other_role TEXT,
ADD COLUMN IF NOT EXISTS seniority TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS customer_segment TEXT;

-- Update existing company_type column to store company_size data
-- (keeping both for backward compatibility)

-- Add indexes for better query performance on demographic fields
CREATE INDEX IF NOT EXISTS idx_pc_survey_role ON pc_survey_data(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_seniority ON pc_survey_data(seniority);
CREATE INDEX IF NOT EXISTS idx_pc_survey_company_size ON pc_survey_data(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_industry ON pc_survey_data(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_product_type ON pc_survey_data(product_type);
CREATE INDEX IF NOT EXISTS idx_pc_survey_customer_segment ON pc_survey_data(customer_segment);
CREATE INDEX IF NOT EXISTS idx_pc_survey_created_at ON pc_survey_data(created_at);

-- Create a view for easy demographic analysis
CREATE OR REPLACE VIEW demographic_summary AS
SELECT 
  role,
  other_role,
  seniority,
  company_size,
  industry,
  product_type,
  customer_segment,
  COUNT(*) as response_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM pc_survey_data 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY role, other_role, seniority, company_size, industry, product_type, customer_segment
ORDER BY response_count DESC;
