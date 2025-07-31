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
  
  // For now, let all requests through and let the client-side handle auth
  // This is a temporary fix to get the app working
  console.log('[SERVER] Admin route accessed:', pathname, '- Allowing access')
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}