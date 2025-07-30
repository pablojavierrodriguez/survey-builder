import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleGetAnalytics(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'GET /api/admin/analytics')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/analytics', 'ADMIN')
    if (!rateLimitResult.allowed) {
      requestLogger.warn('Rate limit exceeded', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      requestLogger.error('Supabase not configured', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Analytics service unavailable' },
        { status: 503 }
      )
    }

    // Get table name from query params or use default
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'survey_data'

    requestLogger.info('Fetching analytics data', { 
      ip: clientIP,
      tableName 
    })

    // Fetch survey data
    const { data: surveyData, error: surveyError } = await supabase
      .from(tableName)
      .select('*')

    if (surveyError) {
      requestLogger.error('Failed to fetch survey data', surveyError, { 
        ip: clientIP,
        tableName 
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Process analytics data
    const analytics = {
      totalResponses: surveyData.length,
      roles: {} as Record<string, number>,
      seniorityLevels: {} as Record<string, number>,
      companyTypes: {} as Record<string, number>,
      industries: {} as Record<string, number>,
      productTypes: {} as Record<string, number>,
      customerSegments: {} as Record<string, number>,
      tools: {} as Record<string, number>,
      learningMethods: {} as Record<string, number>,
      salaryRanges: {} as Record<string, number>,
      challenges: [] as string[],
      recentResponses: surveyData.slice(-10).reverse()
    }

    // Aggregate data
    surveyData.forEach(response => {
      // Count roles
      analytics.roles[response.role] = (analytics.roles[response.role] || 0) + 1
      
      // Count seniority levels
      analytics.seniorityLevels[response.seniority_level] = (analytics.seniorityLevels[response.seniority_level] || 0) + 1
      
      // Count company types
      analytics.companyTypes[response.company_type] = (analytics.companyTypes[response.company_type] || 0) + 1
      
      // Count industries
      analytics.industries[response.industry] = (analytics.industries[response.industry] || 0) + 1
      
      // Count product types
      analytics.productTypes[response.product_type] = (analytics.productTypes[response.product_type] || 0) + 1
      
      // Count customer segments
      analytics.customerSegments[response.customer_segment] = (analytics.customerSegments[response.customer_segment] || 0) + 1
      
      // Count tools
      if (response.tools && Array.isArray(response.tools)) {
        response.tools.forEach(tool => {
          analytics.tools[tool] = (analytics.tools[tool] || 0) + 1
        })
      }
      
      // Count learning methods
      if (response.learning_methods && Array.isArray(response.learning_methods)) {
        response.learning_methods.forEach(method => {
          analytics.learningMethods[method] = (analytics.learningMethods[method] || 0) + 1
        })
      }
      
      // Count salary ranges
      if (response.salary_range) {
        analytics.salaryRanges[response.salary_range] = (analytics.salaryRanges[response.salary_range] || 0) + 1
      }
      
      // Collect challenges
      if (response.main_challenge) {
        analytics.challenges.push(response.main_challenge)
      }
    })

    requestLogger.info('Analytics data processed successfully', { 
      ip: clientIP,
      totalResponses: analytics.totalResponses,
      tableName 
    })

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    requestLogger.error('Unexpected error fetching analytics', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const GET = withLogging(handleGetAnalytics)