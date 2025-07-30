import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check all possible environment variable names
    const possibleUrls = [
      process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.POSTGRES_SUPABASE_URL,
    ].filter(Boolean)

    const possibleKeys = [
      process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      process.env.POSTGRES_SUPABASE_ANON_KEY,
    ].filter(Boolean)

    const supabaseUrl = possibleUrls[0] || ''
    const supabaseAnonKey = possibleKeys[0] || ''

    // Comprehensive logging
    console.log('🔧 [API] Supabase Config Check:', {
      availableUrls: possibleUrls.length,
      availableKeys: possibleKeys.length,
      finalUrl: supabaseUrl ? 'SET' : 'EMPTY',
      finalKey: supabaseAnonKey ? 'SET' : 'EMPTY',
      envVars: {
        POSTGRES_NEXT_PUBLIC_SUPABASE_URL: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'EMPTY',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'EMPTY',
        POSTGRES_SUPABASE_URL: process.env.POSTGRES_SUPABASE_URL ? 'SET' : 'EMPTY',
        POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
        POSTGRES_SUPABASE_ANON_KEY: process.env.POSTGRES_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
      }
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ [API] No valid Supabase configuration found')
      return NextResponse.json(
        { 
          error: 'Supabase configuration not available',
          availableUrls: possibleUrls.length,
          availableKeys: possibleKeys.length,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      supabaseUrl,
      supabaseAnonKey,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ [API] Error in Supabase config API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}