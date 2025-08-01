import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { getTableName } from '@/lib/config-manager'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const tableName = await getTableName()
    
    // Get table schema
    const { data: schemaData, error: schemaError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3)

    // Get raw data to see format
    const { data: rawData, error: rawError } = await supabase
      .from(tableName)
      .select('id, role, daily_tools, learning_methods, created_at')
      .limit(2)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tableName,
      schema: {
        hasData: !!schemaData,
        error: schemaError?.message || null
      },
      count: {
        total: totalCount,
        error: countError?.message || null
      },
      sample: {
        data: sampleData,
        error: sampleError?.message || null
      },
      raw: {
        data: rawData,
        error: rawError?.message || null
      },
      debug: {
        tableName,
        supabaseConfigured: !!supabase
      }
    })

  } catch (error) {
    logger.error('Debug database error:', error as Error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}