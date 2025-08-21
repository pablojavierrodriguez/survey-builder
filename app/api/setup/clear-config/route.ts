import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSafeEnvironmentConfig } from '@/lib/env.server'

export async function POST(request: NextRequest) {
  try {
    // Get current Supabase client to access the database
    const envConfig = getSafeEnvironmentConfig()
    const supabaseUrl = envConfig.supabase.url
    const supabaseKey = envConfig.supabase.anonKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'No hay configuración de Supabase disponible' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Delete the configuration from app_settings
    const { error: deleteError } = await supabase
      .from('app_settings')
      .delete()
      .eq('environment', 'dev')

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Error al limpiar configuración: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración limpiada exitosamente'
    })

  } catch (error) {
    console.error('Setup clear config error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
