import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = await request.json()

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'URL, Anon Key y Service Role Key son requeridos' },
        { status: 400 }
      )
    }

    // Test connection with anon key
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // Simple connection test
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        { success: false, error: `Error de conexión con Anon Key: ${error.message}` },
        { status: 400 }
      )
    }
    
    // Test access to app_settings (RLS should be disabled)
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('count')
      .limit(1)
    
    if (settingsError) {
      return NextResponse.json(
        { success: false, error: `Error de acceso a app_settings: ${settingsError.message}` },
        { status: 400 }
      )
    }
    
    // If both work, connection is successful
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa'
    })

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa'
    })

  } catch (error) {
    console.error('Setup test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}