import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/database', 'ADMIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/admin/database`)
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
    const tableName = searchParams.get('table') || 'pc_survey_data_dev'

    // Fetch survey responses
    const { data: responses, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Failed to fetch responses for IP ${clientIP}:`, error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch responses',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Responses fetched successfully for IP ${clientIP} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      data: responses || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Database GET error for IP ${clientIP} after ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/database', 'ADMIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/admin/database`)
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

    // Parse request body
    const body = await request.json()
          const { id, tableName = 'pc_survey_data_dev' } = body

    if (!id) {
      console.warn(`Missing response ID for deletion by IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Response ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Delete the response
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Failed to delete response for IP ${clientIP}:`, error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete response',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Response deleted successfully for IP ${clientIP} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Database DELETE error for IP ${clientIP} after ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}