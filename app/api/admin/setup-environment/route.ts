import { NextRequest, NextResponse } from 'next/server'
import { SupabaseManager } from '@/lib/supabase-simple'

// POST /api/admin/setup-environment - Setup environment automatically based on branch
export async function POST(request: NextRequest) {
  try {
    const { environment } = await request.json()
    const isDev = environment === 'dev' || environment === 'development'
    
    console.log(`Starting ${isDev ? 'dev' : 'main'} environment setup...`)
    
    const result = await SupabaseManager.setupEnvironment(isDev)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.steps.error || 'Setup failed',
          steps: result.steps,
          environment: isDev ? 'dev' : 'main'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${isDev ? 'Dev' : 'Main'} environment setup completed successfully!`,
      steps: result.steps,
      environment: isDev ? 'dev' : 'main',
      details: {
        tableName: isDev ? 'pc_survey_data_dev' : 'pc_survey_data',
        sampleData: isDev ? 'Included' : 'Not included (production)',
        features: ['Table created', 'Indexes added', 'RLS enabled', 'Policies configured']
      }
    })

  } catch (error) {
    console.error('Setup environment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during setup' 
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/setup-environment - Check environment status
export async function GET() {
  try {
    const devTableExists = await SupabaseManager.checkDevTableExists()
    const mainTableExists = await SupabaseManager.checkMainTableExists()
    
    return NextResponse.json({
      dev: {
        tableExists: devTableExists,
        tableName: 'pc_survey_data_dev',
        status: devTableExists ? 'ready' : 'setup_needed'
      },
      main: {
        tableExists: mainTableExists,
        tableName: 'pc_survey_data',
        status: mainTableExists ? 'ready' : 'setup_needed'
      },
      recommendation: {
        devNeeded: !devTableExists,
        mainNeeded: !mainTableExists,
        message: !devTableExists && !mainTableExists 
          ? 'Both environments need setup'
          : !devTableExists 
            ? 'Only dev environment needs setup'
            : !mainTableExists
              ? 'Only main environment needs setup'
              : 'All environments are ready'
      }
    })

  } catch (error) {
    console.error('Check environment status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check environment status' 
      },
      { status: 500 }
    )
  }
}
