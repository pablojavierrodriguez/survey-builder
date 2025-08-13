import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for setup page, API routes, auth routes, and static files
  if (pathname.startsWith('/setup') || 
      pathname.startsWith('/api/') || 
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/_next/') ||
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // For now, let all requests through and let client-side handle configuration
  // This prevents middleware from interfering with authentication flow
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
