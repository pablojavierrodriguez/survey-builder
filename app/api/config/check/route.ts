import { NextRequest, NextResponse } from 'next/server'
import { configManager } from '@/lib/config-manager'

export async function GET(request: NextRequest) {
  try {
    // Check if configuration is available
    const configured = await configManager.isConfigured()
    
    return NextResponse.json({
      configured,
      hasEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      canConnect: configured
    })

  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { configured: false, error: 'Error checking configuration' },
      { status: 500 }
    )
  }
}
