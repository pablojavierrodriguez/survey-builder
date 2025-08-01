const { createClient } = require('@supabase/supabase-js')

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchema() {
  console.log('🔍 Inspecting database schema...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  console.log('')

  try {
    // 1. Check if app_settings table exists
    console.log('📋 1. Checking app_settings table...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      console.log('❌ app_settings table error:', settingsError.message)
      
      // Check if table doesn't exist
      if (settingsError.message.includes('relation "app_settings" does not exist')) {
        console.log('📝 Table app_settings does not exist - needs to be created')
        console.log('')
        console.log('🔧 RECOMMENDATION: Run create-app-settings-table.sql')
        return
      }
    } else {
      console.log('✅ app_settings table exists')
      
      // Get table structure
      const { data: structureData, error: structureError } = await supabase
        .rpc('get_table_structure', { table_name: 'app_settings' })
        .catch(() => ({ data: null, error: 'RPC not available' }))

      if (structureError) {
        console.log('📊 Current app_settings data:')
        console.log(JSON.stringify(settingsData, null, 2))
      } else {
        console.log('📊 Table structure:')
        console.log(JSON.stringify(structureData, null, 2))
      }
    }

    // 2. Check for environment column
    console.log('')
    console.log('🔍 2. Checking for environment column...')
    
    if (settingsData && settingsData.length > 0) {
      const firstRecord = settingsData[0]
      const hasEnvironment = 'environment' in firstRecord
      
      if (hasEnvironment) {
        console.log('✅ environment column exists')
        console.log('Current environment values:', [...new Set(settingsData.map(r => r.environment))])
      } else {
        console.log('❌ environment column missing')
        console.log('Available columns:', Object.keys(firstRecord))
        console.log('')
        console.log('🔧 RECOMMENDATION: Run simple-environment-fix.sql')
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

    // 4. Check RLS policies
    console.log('')
    console.log('🔒 4. Checking RLS policies...')
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_rls_policies')
        .catch(() => ({ data: null, error: 'RPC not available' }))

      if (policiesError) {
        console.log('⚠️  Could not check RLS policies (RPC not available)')
      } else {
        console.log('📊 RLS Policies:')
        console.log(JSON.stringify(policies, null, 2))
      }
    } catch (err) {
      console.log('⚠️  Could not check RLS policies')
    }

    // 5. Generate migration recommendation
    console.log('')
    console.log('🎯 5. Migration Recommendation:')
    
    if (settingsData && settingsData.length > 0) {
      const firstRecord = settingsData[0]
      const hasEnvironment = 'environment' in firstRecord
      
      if (!hasEnvironment) {
        console.log('📝 NEEDED: Add environment column to app_settings')
        console.log('   Run: simple-environment-fix.sql')
      } else {
        console.log('✅ Schema looks good!')
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
inspectSchema().then(() => {
  console.log('')
  console.log('🏁 Schema inspection complete')
  process.exit(0)
}).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})