import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie, getCurrentUser } from '@/lib/auth'

// Force Node.js runtime for authentication
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get current user (optional, for logging)
    const user = await getCurrentUser(request)
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear authentication cookie
    clearAuthCookie(response)

    // Log successful logout
    if (user) {
      console.log(`User ${user.username} logged out successfully`)
    }

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    
    // Even if there's an error, clear the cookie
    const response = NextResponse.json(
      { success: true, message: 'Logout completed' },
      { status: 200 }
    )
    
    clearAuthCookie(response)
    return response
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