import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Read the setup script
    const fs = require('fs')
    const path = require('path')
    const setupScriptPath = path.join(process.cwd(), 'setup-database-tables.sql')
    
    if (!fs.existsSync(setupScriptPath)) {
      return NextResponse.json({
        error: 'Setup script not found',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    const setupScript = fs.readFileSync(setupScriptPath, 'utf8')
    
    // Execute the setup script
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupScript })
    
    if (error) {
      logger.error('Database setup error:', error)
      return NextResponse.json({
        error: 'Database setup failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Setup database error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}