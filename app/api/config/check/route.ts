import { NextRequest, NextResponse } from 'next/server'
import { readLocalConfig } from '@/lib/local-config'

export async function GET(request: NextRequest) {
  try {
    // First, check for local configuration (for bootstrap)
    const localConfig = readLocalConfig()
    if (localConfig) {
      return NextResponse.json({
        success: true,
        configured: true,
        hasLocalConfig: true,
        canConnect: true,
        error: null,
        source: 'local_config'
      })
    }

    // Check environment variables (fallback)
    const hasEnvUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasEnvKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (hasEnvUrl && hasEnvKey) {
      return NextResponse.json({
        success: true,
        configured: true,
        hasEnvUrl,
        hasEnvKey,
        canConnect: true,
        error: null,
        source: 'environment'
      })
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