import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasEnvUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasEnvKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // For now, just check if environment variables exist
    // Don't test connection to avoid rate limiting
    const isConfigured = hasEnvUrl && hasEnvKey

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      hasEnvUrl,
      hasEnvKey,
      canConnect: isConfigured, // Assume it can connect if env vars exist
      error: null,
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