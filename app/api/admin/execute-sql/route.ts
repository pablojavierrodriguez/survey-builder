import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({
        error: 'SQL command is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Execute the SQL command
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      logger.error('SQL execution error:', error)
      return NextResponse.json({
        error: 'SQL execution failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'SQL executed successfully',
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Execute SQL error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}