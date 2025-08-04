import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveLocalConfig } from '@/lib/local-config'
import { clearSupabaseCache } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, publicUrl, appName } = await request.json()

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'URL, Anon Key y Service Role Key son requeridos' },
        { status: 400 }
      )
    }

    // Test connection with anon key first
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json(
        { success: false, error: `Error de conexión con Anon Key: ${testError.message}` },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS during setup
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // Update configuration using service role (bypasses RLS)
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        environment: 'dev',
        survey_table_name: 'pc_survey_data_dev',
        app_name: appName || 'Product Community Survey (DEV)',
        settings: {
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
      }, {
        onConflict: 'environment'
      })

    if (updateError) {
      console.error('🔧 [Setup] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar configuración: ${updateError.message}` },
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