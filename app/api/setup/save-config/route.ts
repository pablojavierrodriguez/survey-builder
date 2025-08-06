import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, publicUrl, appName } = await request.json()

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'URL, Anon Key y Service Role Key son requeridos' },
        { status: 400 }
      )
    }

    // Use service role key for setup
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // Save configuration to database
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        environment: 'dev',
        survey_table_name: 'survey_data',
        app_name: appName || 'Survey App',
        settings: {
          database: {
            url: supabaseUrl,
            apiKey: supabaseKey,
            tableName: 'survey_data',
            environment: 'development'
          },
          general: {
            appName: appName || 'Survey App',
            publicUrl: publicUrl || '',
            maintenanceMode: false,
            analyticsEnabled: true
          }
        }
      })
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: `Error al guardar configuración: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}