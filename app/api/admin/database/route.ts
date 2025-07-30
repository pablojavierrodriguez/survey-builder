import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

// Get Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      '/api/admin/database',
      'ADMIN'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Rate limit exceeded',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }

    const client = getSupabaseClient()
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Get table name from query params or use default
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'survey_data'

    // Fetch survey responses
    const { data: responses, error: responsesError } = await client
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching survey responses:', responsesError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch survey responses',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        data: responses || [],
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Database GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      '/api/admin/database',
      'ADMIN'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Rate limit exceeded',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }

    const client = getSupabaseClient()
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { id, tableName = 'survey_data' } = body

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Response ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete the response
    const { error: deleteError } = await client
      .from(tableName)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting response:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete response',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Response deleted successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Database DELETE error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}