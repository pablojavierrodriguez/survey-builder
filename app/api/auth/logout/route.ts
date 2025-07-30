import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/auth/logout', 'LOGIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/auth/logout`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error(`Supabase not configured for IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn(`Logout failed for IP ${clientIP}:`, error.message)
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to logout',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Logout successful for IP ${clientIP} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Logout API error for IP ${clientIP} after ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}