-- Function to create survey table if it doesn't exist
CREATE OR REPLACE FUNCTION create_survey_table_if_not_exists(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = create_survey_table_if_not_exists.table_name
  ) THEN
    -- Create the table
    EXECUTE format('
      CREATE TABLE %I (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        role TEXT NOT NULL,
        other_role TEXT,
        seniority TEXT NOT NULL,
        company_type TEXT,
        company_size TEXT NOT NULL,
        industry TEXT NOT NULL,
        product_type TEXT NOT NULL,
        customer_segment TEXT NOT NULL,
        main_challenge TEXT NOT NULL,
        daily_tools TEXT[] NOT NULL,
        other_tool TEXT,
        learning_methods TEXT[] NOT NULL,
        salary_currency TEXT DEFAULT ''ARS'',
        salary_min TEXT,
        salary_max TEXT,
        salary_average TEXT,
        email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    ', create_survey_table_if_not_exists.table_name);
    
    -- Create indexes
    EXECUTE format('
      CREATE INDEX idx_%I_role ON %I (role);
      CREATE INDEX idx_%I_seniority ON %I (seniority);
      CREATE INDEX idx_%I_industry ON %I (industry);
      CREATE INDEX idx_%I_created_at ON %I (created_at);
    ', 
      create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name,
      create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name,
      create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name,
      create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name
    );
    
    RAISE NOTICE 'Table % created successfully', create_survey_table_if_not_exists.table_name;
  ELSE
    RAISE NOTICE 'Table % already exists', create_survey_table_if_not_exists.table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;