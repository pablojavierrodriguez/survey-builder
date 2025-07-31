import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'GET', '/api/admin/analytics', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/admin/analytics', 'ADMIN')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for analytics request', {
        requestId,
        ip,
        error: rateLimitResult.error
      })
      
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      logger.error('Supabase not configured for analytics', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Analytics not available' },
        { status: 503 }
      )
    }

    // Fetch analytics data
    const dbStartTime = Date.now()
    
    // Get total responses
    const { count: totalResponses, error: countError } = await supabase
      .from('pc_survey_data_dev')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      logger.error('Database error fetching total responses', {
        requestId,
        ip,
        error: countError.message,
        duration: Date.now() - dbStartTime
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get role distribution
    const { data: roleData, error: roleError } = await supabase
      .from('pc_survey_data_dev')
      .select('role')

    if (roleError) {
      logger.error('Database error fetching role data', {
        requestId,
        ip,
        error: roleError.message
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get seniority distribution
    const { data: seniorityData, error: seniorityError } = await supabase
      .from('pc_survey_data_dev')
      .select('seniority')

    if (seniorityError) {
      logger.error('Database error fetching seniority data', {
        requestId,
        ip,
        error: seniorityError.message
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get company type distribution
    const { data: companyData, error: companyError } = await supabase
      .from('pc_survey_data_dev')
      .select('company_type')

    if (companyError) {
      logger.error('Database error fetching company data', {
        requestId,
        ip,
        error: companyError.message
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get industry distribution
    const { data: industryData, error: industryError } = await supabase
      .from('pc_survey_data_dev')
      .select('industry')

    if (industryError) {
      logger.error('Database error fetching industry data', {
        requestId,
        ip,
        error: industryError.message
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get tools usage
    const { data: toolsData, error: toolsError } = await supabase
      .from('pc_survey_data_dev')
      .select('daily_tools')

    if (toolsError) {
      logger.error('Database error fetching tools data', {
        requestId,
        ip,
        error: toolsError.message
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get learning methods
    const { data: learningData, error: learningError } = await supabase
      .from('pc_survey_data_dev')
      .select('learning_methods')

    if (learningError) {
      logger.error('Database error fetching learning data', {
        requestId,
        ip,
        error: learningError.message
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    const dbDuration = Date.now() - dbStartTime

    // Process data for charts
    const roleDistribution = roleData?.reduce((acc: any, item) => {
      acc[item.role] = (acc[item.role] || 0) + 1
      return acc
    }, {}) || {}

    const seniorityDistribution = seniorityData?.reduce((acc: any, item) => {
      acc[item.seniority] = (acc[item.seniority] || 0) + 1
      return acc
    }, {}) || {}

    const companyDistribution = companyData?.reduce((acc: any, item) => {
      acc[item.company_type] = (acc[item.company_type] || 0) + 1
      return acc
    }, {}) || {}

    const industryDistribution = industryData?.reduce((acc: any, item) => {
      acc[item.industry] = (acc[item.industry] || 0) + 1
      return acc
    }, {}) || {}

    // Process tools data (flatten arrays)
    const toolsUsage: any = {}
    toolsData?.forEach(item => {
      if (item.daily_tools && Array.isArray(item.daily_tools)) {
        item.daily_tools.forEach((tool: string) => {
          toolsUsage[tool] = (toolsUsage[tool] || 0) + 1
        })
      }
    })

    // Process learning methods data (flatten arrays)
    const learningMethods: any = {}
    learningData?.forEach(item => {
      if (item.learning_methods && Array.isArray(item.learning_methods)) {
        item.learning_methods.forEach((method: string) => {
          learningMethods[method] = (learningMethods[method] || 0) + 1
        })
      }
    })

    // Get recent responses (last 10)
    const { data: recentResponses, error: recentError } = await supabase
      .from('pc_survey_data_dev')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      logger.error('Database error fetching recent responses', {
        requestId,
        ip,
        error: recentError.message
      })
    }

    const analyticsData = {
      totalResponses: totalResponses || 0,
      roleDistribution,
      seniorityDistribution,
      companyDistribution,
      industryDistribution,
      toolsUsage,
      learningMethods,
      recentResponses: recentResponses || []
    }

    logger.logDatabaseOperation('SELECT', 'pc_survey_data_dev', true, dbDuration)
    logger.info('Analytics data fetched successfully', {
      requestId,
      ip,
      totalResponses: analyticsData.totalResponses
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in analytics request', {
      requestId,
      ip,
      error: errorMessage,
      duration: totalDuration
    }, error instanceof Error ? error : undefined)

    logger.logResponse(requestId, 500, totalDuration)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}