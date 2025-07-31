import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.POSTGRES_SUPABASE_URL || ''
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         process.env.POSTGRES_SUPABASE_ANON_KEY || ''
  
  return { supabaseUrl, supabaseAnonKey }
}

// Create Supabase client for middleware
function createSupabaseClient(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only apply middleware to admin routes, skip auth routes completely
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  
  // Create Supabase client
  const supabase = createSupabaseClient(request)
  if (!supabase) {
    console.error('Supabase not configured in middleware')
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  try {
    // Get session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.error('No valid session in middleware:', error)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Check role-based access
    const userRole = profile?.role || 'viewer'
    
    // Define role-based access rules
    const roleAccess = {
      admin: ['/admin/dashboard', '/admin/survey-config', '/admin/database', '/admin/analytics', '/admin/settings'],
      'admin-demo': ['/admin/dashboard', '/admin/analytics', '/admin/settings'],
      collaborator: ['/admin/dashboard', '/admin/analytics', '/admin/survey-config'],
      viewer: ['/admin/analytics']
    }
    
    const allowedPaths = roleAccess[userRole as keyof typeof roleAccess] || []
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path))
    
    if (!isAllowed) {
      // Redirect to appropriate default page based on role
      const defaultPath = userRole === 'admin' || userRole === 'admin-demo' ? '/admin/dashboard' : '/admin/analytics'
      return NextResponse.redirect(new URL(defaultPath, request.url))
    }
    
    // Add user info to headers for use in components
    const response = NextResponse.next()
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-role', userRole)
    
    return response
    
  } catch (error) {
    console.error('Middleware error:', error)
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}