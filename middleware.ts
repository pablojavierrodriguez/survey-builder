import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // HTTPS enforcement
  if (process.env.FORCE_HTTPS === 'true' && 
      request.headers.get('x-forwarded-proto') !== 'https' && 
      process.env.NODE_ENV === 'production') {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl)
  }

  // Security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS header for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // CORS handling for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }

  // Protected admin routes
  if (pathname.startsWith('/admin')) {
    // Skip auth check for login page
    if (pathname === '/admin' || pathname.startsWith('/auth/')) {
      return response
    }

    try {
      const user = await getCurrentUser(request)
      
      if (!user) {
        // Redirect to login
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check role-based access
      if (pathname.startsWith('/admin/dashboard') || 
          pathname.startsWith('/admin/database') || 
          pathname.startsWith('/admin/settings') ||
          pathname.startsWith('/admin/survey-config')) {
        if (user.role !== 'admin') {
          return NextResponse.redirect(new URL('/admin/access-denied', request.url))
        }
      }

    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Rate limiting headers for survey submission
  if (pathname === '/api/survey/submit' || pathname.startsWith('/api/auth/')) {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    'unknown'
    
    // Add rate limiting headers
    response.headers.set('X-RateLimit-Limit', '5')
    response.headers.set('X-RateLimit-Remaining', '4')
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString())
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}