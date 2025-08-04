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
    
    // Try to fetch a simple query to test connection
    // Use a more basic test that doesn't depend on specific tables
    const { data, error } = await supabase
      .rpc('version')

    if (error) {
      // If RPC fails, try a simple auth test
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        return NextResponse.json(
          { success: false, error: `Error de conexión con Anon Key: ${authError.message}` },
          { status: 400 }
        )
      }
      
      // Test service role key access
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('app_settings')
        .select('count')
        .limit(1)
      
      if (adminError) {
        return NextResponse.json(
          { success: false, error: `Error de conexión con Service Role Key: ${adminError.message}` },
          { status: 400 }
        )
      }
      
      // If both work, connection is successful
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa (ambas claves funcionan)'
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