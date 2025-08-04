import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
// Get table name from database settings
async function getTableName(): Promise<string> {
  if (!supabase) {
    return 'pc_survey_data_dev' // fallback
  }
  
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

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'GET', '/api/admin/database', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/admin/database', 'ADMIN')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for database request', {
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
      logger.error('Supabase not configured for database access', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Database system not available' },
        { status: 503 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const tableName = await getTableName()

    // Build filters from query parameters
    const filters: any = {}
    const filterParams = ['role', 'seniority', 'company_type', 'industry']
    
    filterParams.forEach(param => {
      const value = searchParams.get(param)
      if (value) {
        filters[param] = value
      }
    })

    // Calculate offset
    const offset = (page - 1) * limit

    // Temporarily disable RPC and use direct query only
    const dbStartTime = Date.now()
    
    // Direct query with filters
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { data, error, count } = await query

    const dbDuration = Date.now() - dbStartTime

    if (error) {
      logger.error('Database error fetching data', {
        requestId,
        ip,
        error: error.message,
        duration: dbDuration
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch database data' },
        { status: 500 }
      )
    }

    logger.logDatabaseOperation('SELECT', tableName, true, dbDuration)
    logger.info('Database data fetched successfully', {
      requestId,
      ip,
      totalCount: count,
      page,
      limit,
      tableName,
      filters
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      data: {
        records: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in database request', {
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

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'DELETE', '/api/admin/database', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/admin/database', 'ADMIN')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for database delete request', {
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
      logger.error('Supabase not configured for database delete', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Database system not available' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { id, tableName: requestTableName } = body

    if (!id) {
      logger.warn('Missing ID for database delete', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      )
    }

    // Get dynamic table name from settings
    const tableName = await getTableName()

    // Delete record
    const dbStartTime = Date.now()
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    const dbDuration = Date.now() - dbStartTime

    if (error) {
      logger.error('Database error deleting record', {
        requestId,
        ip,
        error: error.message,
        duration: dbDuration,
        recordId: id
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' },
        { status: 500 }
      )
    }

    logger.logDatabaseOperation('DELETE', tableName, true, dbDuration)
    logger.info('Database record deleted successfully', {
      requestId,
      ip,
      recordId: id,
      tableName
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in database delete request', {
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