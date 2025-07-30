import { NextRequest, NextResponse } from 'next/server'
import { validateLogin } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/auth/login', 'LOGIN')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Too many login attempts',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate login data
    const validation = validateLogin(body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid login data',
        details: validation.details || validation.error,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Attempt login
    const client = await getSupabaseClient()
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: data.user?.user_metadata?.role || 'user'
        },
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        } : null
      },
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: `${responseTime}ms`,
        rateLimitRemaining: rateLimitResult.remaining
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error('Login failed', {
      clientIP,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    timestamp: new Date().toISOString()
  }, { status: 405 })
}