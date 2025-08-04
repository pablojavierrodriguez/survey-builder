import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const tableName = await getTableName()
    
    // Test 1: Direct query
    const { data: directData, error: directError, count: directCount } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10)

    // Test 2: RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_paginated_survey_data', {
        table_name: tableName,
        page_limit: 10,
        page_offset: 0,
        filters: {}
      })

    // Test 3: Quick stats
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_quick_stats', {
        table_name: tableName
      })

    return NextResponse.json({
      success: true,
      debug: {
        tableName,
        directQuery: {
          success: !directError,
          error: directError?.message,
          count: directCount,
          sampleData: directData?.slice(0, 2)
        },
        rpcFunction: {
          success: !rpcError,
          error: rpcError?.message,
          data: rpcData
        },
        quickStats: {
          success: !statsError,
          error: statsError?.message,
          data: statsData
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}