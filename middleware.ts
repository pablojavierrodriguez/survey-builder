import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for setup page and API routes
  if (pathname.startsWith('/setup') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check if we're trying to access admin routes
  if (pathname.startsWith('/admin')) {
    // Check for Supabase configuration in cookies or headers
    const hasSupabaseConfig = request.cookies.has('supabase_configured') || 
                             request.headers.get('x-supabase-configured') === 'true'

    if (!hasSupabaseConfig) {
      // Redirect to setup wizard
      const setupUrl = new URL('/setup', request.url)
      setupUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(setupUrl)
    }
  }

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