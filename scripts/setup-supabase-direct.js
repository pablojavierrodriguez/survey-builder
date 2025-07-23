// Direct Supabase setup script
const SUPABASE_URL = 'https://qaauhwulohxeeacexrav.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgwMzMzMywiZXhwIjoyMDY4Mzc5MzMzfQ.o2RrLm6j61Lmi-dbA6drBb5eNXyOE_ug4fEysvKWxks'

async function execSQL(sql) {
  // Use PostgreSQL connection via REST API instead
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.pgrst.object+json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: sql
  })

  if (!response.ok) {
    const error = await response.text()
    console.log(`SQL: ${sql.substring(0, 100)}...`)
    throw new Error(`SQL Error: ${response.status} - ${error}`)
  }

  try {
    return await response.json()
  } catch {
    return { success: true }
  }
}

async function setupSupabase() {
  console.log('🚀 Starting Supabase setup...')

  try {
    // 1. Backup existing production data
    console.log('📋 Creating backup of production data...')
    await execSQL(`
      CREATE TABLE IF NOT EXISTS pc_survey_data_backup AS 
      SELECT * FROM pc_survey_data;
    `)
    console.log('✅ Backup created: pc_survey_data_backup')

    // 2. Add missing columns to production table
    console.log('🔧 Adding salary fields to production table...')
    await execSQL(`
      ALTER TABLE pc_survey_data 
      ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'ARS',
      ADD COLUMN IF NOT EXISTS salary_min TEXT,
      ADD COLUMN IF NOT EXISTS salary_max TEXT,
      ADD COLUMN IF NOT EXISTS salary_average TEXT;
    `)
    console.log('✅ Production table updated with salary fields')

    // 3. Create indexes for production
    console.log('📊 Creating indexes for production...')
    const prodIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_salary_currency ON pc_survey_data(salary_currency);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_seniority ON pc_survey_data(seniority);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_industry ON pc_survey_data(industry);'
    ]
    
    for (const indexSQL of prodIndexes) {
      await execSQL(indexSQL)
    }
    console.log('✅ Production indexes created')

    // 4. Create dev table
    console.log('🛠️ Creating dev table...')
    await execSQL(`
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
    `)
    console.log('✅ Dev table created')

    // 5. Create indexes for dev
    console.log('📊 Creating indexes for dev...')
    const devIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_salary_currency ON pc_survey_data_dev(salary_currency);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_seniority ON pc_survey_data_dev(seniority);',
      'CREATE INDEX IF NOT EXISTS idx_pc_survey_data_dev_company_type ON pc_survey_data_dev(company_type);'
    ]
    
    for (const indexSQL of devIndexes) {
      await execSQL(indexSQL)
    }
    console.log('✅ Dev indexes created')

    // 6. Enable RLS for dev
    console.log('🔒 Enabling RLS for dev...')
    await execSQL('ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;')

    // 7. Create policies for dev
    console.log('🛡️ Creating policies for dev...')
    const policies = [
      'DROP POLICY IF EXISTS "Enable read access for all users" ON pc_survey_data_dev;',
      'DROP POLICY IF EXISTS "Enable insert access for all users" ON pc_survey_data_dev;',
      'DROP POLICY IF EXISTS "Enable update access for all users" ON pc_survey_data_dev;',
      'DROP POLICY IF EXISTS "Enable delete access for all users" ON pc_survey_data_dev;',
      'CREATE POLICY "Enable read access for all users" ON pc_survey_data_dev FOR SELECT USING (true);',
      'CREATE POLICY "Enable insert access for all users" ON pc_survey_data_dev FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Enable update access for all users" ON pc_survey_data_dev FOR UPDATE USING (true);',
      'CREATE POLICY "Enable delete access for all users" ON pc_survey_data_dev FOR DELETE USING (true);'
    ]
    
    for (const policySQL of policies) {
      await execSQL(policySQL)
    }
    console.log('✅ Dev policies created')

    // 8. Insert sample data for dev
    console.log('📝 Inserting sample data for dev...')
    await execSQL(`
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
    `)
    console.log('✅ Sample data inserted')

    // 9. Create users table for app users
    console.log('👥 Creating users management table...')
    await execSQL(`
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
    `)

    // Enable RLS for users table
    await execSQL('ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;')
    
    // Create policies for users table
    const userPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own data" ON app_users;',
      'DROP POLICY IF EXISTS "Admins can view all users" ON app_users;',
      'CREATE POLICY "Users can view their own data" ON app_users FOR SELECT USING (auth.uid()::text = id::text);',
      'CREATE POLICY "Admins can view all users" ON app_users FOR ALL USING (true);'
    ]
    
    for (const policySQL of userPolicies) {
      await execSQL(policySQL)
    }
    
    console.log('✅ Users management table created')

    console.log('🎉 Supabase setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log('- ✅ Production data backed up (pc_survey_data_backup)')
    console.log('- ✅ Production table updated with salary fields')
    console.log('- ✅ Dev table created (pc_survey_data_dev)')
    console.log('- ✅ All indexes and policies configured')
    console.log('- ✅ Sample data added to dev')
    console.log('- ✅ Users management table created (app_users)')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    throw error
  }
}

// Execute setup
setupSupabase().then(() => {
  console.log('Setup completed!')
}).catch(error => {
  console.error('Setup failed:', error)
  process.exit(1)
})