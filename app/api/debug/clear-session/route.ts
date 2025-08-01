import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Get current session before clearing
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    
    // Sign out to clear all session data
    const { error: signOutError } = await supabase.auth.signOut()
    
    // Verify session is cleared
    const { data: { session: afterSignOut } } = await supabase.auth.getSession()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      action: 'clear_session',
      before: {
        hadSession: !!currentSession,
        userId: currentSession?.user?.id || null,
        email: currentSession?.user?.email || null
      },
      after: {
        hasSession: !!afterSignOut,
        userId: afterSignOut?.user?.id || null,
        email: afterSignOut?.user?.email || null
      },
      signOutError: signOutError?.message || null,
      success: !afterSignOut && !signOutError
    })

  } catch (error) {
    logger.error('Clear session error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}