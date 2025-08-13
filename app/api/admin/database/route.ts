import { NextRequest, NextResponse } from 'next/server'
import { configManager } from '@/lib/config-manager'

export async function GET(request: NextRequest) {
  try {
    // Get configuration from ConfigManager
    const config = await configManager.getConfig()
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 404 }
      )
    }

    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Could not initialize Supabase client' },
        { status: 500 }
      )
    }

    // Get database info
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      return NextResponse.json(
        { success: false, error: `Error fetching database info: ${tablesError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: config.database.url,
        environment: config.database.environment,
        tables: tables?.map(t => t.table_name) || []
      }
    })

  } catch (error) {
    console.error('Database API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
