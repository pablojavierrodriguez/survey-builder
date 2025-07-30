import { NextRequest, NextResponse } from 'next/server'
import { validateLogin } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      '/api/auth/login',
      'LOGIN'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Too many login attempts',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate login data
    const validation = validateLogin(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error,
          details: validation.details,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Attempt login
    const client = await getSupabaseClient()
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication service unavailable',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    })

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: data.user,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}