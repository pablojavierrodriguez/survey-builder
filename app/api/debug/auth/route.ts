import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user if session exists
    let profile = null
    if (session?.user) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (!profileError) {
          profile = profileData
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    // Check if there are any stored tokens in localStorage (client-side check)
    const hasLocalStorage = typeof window !== 'undefined'
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        expiresAt: session?.expires_at || null,
        accessToken: session?.access_token ? 'PRESENT' : 'MISSING',
        refreshToken: session?.refresh_token ? 'PRESENT' : 'MISSING'
      },
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        createdAt: profile.created_at
      } : null,
      errors: {
        session: sessionError?.message || null,
        profile: null
      },
      environment: {
        isClient: typeof window !== 'undefined',
        hasLocalStorage: hasLocalStorage,
        nodeEnv: process.env.NODE_ENV
      }
    })

  } catch (error) {
    logger.error('Debug auth error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}