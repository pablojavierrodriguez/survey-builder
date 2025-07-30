import { NextRequest, NextResponse } from 'next/server'
import { validateLogin } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleLogin(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'POST /api/auth/login')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/auth/login', 'LOGIN')
    if (!rateLimitResult.allowed) {
      requestLogger.warn('Rate limit exceeded', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate login data
    const validation = validateLogin(body)
    if (!validation.success) {
      requestLogger.warn('Login validation failed', { 
        errors: validation.details,
        ip: clientIP 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid login data',
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

    requestLogger.info('Login attempt', { 
      ip: clientIP,
      email: email // Log email for security tracking
    })

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      requestLogger.warn('Login failed', error, { 
        ip: clientIP,
        email 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Invalid credentials' 
        },
        { status: 401 }
      )
    }

    requestLogger.info('Login successful', { 
      ip: clientIP,
      userId: data.user?.id,
      email 
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: data.user,
        session: data.session
      }
    })

  } catch (error) {
    requestLogger.error('Unexpected error during login', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const POST = withLogging(handleLogin)