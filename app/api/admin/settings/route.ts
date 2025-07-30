import { NextRequest, NextResponse } from 'next/server'
import { getConfig, setConfig } from '@/lib/config-manager'

// GET - Fetch app settings (full config)
export async function GET() {
  try {
    const config = await getConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Update app settings (full config)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Validate and map body to AppConfig shape if needed
    const success = await setConfig(body)
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to save app settings' 
      }, { status: 500 })
    }
    return NextResponse.json({ 
      success: true
    })
  } catch (error) {
    console.error('Error in POST /api/admin/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}