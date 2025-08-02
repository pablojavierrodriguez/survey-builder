import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { getTableName } from '@/lib/config-manager'

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

    // Try to use optimized RPC function first
    const dbStartTime = Date.now()
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_paginated_survey_data', {
        table_name: tableName,
        page_limit: limit,
        page_offset: offset,
        filters: filters
      })

    const dbDuration = Date.now() - dbStartTime

    if (rpcError) {
      logger.warn('RPC function not available, falling back to direct query', {
        requestId,
        ip,
        error: rpcError.message
      })

      // Fallback to direct query with filters
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
      logger.info('Database data fetched successfully (fallback)', {
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
    }

    // Use RPC result
    logger.logDatabaseOperation('RPC', 'get_paginated_survey_data', true, dbDuration)
    logger.info('Database data fetched successfully via RPC', {
      requestId,
      ip,
      page,
      limit,
      tableName,
      filters
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      data: rpcData
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