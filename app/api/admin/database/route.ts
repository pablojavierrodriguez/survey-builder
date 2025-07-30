import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleGetResponses(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'GET /api/admin/database')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/database', 'ADMIN')
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
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    // Get table name from query params or use default
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'survey_data'

    requestLogger.info('Fetching database responses', { 
      ip: clientIP,
      tableName 
    })

    // Fetch survey responses
    const { data: responses, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      requestLogger.error('Failed to fetch responses', error, { 
        ip: clientIP,
        tableName 
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch responses' },
        { status: 500 }
      )
    }

    requestLogger.info('Responses fetched successfully', { 
      ip: clientIP,
      count: responses?.length || 0,
      tableName 
    })

    return NextResponse.json({
      success: true,
      data: responses || []
    })

  } catch (error) {
    requestLogger.error('Unexpected error fetching responses', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleDeleteResponse(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'DELETE /api/admin/database')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/database', 'ADMIN')
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
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { id, tableName = 'survey_data' } = body

    if (!id) {
      requestLogger.warn('Delete request missing ID', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Response ID is required' },
        { status: 400 }
      )
    }

    requestLogger.info('Deleting response', { 
      ip: clientIP,
      responseId: id,
      tableName 
    })

    // Delete the response
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      requestLogger.error('Failed to delete response', error, { 
        ip: clientIP,
        responseId: id,
        tableName 
      })
      return NextResponse.json(
        { success: false, error: 'Failed to delete response' },
        { status: 500 }
      )
    }

    requestLogger.info('Response deleted successfully', { 
      ip: clientIP,
      responseId: id,
      tableName 
    })

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully'
    })

  } catch (error) {
    requestLogger.error('Unexpected error deleting response', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handlers
export const GET = withLogging(handleGetResponses)
export const DELETE = withLogging(handleDeleteResponse)