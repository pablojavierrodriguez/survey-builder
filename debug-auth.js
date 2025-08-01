const { createClient } = require('@supabase/supabase-js')

// Use the provided service role key
const supabaseUrl = 'https://pzfujrbrsfcevektarjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZnVqcmJyc2ZjZXZla3Rhcmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzczNjk1MiwiZXhwIjoyMDY5MzEyOTUyfQ.VvC47wZdZA_fSMIv4Tcc0ph8CLl2yRrBBOKWaFXOB_Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAuth() {
  console.log('🔍 Debugging authentication state...')
  console.log('')

  try {
    // 1. Check current sessions (using profiles as proxy)
    console.log('📋 1. Checking profiles table for active users...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10)
    
    if (profilesError) {
      console.log('❌ Error getting profiles:', profilesError.message)
    } else {
      console.log('✅ Profiles found:', profiles.length)
      profiles.forEach((profile, index) => {
        console.log(`   Profile ${index + 1}:`)
        console.log(`     ID: ${profile.id}`)
        console.log(`     Email: ${profile.email}`)
        console.log(`     Role: ${profile.role}`)
        console.log(`     Created: ${profile.created_at}`)
        console.log('')
      })
    }

    // 3. Check for admin profiles
    console.log('📋 3. Checking for admin profiles...')
    if (profiles) {
      const adminProfiles = profiles.filter(p => p.role === 'admin')
      
      if (adminProfiles.length > 0) {
        console.log('👑 Admin profiles found:', adminProfiles.length)
        adminProfiles.forEach(profile => {
          console.log(`   - ${profile.email} (${profile.role}) - ID: ${profile.id}`)
        })
      } else {
        console.log('✅ No admin profiles found')
      }
    }

    // 4. Recommendations
    console.log('')
    console.log('🎯 4. Recommendations:')
    
    if (profiles && profiles.length > 0) {
      const adminProfiles = profiles.filter(p => p.role === 'admin')
      if (adminProfiles.length > 0) {
        console.log('📝 Admin profiles found - this might explain the "User is admin: true" message')
        console.log('   The profile data might be cached or there might be a session issue')
        console.log('')
        console.log('🔧 To fix this:')
        console.log('   1. Clear browser storage (localStorage, sessionStorage)')
        console.log('   2. Clear cookies for the domain')
        console.log('   3. Check if there\'s a persistent session')
        console.log('   4. The code fix should prevent this issue')
      } else {
        console.log('✅ No admin profiles found')
        console.log('   The "User is admin: true" message might be a bug in the code')
      }
    } else {
      console.log('✅ No profiles found')
      console.log('   The "User is admin: true" message might be a bug in the code')
    }

  } catch (error) {
    console.error('❌ Error debugging auth:', error)
  }
}

// Run the debug
debugAuth().then(() => {
  console.log('')
  console.log('🏁 Auth debugging complete')
  process.exit(0)
}).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})