const { createClient } = require('@supabase/supabase-js')

// Use the provided service role key
const supabaseUrl = 'https://pzfujrbrsfcevektarjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZnVqcmJyc2ZjZXZla3Rhcmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzczNjk1MiwiZXhwIjoyMDY5MzEyOTUyfQ.VvC47wZdZA_fSMIv4Tcc0ph8CLl2yRrBBOKWaFXOB_Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectRealSchema() {
  console.log('🔍 Inspecting REAL database schema...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  console.log('')

  try {
    // 1. Check if app_settings table exists and get its structure
    console.log('📋 1. Checking app_settings table...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .limit(5)

    if (settingsError) {
      console.log('❌ app_settings table error:', settingsError.message)
      
      if (settingsError.message.includes('relation "app_settings" does not exist')) {
        console.log('📝 Table app_settings does not exist - needs to be created')
        console.log('')
        console.log('🔧 RECOMMENDATION: Run create-app-settings-table.sql')
        return
      }
    } else {
      console.log('✅ app_settings table exists')
      console.log('📊 Records found:', settingsData.length)
      
      if (settingsData.length > 0) {
        console.log('📊 Sample record:')
        console.log(JSON.stringify(settingsData[0], null, 2))
        
        // Check for environment column
        const firstRecord = settingsData[0]
        const hasEnvironment = 'environment' in firstRecord
        
        console.log('')
        console.log('🔍 2. Checking for environment column...')
        
        if (hasEnvironment) {
          console.log('✅ environment column exists')
          const environments = [...new Set(settingsData.map(r => r.environment))]
          console.log('Current environment values:', environments)
        } else {
          console.log('❌ environment column missing')
          console.log('Available columns:', Object.keys(firstRecord))
          console.log('')
          console.log('🔧 RECOMMENDATION: Run simple-environment-fix.sql')
        }
      }
    }

    // 3. Check other important tables
    console.log('')
    console.log('📋 3. Checking other tables...')
    
    const tablesToCheck = ['profiles', 'pc_survey_data_dev', 'pc_survey_data']
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: exists`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

    // 4. Generate PRECISE migration recommendation
    console.log('')
    console.log('🎯 4. PRECISE Migration Recommendation:')
    
    if (settingsData && settingsData.length > 0) {
      const firstRecord = settingsData[0]
      const hasEnvironment = 'environment' in firstRecord
      
      if (!hasEnvironment) {
        console.log('📝 NEEDED: Add environment column to app_settings')
        console.log('')
        console.log('📋 Current structure:')
        console.log('   Columns:', Object.keys(firstRecord))
        console.log('   Sample data:', JSON.stringify(firstRecord, null, 2))
        console.log('')
        console.log('🔧 EXACT SQL needed:')
        console.log('   ALTER TABLE app_settings ADD COLUMN environment TEXT DEFAULT \'dev\';')
        console.log('   UPDATE app_settings SET environment = \'dev\' WHERE environment IS NULL;')
        console.log('   ALTER TABLE app_settings ALTER COLUMN environment SET NOT NULL;')
        console.log('   ALTER TABLE app_settings ADD CONSTRAINT app_settings_environment_key UNIQUE (environment);')
      } else {
        console.log('✅ Schema looks good!')
        console.log('   Environment column exists')
        console.log('   Ready for environment-based settings')
      }
    } else {
      console.log('📝 NEEDED: Create app_settings table')
      console.log('   Run: create-app-settings-table.sql')
    }

  } catch (error) {
    console.error('❌ Error inspecting schema:', error)
  }
}

// Run the inspection
inspectRealSchema().then(() => {
  console.log('')
  console.log('🏁 Schema inspection complete')
  process.exit(0)
}).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})