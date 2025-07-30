import { NextRequest, NextResponse } from 'next/server'
import { validateLogin } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/auth/login', 'LOGIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Login rate limit exceeded for IP ${clientIP}: ${rateLimitResult.error}`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate login data
    const validation = validateLogin(body)
    if (!validation.success) {
      console.warn(`Login validation failed for IP ${clientIP}:`, validation.error)
      return NextResponse.json({
        success: false,
        error: 'Invalid login data',
        details: validation.details,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Attempt login
    const client = await getSupabaseClient()
    if (!client) {
      console.error(`Supabase client not available for login attempt from IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // validation.data is guaranteed to exist if validation.success is true
    const validatedData = validation.data!
    const { data, error } = await client.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      console.warn(`Login failed for IP ${clientIP}:`, error.message)
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    const duration = Date.now() - startTime
    console.log(`Login successful in ${duration}ms for IP ${clientIP}, user: ${data.user?.email}`)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Login API error for IP ${clientIP} after ${duration}ms:`, error)
    
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