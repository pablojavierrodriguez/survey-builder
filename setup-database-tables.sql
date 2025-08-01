-- Setup database tables and functions for Product Community Survey

-- 1. Create the survey table creation function
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

-- 2. Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- 4. Create the app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'dev',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(environment)
);

-- 5. Create indexes for app_settings table
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings (environment);

-- 6. Create the survey tables
SELECT create_survey_table_if_not_exists('pc_survey_data_dev');
SELECT create_survey_table_if_not_exists('pc_survey_data');

-- 7. Set up Row Level Security (RLS) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 8. Set up RLS for survey tables
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for survey tables (allow all authenticated users to read/write)
DROP POLICY IF EXISTS "Authenticated users can read survey data" ON pc_survey_data_dev;
CREATE POLICY "Authenticated users can read survey data" ON pc_survey_data_dev
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert survey data" ON pc_survey_data_dev;
CREATE POLICY "Authenticated users can insert survey data" ON pc_survey_data_dev
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read survey data" ON pc_survey_data;
CREATE POLICY "Authenticated users can read survey data" ON pc_survey_data
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert survey data" ON pc_survey_data;
CREATE POLICY "Authenticated users can insert survey data" ON pc_survey_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9. Insert default app settings if they don't exist
INSERT INTO app_settings (environment, settings) 
VALUES (
  'dev',
  '{
    "database": {
      "tableName": "pc_survey_data_dev",
      "environment": "dev"
    },
    "general": {
      "appName": "Product Community Survey",
      "publicUrl": "http://localhost:3000",
      "maintenanceMode": false,
      "analyticsEnabled": true
    },
    "security": {
      "sessionTimeout": 3600,
      "maxLoginAttempts": 5,
      "enableRateLimiting": true
    },
    "features": {
      "enableAnalytics": true,
      "enableEmailNotifications": false,
      "enableExport": true
    }
  }'
) ON CONFLICT (environment) DO NOTHING;

INSERT INTO app_settings (environment, settings) 
VALUES (
  'prod',
  '{
    "database": {
      "tableName": "pc_survey_data",
      "environment": "prod"
    },
    "general": {
      "appName": "Product Community Survey",
      "publicUrl": "https://your-production-domain.com",
      "maintenanceMode": false,
      "analyticsEnabled": true
    },
    "security": {
      "sessionTimeout": 3600,
      "maxLoginAttempts": 5,
      "enableRateLimiting": true
    },
    "features": {
      "enableAnalytics": true,
      "enableEmailNotifications": false,
      "enableExport": true
    }
  }'
) ON CONFLICT (environment) DO NOTHING;

-- 10. Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 13. Show summary
SELECT 
  'Database setup completed successfully' as status,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'app_settings', 'pc_survey_data_dev', 'pc_survey_data');