import { NextRequest, NextResponse } from 'next/server'
import { configManager } from '@/lib/config-manager'

export async function GET(request: NextRequest) {
  try {
    // Get configuration status
    const configured = await configManager.isConfigured()
    const config = await configManager.getConfig()
    
    // Get Supabase client status
    const supabase = await configManager.getSupabaseClient()
    const supabaseStatus = supabase ? 'connected' : 'disconnected'

    return NextResponse.json({
      success: true,
      data: {
        configured,
        supabaseStatus,
        hasConfig: !!config,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}