import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Get table name from database settings
async function getTableName(): Promise<string> {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return 'survey_responses' // fallback
    }
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings')
      .eq('environment', 'dev')
      .single()
    
    if (error || !data?.settings?.database?.tableName) {
      return 'survey_responses' // fallback
    }
    
    return data.settings.database.tableName
  } catch (error) {
    return 'survey_responses' // fallback
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  logger.logRequest(requestId, 'GET', '/api/debug', 'debug')
  
  try {
    // Get Supabase client
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      })
    }

    // Get dynamic table name from settings
    const tableName = await getTableName()

    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true })

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message,
        timestamp: new Date().toISOString()
      })
    }

    // Get actual data count
    const { count: totalCount, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('id, role, seniority, company_type, industry, created_at')
      .limit(3)

    // Check table schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: tableName })

    const debugInfo = {
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tableName: tableName,
        totalCount: totalCount || 0,
        countError: countError?.message || null
      },
      sampleData: sampleData || [],
      sampleError: sampleError?.message || null,
      schema: schemaData || null,
      schemaError: schemaError?.message || null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
      }
    }

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json(debugInfo)

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Debug endpoint error', {
      requestId,
      error: errorMessage,
      duration: totalDuration
    })

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}