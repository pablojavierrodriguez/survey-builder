import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveLocalConfig } from '@/lib/local-config'
import { clearSupabaseCache } from '@/lib/supabase'

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

    // Update configuration using the new function (no ALTER TABLE needed)
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_app_settings', {
        target_environment: 'dev',
        new_settings: {
          database: {
            url: supabaseUrl,
            apiKey: supabaseKey,
            tableName: 'pc_survey_data_dev',
            environment: 'development'
          },
          general: {
            appName: appName || 'Product Community Survey (DEV)',
            publicUrl: publicUrl || '',
            maintenanceMode: false,
            analyticsEnabled: true,
            debugMode: true
          }
        }
      })

    if (updateError) {
      console.error('🔧 [Setup] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar configuración: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Parse the result
    let result
    try {
      result = typeof updateResult === 'string' ? JSON.parse(updateResult) : updateResult
    } catch (parseError) {
      result = updateResult
    }

    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || 'Error desconocido al actualizar configuración' },
        { status: 500 }
      )
    }

    // Save configuration locally for bootstrap and clear cache
    saveLocalConfig(supabaseUrl, supabaseKey)
    clearSupabaseCache()

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