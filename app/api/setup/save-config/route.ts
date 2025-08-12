import { NextRequest, NextResponse } from 'next/server'
import { configManager, AppConfig } from '@/lib/config-manager'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, publicUrl, appName } = await request.json()

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'URL, Anon Key y Service Role Key son requeridos' },
        { status: 400 }
      )
    }

    // Create configuration object
    const config: AppConfig = {
      database: {
        url: supabaseUrl,
        apiKey: supabaseKey,
        serviceRoleKey: serviceRoleKey,
        tableName: 'survey_data',
        environment: 'development'
      },
      general: {
        appName: appName || 'Survey App',
        publicUrl: publicUrl || 'http://localhost:3000',
        maintenanceMode: false,
        analyticsEnabled: true
      }
    }

    // Save configuration using ConfigManager
    const { success, savedTo } = await configManager.saveConfig(config)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Error al guardar configuración' },
        { status: 500 }
      )
    }

    console.log(`✅ Configuration saved to: ${savedTo.join(', ')}`)

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      savedTo,
      clearCache: true
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
