import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables (for bootstrap)
    const hasEnvUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasEnvKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // If we have environment variables, try to check database
    if (hasEnvUrl && hasEnvKey) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data, error } = await supabase
          .from('app_settings')
          .select('settings')
          .eq('environment', 'dev')
          .single()

        if (error || !data) {
          return NextResponse.json({
            success: true,
            configured: false,
            hasEnvUrl,
            hasEnvKey,
            canConnect: true,
            error: 'No configuration found in database',
            source: 'environment'
          })
        }

        // Check if database config exists in settings
        const hasDatabaseConfig = data.settings?.database?.url && data.settings?.database?.apiKey

        return NextResponse.json({
          success: true,
          configured: hasDatabaseConfig,
          hasEnvUrl,
          hasEnvKey,
          canConnect: true,
          error: null,
          source: 'database',
          hasDatabaseConfig
        })

      } catch (dbError) {
        return NextResponse.json({
          success: true,
          configured: false,
          hasEnvUrl,
          hasEnvKey,
          canConnect: false,
          error: 'Database connection failed',
          source: 'environment'
        })
      }
    }

    // No environment variables - app needs initial setup
    return NextResponse.json({
      success: true,
      configured: false,
      hasEnvUrl: false,
      hasEnvKey: false,
      canConnect: false,
      error: 'Initial setup required',
      source: 'none'
    })

  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}