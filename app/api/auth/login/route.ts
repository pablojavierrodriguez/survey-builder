import { NextRequest, NextResponse } from 'next/server'
import { validateLogin } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/auth/login', 'LOGIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/auth/login`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
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

    // Check if Supabase is configured
    if (!supabase) {
      console.error(`Supabase not configured for IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data!.email,
      password: validation.data!.password,
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
    console.log(`Login successful for IP ${clientIP} in ${duration}ms`)

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