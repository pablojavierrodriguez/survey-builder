import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey } = await request.json()

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'URL y API Key son requeridos' },
        { status: 400 }
      )
    }

    // Test connection
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Try to fetch a simple query to test connection
    // Use a more basic test that doesn't depend on specific tables
    const { data, error } = await supabase
      .rpc('version')

    if (error) {
      // If RPC fails, try a simple auth test
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        return NextResponse.json(
          { success: false, error: `Error de conexión: ${authError.message}` },
          { status: 400 }
        )
      }
      
      // If auth works, connection is successful
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa (auth test)'
      })
    }

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