import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'
import { configManager } from '@/lib/config-manager'
import { getUserRoleFromProfile } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
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
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).limit(1).maybeSingle()
    const role = getUserRoleFromProfile(profile || null, session.user.email)
    if (role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
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
