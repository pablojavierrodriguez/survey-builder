import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get Supabase configuration from server-side environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    
    // Return configuration (anon key is safe to expose to client)
    return NextResponse.json({
      supabaseUrl,
      supabaseAnonKey,
      tableName: process.env.NEXT_PUBLIC_DB_TABLE || "survey_data",
      environment: process.env.NODE_ENV || "production"
    })
  } catch (error) {
    console.error('Error fetching Supabase config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Supabase configuration' },
      { status: 500 }
    )
  }
}