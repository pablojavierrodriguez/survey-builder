import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check all possible environment variables
    const envVars = {
      // Supabase variables
      POSTGRES_NEXT_PUBLIC_SUPABASE_URL: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'EMPTY',
      POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
      POSTGRES_SUPABASE_URL: process.env.POSTGRES_SUPABASE_URL ? 'SET' : 'EMPTY',
      POSTGRES_SUPABASE_ANON_KEY: process.env.POSTGRES_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
      
      // App variables
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_DB_TABLE: process.env.NEXT_PUBLIC_DB_TABLE ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV ? 'SET' : 'EMPTY',
      
      // Other variables
      NODE_ENV: process.env.NODE_ENV || 'EMPTY',
      VERCEL_ENV: process.env.VERCEL_ENV || 'EMPTY',
      VERCEL_URL: process.env.VERCEL_URL || 'EMPTY',
    }

    // Count available variables
    const availableCount = Object.values(envVars).filter(v => v === 'SET').length
    const totalCount = Object.keys(envVars).length

    console.log('🔍 [DEBUG] Environment Variables Check:', {
      available: availableCount,
      total: totalCount,
      variables: envVars
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      availableCount,
      totalCount,
      variables: envVars,
      // Show actual values for debugging (be careful with sensitive data)
      actualValues: {
        POSTGRES_NEXT_PUBLIC_SUPABASE_URL: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 'EMPTY',
        POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          `${process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'EMPTY',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'EMPTY',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'EMPTY',
      }
    })
  } catch (error) {
    console.error('❌ [DEBUG] Error in environment debug API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}