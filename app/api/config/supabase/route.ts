import { NextRequest, NextResponse } from 'next/server'
import { logger, generateRequestId, withLogging } from '@/lib/logger'

async function handleGetSupabaseConfig(request: NextRequest) {
  const requestId = generateRequestId()
  const requestLogger = logger.request(requestId, 'GET /api/config/supabase')

  try {
    // Get Supabase configuration from environment variables
    const supabaseUrl = 
      process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      ''

    const supabaseAnonKey = 
      process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''

    requestLogger.info('Supabase config requested', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlSource: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ? 'POSTGRES_NEXT_PUBLIC' : 
                 process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC' : 'NONE',
      keySource: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'POSTGRES_NEXT_PUBLIC' : 
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC' : 'NONE'
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      requestLogger.warn('Supabase configuration incomplete', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase configuration not available' 
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        supabaseUrl,
        supabaseAnonKey
      }
    })

  } catch (error) {
    requestLogger.error('Error providing Supabase config', error as Error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const GET = withLogging(handleGetSupabaseConfig)