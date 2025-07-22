import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken, setAuthCookie, checkRateLimit, resetRateLimit } from '@/lib/auth'
import { validateAndSanitize, loginSchema } from '@/lib/validation'
import { headers } from 'next/headers'

// Force Node.js runtime for authentication
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = headers()
    const clientIP = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    request.ip || 
                    'unknown'
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900'
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateAndSanitize(loginSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    // Authenticate user
    const user = await authenticateUser(username, password)
    
    if (!user) {
      // Log failed attempt for security monitoring
      console.warn(`Failed login attempt for username: ${username} from IP: ${clientIP}`)
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Reset rate limiting on successful login
    resetRateLimit(clientIP)

    // Generate JWT token
    const token = generateToken(user)
    
    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      },
      message: 'Login successful'
    })

    // Set secure cookie
    setAuthCookie(response, token)

    // Log successful login
    console.log(`Successful login for user: ${username} from IP: ${clientIP}`)

    return response

  } catch (error) {
    console.error('Login API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}