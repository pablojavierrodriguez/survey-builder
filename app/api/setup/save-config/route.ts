import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveLocalConfig } from '@/lib/local-config'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, publicUrl, appName } = await request.json()

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'URL y API Key son requeridos' },
        { status: 400 }
      )
    }

    // Test connection first
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json(
        { success: false, error: `Error de conexión: ${testError.message}` },
        { status: 400 }
      )
    }

    // First, try to delete any existing configuration to avoid conflicts
    await supabase
      .from('app_settings')
      .delete()
      .eq('environment', 'dev')

    // Then insert the new configuration
    const { error: saveError } = await supabase
      .from('app_settings')
      .insert({
        environment: 'dev',
        settings: {
          database: {
            url: supabaseUrl,
            apiKey: supabaseKey,
            tableName: 'survey_responses',
            environment: 'development'
          },
          general: {
            surveyTitle: appName || 'My Survey',
            publicUrl: publicUrl || '',
            maintenanceMode: false,
            analyticsEnabled: true,
            debugMode: false
          }
        }
      })

    // Save configuration locally for bootstrap
    if (!saveError) {
      saveLocalConfig(supabaseUrl, supabaseKey)
    }

    if (saveError) {
      return NextResponse.json(
        { success: false, error: `Error al guardar: ${saveError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('Setup save config error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}