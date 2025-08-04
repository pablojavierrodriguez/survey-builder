import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
// Get table name from database settings
async function getTableName(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings')
      .eq('environment', 'dev')
      .single()
    
    if (error || !data?.settings?.database?.tableName) {
      return 'pc_survey_data_dev' // fallback
    }
    
    return data.settings.database.tableName
  } catch (error) {
    return 'pc_survey_data_dev' // fallback
  }
}
import { cacheManager, CACHE_KEYS, CACHE_TTL, getCachedOrFetch } from '@/lib/cache-manager'

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

    // Get dynamic table name from settings
    const tableName = await getTableName()

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Generate cache key
    const cacheKey = cacheManager.generateKey(CACHE_KEYS.ANALYTICS, {
      tableName,
      page,
      limit,
      offset
    })

    // Try to get from cache first
    const cachedData = cacheManager.get(cacheKey)
    if (cachedData) {
      logger.info('Analytics data served from cache', {
        requestId,
        ip,
        cacheKey
      })

      const totalDuration = Date.now() - startTime
      logger.logResponse(requestId, 200, totalDuration)

      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      })
    }

    // Fetch analytics data with optimized single query
    const dbStartTime = Date.now()
    
    // Single optimized query to get all analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_analytics_data', {
        table_name: tableName,
        page_limit: limit,
        page_offset: offset
      })

    if (analyticsError) {
      logger.error('Database error fetching analytics data', {
        requestId,
        ip,
        error: analyticsError.message,
        duration: Date.now() - dbStartTime
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // If the RPC function doesn't exist, fallback to optimized individual queries
    if (!analyticsData) {
      // Optimized: Get total count and basic stats in one query
      const { count: totalResponses, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        logger.error('Database error fetching total responses', {
          requestId,
          ip,
          error: countError.message
        })
        
        return NextResponse.json(
          { success: false, error: 'Failed to fetch analytics data' },
          { status: 500 }
        )
      }

      // Optimized: Get all distribution data in one query with specific columns
      const { data: distributionData, error: distributionError } = await supabase
        .from(tableName)
        .select('role, seniority, company_type, industry, daily_tools, learning_methods')
        .range(offset, offset + limit - 1)

      if (distributionError) {
        logger.error('Database error fetching distribution data', {
          requestId,
          ip,
          error: distributionError.message
        })
        
        return NextResponse.json(
          { success: false, error: 'Failed to fetch analytics data' },
          { status: 500 }
        )
      }

      // Process distribution data
      const roleDistribution: any = {}
      const seniorityDistribution: any = {}
      const companyDistribution: any = {}
      const industryDistribution: any = {}
      const toolsUsage: any = {}
      const learningMethods: any = {}

      distributionData?.forEach(item => {
        // Role distribution
        if (item.role) {
          roleDistribution[item.role] = (roleDistribution[item.role] || 0) + 1
        }

        // Seniority distribution
        if (item.seniority) {
          seniorityDistribution[item.seniority] = (seniorityDistribution[item.seniority] || 0) + 1
        }

        // Company distribution
        if (item.company_type) {
          companyDistribution[item.company_type] = (companyDistribution[item.company_type] || 0) + 1
        }

        // Industry distribution
        if (item.industry) {
          industryDistribution[item.industry] = (industryDistribution[item.industry] || 0) + 1
        }

        // Tools usage (flatten arrays)
        if (item.daily_tools && Array.isArray(item.daily_tools)) {
          item.daily_tools.forEach((tool: string) => {
            toolsUsage[tool] = (toolsUsage[tool] || 0) + 1
          })
        }

        // Learning methods (flatten arrays)
        if (item.learning_methods && Array.isArray(item.learning_methods)) {
          item.learning_methods.forEach((method: string) => {
            learningMethods[method] = (learningMethods[method] || 0) + 1
          })
        }
      })

      // Get recent responses (optimized with limit)
      const { data: recentResponses, error: recentError } = await supabase
        .from(tableName)
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

      const result = {
        totalResponses: totalResponses || 0,
        roleDistribution,
        seniorityDistribution,
        companyDistribution,
        industryDistribution,
        toolsUsage,
        learningMethods,
        recentResponses: recentResponses || [],
        pagination: {
          page,
          limit,
          total: totalResponses || 0,
          totalPages: Math.ceil((totalResponses || 0) / limit)
        }
      }

      // Cache the result
      cacheManager.set(cacheKey, result, CACHE_TTL.ANALYTICS)

      const dbDuration = Date.now() - dbStartTime
      logger.logDatabaseOperation('SELECT', tableName, true, dbDuration)
      logger.info('Analytics data fetched successfully', {
        requestId,
        ip,
        totalResponses: result.totalResponses,
        tableName,
        page,
        limit
      })

      const totalDuration = Date.now() - startTime
      logger.logResponse(requestId, 200, totalDuration)

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    // If RPC function exists, use its result and cache it
    cacheManager.set(cacheKey, analyticsData, CACHE_TTL.ANALYTICS)

    const dbDuration = Date.now() - dbStartTime
    logger.logDatabaseOperation('RPC', 'get_analytics_data', true, dbDuration)
    logger.info('Analytics data fetched successfully via RPC', {
      requestId,
      ip,
      tableName,
      page,
      limit
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