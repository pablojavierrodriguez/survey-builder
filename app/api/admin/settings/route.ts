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

    return NextResponse.json({
      success: true,
      data: config,
      environment: config.database.environment,
      source: 'config-manager'
    })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Get current configuration
    const currentConfig = await configManager.getConfig()
    if (!currentConfig) {
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 404 }
      )
    }

    // Update configuration with new settings
    const updatedConfig = {
      ...currentConfig,
      general: {
        ...currentConfig.general,
        ...body.general
      },
      database: {
        ...currentConfig.database,
        ...body.database
      }
    }

    // Save updated configuration
    const { success, savedTo } = await configManager.saveConfig(updatedConfig)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      savedTo
    })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
