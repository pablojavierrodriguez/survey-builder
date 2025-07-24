import { NextRequest, NextResponse } from 'next/server'
import { SupabaseManager } from '@/lib/supabase-simple'

// POST /api/admin/setup-dev - Setup development environment automatically
export async function POST(request: NextRequest) {
  try {
    console.log('Starting dev environment setup...')
    
    const result = await SupabaseManager.setupDevEnvironment()
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.steps.error || 'Setup failed',
          steps: result.steps
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Dev environment setup completed successfully!',
      steps: result.steps
    })

  } catch (error) {
    console.error('Setup dev environment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during setup' 
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/setup-dev - Check dev environment status
export async function GET() {
  try {
    const tableExists = await SupabaseManager.checkDevTableExists()
    
    return NextResponse.json({
      devTableExists: tableExists,
      status: tableExists ? 'ready' : 'setup_needed'
    })

  } catch (error) {
    console.error('Check dev environment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check environment status' 
      },
      { status: 500 }
    )
  }
}