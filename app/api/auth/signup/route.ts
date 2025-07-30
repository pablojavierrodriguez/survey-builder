import { NextRequest, NextResponse } from 'next/server'
import { validateSignUp } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleSignUp(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'POST /api/auth/signup')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/auth/signup', 'LOGIN')
    if (!rateLimitResult.allowed) {
      requestLogger.warn('Rate limit exceeded', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate signup data
    const validation = validateSignUp(body)
    if (!validation.success) {
      requestLogger.warn('Signup validation failed', { 
        errors: validation.details,
        ip: clientIP 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid signup data',
          details: validation.details 
        },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      requestLogger.error('Supabase not configured', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 503 }
      )
    }

    const { email, password } = validation.data

    requestLogger.info('Signup attempt', { 
      ip: clientIP,
      email 
    })

    // Attempt signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      requestLogger.warn('Signup failed', error, { 
        ip: clientIP,
        email 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to create account' 
        },
        { status: 400 }
      )
    }

    requestLogger.info('Signup successful', { 
      ip: clientIP,
      userId: data.user?.id,
      email 
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: data.user,
        session: data.session
      }
    })

  } catch (error) {
    requestLogger.error('Unexpected error during signup', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const POST = withLogging(handleSignUp)