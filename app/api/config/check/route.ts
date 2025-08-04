import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readLocalConfig } from '@/lib/local-config'

export async function GET(request: NextRequest) {
  try {
    // First, check for local configuration (for bootstrap)
    const localConfig = readLocalConfig()
    if (localConfig) {
      try {
        const supabase = createClient(localConfig.supabaseUrl, localConfig.supabaseKey)
        
        const { data, error } = await supabase
          .from('app_settings')
          .select('settings')
          .eq('environment', 'dev')
          .single()

        if (error || !data) {
          return NextResponse.json({
            success: true,
            configured: false,
            hasLocalConfig: true,
            canConnect: true,
            error: 'No configuration found in database',
            source: 'local_config'
          })
        }

        // Check if database config exists in settings
        const hasDatabaseConfig = data.settings?.database?.url && data.settings?.database?.apiKey

        return NextResponse.json({
          success: true,
          configured: hasDatabaseConfig,
          hasLocalConfig: true,
          canConnect: true,
          error: null,
          source: 'database',
          hasDatabaseConfig
        })

      } catch (dbError) {
        return NextResponse.json({
          success: true,
          configured: false,
          hasLocalConfig: true,
          canConnect: false,
          error: 'Database connection failed',
          source: 'local_config'
        })
      }
    }

    // Check environment variables (fallback)
    const hasEnvUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasEnvKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
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

    // No configuration available - app needs initial setup
    return NextResponse.json({
      success: true,
      configured: false,
      hasLocalConfig: false,
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