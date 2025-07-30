import { NextRequest, NextResponse } from 'next/server'
import { 
  handleApiError, 
  withRateLimit, 
  withDatabaseConnection,
  formatSuccessResponse,
  createConfigurationError,
  createDatabaseError
} from '@/lib/error-handler'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestLogger = logger.createRequestLogger(request)
  
  try {
    await requestLogger.info('Analytics GET request received')

    // Rate limiting
    const rateLimitCheck = await withRateLimit(request, 'ADMIN')
    if (!rateLimitCheck.allowed) {
      await requestLogger.warn('Rate limit exceeded for analytics GET')
      return NextResponse.json(rateLimitCheck.error, { status: 429 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      await requestLogger.error('Supabase not configured for analytics')
      throw createConfigurationError('Database not configured')
    }

    // Get table name from query params or use default
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'survey_data'

    // Fetch analytics data with error handling
    const dbResult = await withDatabaseConnection(request, async () => {
      const { data: responses, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return responses || []
    })

    if (!dbResult.success) {
      await requestLogger.error('Failed to fetch analytics data from database', {
        error: dbResult.error?.message,
        tableName
      })
      return NextResponse.json(dbResult.error, { status: 500 })
    }

    const responses = dbResult.data

    // Calculate analytics
    const totalResponses = responses.length
    
    // Role distribution
    const roleDistribution = responses.reduce((acc: any, response: any) => {
      acc[response.role] = (acc[response.role] || 0) + 1
      return acc
    }, {})

    // Seniority distribution
    const seniorityDistribution = responses.reduce((acc: any, response: any) => {
      acc[response.seniority_level] = (acc[response.seniority_level] || 0) + 1
      return acc
    }, {})

    // Company type distribution
    const companyTypeDistribution = responses.reduce((acc: any, response: any) => {
      acc[response.company_type] = (acc[response.company_type] || 0) + 1
      return acc
    }, {})

    // Industry distribution
    const industryDistribution = responses.reduce((acc: any, response: any) => {
      acc[response.industry] = (acc[response.industry] || 0) + 1
      return acc
    }, {})

    // Product type distribution
    const productTypeDistribution = responses.reduce((acc: any, response: any) => {
      acc[response.product_type] = (acc[response.product_type] || 0) + 1
      return acc
    }, {})

    // Customer segment distribution
    const customerSegmentDistribution = responses.reduce((acc: any, response: any) => {
      acc[response.customer_segment] = (acc[response.customer_segment] || 0) + 1
      return acc
    }, {})

    // Tools usage
    const toolsUsage = responses.reduce((acc: any, response: any) => {
      if (response.tools && Array.isArray(response.tools)) {
        response.tools.forEach((tool: string) => {
          acc[tool] = (acc[tool] || 0) + 1
        })
      }
      return acc
    }, {})

    // Learning methods
    const learningMethods = responses.reduce((acc: any, response: any) => {
      if (response.learning_methods && Array.isArray(response.learning_methods)) {
        response.learning_methods.forEach((method: string) => {
          acc[method] = (acc[method] || 0) + 1
        })
      }
      return acc
    }, {})

    // Salary range distribution
    const salaryDistribution = responses.reduce((acc: any, response: any) => {
      if (response.salary_range) {
        acc[response.salary_range] = (acc[response.salary_range] || 0) + 1
      }
      return acc
    }, {})

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentResponses = responses.filter((response: any) => 
      new Date(response.created_at) > sevenDaysAgo
    )

    const analyticsData = {
      totalResponses,
      roleDistribution,
      seniorityDistribution,
      companyTypeDistribution,
      industryDistribution,
      productTypeDistribution,
      customerSegmentDistribution,
      toolsUsage,
      learningMethods,
      salaryDistribution,
      recentActivity: {
        last7Days: recentResponses.length,
        responses: recentResponses.slice(0, 10) // Last 10 responses
      }
    }

    await requestLogger.info('Analytics data fetched successfully', {
      totalResponses,
      tableName,
      duration: Date.now() - requestLogger.startTime
    })

    return NextResponse.json(formatSuccessResponse(analyticsData, requestLogger.requestId))

  } catch (error) {
    return await handleApiError(error, request)
  }
}