import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/analytics', 'ADMIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/admin/analytics`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error(`Supabase not configured for IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Get table name from query params or use default
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'survey_data'

    // Fetch analytics data
    const { data: responses, error: responsesError } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (responsesError) {
      console.error(`Failed to fetch analytics data for IP ${clientIP}:`, responsesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch analytics data',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Calculate analytics
    const totalResponses = responses?.length || 0
    
    // Role distribution
    const roleDistribution = responses?.reduce((acc: any, response: any) => {
      acc[response.role] = (acc[response.role] || 0) + 1
      return acc
    }, {}) || {}

    // Seniority distribution
    const seniorityDistribution = responses?.reduce((acc: any, response: any) => {
      acc[response.seniority_level] = (acc[response.seniority_level] || 0) + 1
      return acc
    }, {}) || {}

    // Company type distribution
    const companyTypeDistribution = responses?.reduce((acc: any, response: any) => {
      acc[response.company_type] = (acc[response.company_type] || 0) + 1
      return acc
    }, {}) || {}

    // Industry distribution
    const industryDistribution = responses?.reduce((acc: any, response: any) => {
      acc[response.industry] = (acc[response.industry] || 0) + 1
      return acc
    }, {}) || {}

    // Product type distribution
    const productTypeDistribution = responses?.reduce((acc: any, response: any) => {
      acc[response.product_type] = (acc[response.product_type] || 0) + 1
      return acc
    }, {}) || {}

    // Customer segment distribution
    const customerSegmentDistribution = responses?.reduce((acc: any, response: any) => {
      acc[response.customer_segment] = (acc[response.customer_segment] || 0) + 1
      return acc
    }, {}) || {}

    // Tools usage
    const toolsUsage = responses?.reduce((acc: any, response: any) => {
      if (response.tools && Array.isArray(response.tools)) {
        response.tools.forEach((tool: string) => {
          acc[tool] = (acc[tool] || 0) + 1
        })
      }
      return acc
    }, {}) || {}

    // Learning methods
    const learningMethods = responses?.reduce((acc: any, response: any) => {
      if (response.learning_methods && Array.isArray(response.learning_methods)) {
        response.learning_methods.forEach((method: string) => {
          acc[method] = (acc[method] || 0) + 1
        })
      }
      return acc
    }, {}) || {}

    // Salary range distribution
    const salaryDistribution = responses?.reduce((acc: any, response: any) => {
      if (response.salary_range) {
        acc[response.salary_range] = (acc[response.salary_range] || 0) + 1
      }
      return acc
    }, {}) || {}

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentResponses = responses?.filter((response: any) => 
      new Date(response.created_at) > sevenDaysAgo
    ) || []

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

    const duration = Date.now() - startTime
    console.log(`Analytics fetched successfully for IP ${clientIP} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Analytics API error for IP ${clientIP} after ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}