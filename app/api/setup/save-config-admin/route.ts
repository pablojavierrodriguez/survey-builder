import { NextRequest, NextResponse } from 'next/server'
import { configManager, AppConfig } from '@/lib/config-manager'

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, adminPassword, publicUrl, appName } = await request.json()

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña de admin son requeridos' },
        { status: 400 }
      )
    }

    // For admin login method, we need to get the Supabase URL from environment or use a default
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'NEXT_PUBLIC_SUPABASE_URL no está configurado' },
        { status: 400 }
      )
    }

    // Create configuration object
    const config: AppConfig = {
      database: {
        url: supabaseUrl,
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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