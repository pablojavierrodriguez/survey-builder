import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Save configuration to database (RLS policy handles first-time access)
    const { error: saveError } = await supabase
      .from('app_settings')
      .upsert({
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
      }, {
        onConflict: 'environment'
      })

    // Also set environment variables for immediate use
    // This ensures the app can work right after setup
    if (!saveError) {
      // Set environment variables in the current process
      process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseKey
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