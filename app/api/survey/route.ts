import { NextRequest, NextResponse } from 'next/server'
import { configManager } from '@/lib/config-manager'

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { response_data, session_id, user_agent, ip_address } = body

    if (!response_data) {
      return NextResponse.json(
        { success: false, error: 'Response data is required' },
        { status: 400 }
      )
    }

    // Save survey response
    const { data, error } = await supabase
      .from('survey_data')
      .insert({
        response_data,
        session_id,
        user_agent,
        ip_address
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: `Error saving response: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Survey response saved successfully'
    })

  } catch (error) {
    console.error('Survey API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 503 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get survey responses
    const { data, error, count } = await supabase
      .from('survey_data')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { success: false, error: `Error fetching responses: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        responses: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Survey API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
