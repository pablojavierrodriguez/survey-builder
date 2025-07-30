import { NextRequest, NextResponse } from 'next/server'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleLogout(request: NextRequest) {
  const requestId = generateRequestId()
  const requestLogger = logger.request(requestId, 'POST /api/auth/logout')

  try {
    // Check if Supabase is configured
    if (!supabase) {
      requestLogger.error('Supabase not configured')
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 503 }
      )
    }

    requestLogger.info('Logout request')

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      requestLogger.warn('Logout failed', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to logout' 
        },
        { status: 500 }
      )
    }

    requestLogger.info('Logout successful')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    requestLogger.error('Unexpected error during logout', error as Error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const POST = withLogging(handleLogout)