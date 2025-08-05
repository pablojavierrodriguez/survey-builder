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
    
    // Test service role key access (should work even with empty DB)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
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

  } catch (error) {
    console.error('Setup test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}