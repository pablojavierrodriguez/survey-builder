import { NextRequest, NextResponse } from 'next/server'
import { configManager } from '@/lib/config-manager'

export async function GET(request: NextRequest) {
  try {
    // Get configuration from ConfigManager
    const config = await configManager.getConfig()
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 404 }
      )
    }

    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Could not initialize Supabase client' },
        { status: 500 }
      )
    }

    // Get analytics data
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_data')
      .select('*')
      .order('created_at', { ascending: false })

    if (surveyError) {
      return NextResponse.json(
        { success: false, error: `Error fetching survey data: ${surveyError.message}` },
        { status: 500 }
      )
    }

    // Calculate analytics
    const totalResponses = surveyData?.length || 0
    const today = new Date()
    const todayResponses = surveyData?.filter(response => {
      const responseDate = new Date(response.created_at)
      return responseDate.toDateString() === today.toDateString()
    }).length || 0

    return NextResponse.json({
      success: true,
      data: {
        totalResponses,
        todayResponses,
        recentResponses: surveyData?.slice(0, 10) || []
      }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}