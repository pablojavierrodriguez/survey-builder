import { NextRequest, NextResponse } from 'next/server'
import { validateSignUp } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      '/api/auth/signup',
      'LOGIN'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Too many signup attempts',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate signup data
    const validation = validateSignUp(body)
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

    // Attempt signup
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

    const { data, error } = await client.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
    })

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Signup failed',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account created successfully',
        user: data.user,
        timestamp: new Date().toISOString()
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Signup error:', error)
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