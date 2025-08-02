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

    // Use the setup function to handle configuration
    const { data: setupResult, error: setupError } = await supabase
      .rpc('setup_initial_config', {
        supabase_url: supabaseUrl,
        supabase_key: supabaseKey,
        public_url: publicUrl,
        app_name: appName
      })

    if (setupError) {
      return NextResponse.json(
        { success: false, error: `Error al guardar: ${setupError.message}` },
        { status: 500 }
      )
    }

    if (!setupResult?.success) {
      return NextResponse.json(
        { success: false, error: setupResult?.error || 'Error desconocido al guardar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: setupResult.message || 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('Setup save config error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}