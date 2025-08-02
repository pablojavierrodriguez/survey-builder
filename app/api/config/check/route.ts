import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasEnvUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasEnvKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Check if we can create a client
    let canConnect = false
    let error = null
    
    if (hasEnvUrl && hasEnvKey) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Test connection
        const { data, error: testError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        canConnect = !testError
        error = testError?.message || null
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error'
      }
    }

    const isConfigured = hasEnvUrl && hasEnvKey && canConnect

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      hasEnvUrl,
      hasEnvKey,
      canConnect,
      error,
      source: 'environment'
    })

  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}