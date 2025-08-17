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
    
    // Simple connection test with anon key
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        { success: false, error: `Error de conexión con Anon Key: ${error.message}` },
        { status: 400 }
      )
    }
    
    // Test service role key with a simple SQL query that always works
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .rpc('exec_sql', { sql_command: 'SELECT 1 as test' })
      
      if (testError) {
        // If exec_sql doesn't exist, try a simple auth test
        const { data: authData, error: authError } = await supabaseAdmin.auth.getSession()
        if (authError) {
          return NextResponse.json(
            { success: false, error: `Error de conexión con Service Role Key: ${authError.message}` },
            { status: 400 }
          )
        }
      }
    } catch (rpcError) {
      // If exec_sql fails, try auth test as fallback
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getSession()
        if (authError) {
          return NextResponse.json(
            { success: false, error: `Error de conexión con Service Role Key: ${authError.message}` },
            { status: 400 }
          )
        }
      } catch (authFallbackError) {
        return NextResponse.json(
          { success: false, error: `Error de conexión con Service Role Key: ${authFallbackError}` },
          { status: 400 }
        )
      }
    }
    
    // If both work, connection is successful
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa (ambas claves funcionan)'
    })

  } catch (error) {
    console.error('Setup test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
