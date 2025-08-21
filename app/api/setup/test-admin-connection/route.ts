import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSafeEnvironmentConfig } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, adminEmail, adminPassword } = await request.json()

    if (!supabaseUrl || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'URL, Email y Contraseña de admin son requeridos' },
        { status: 400 }
      )
    }

    // Create Supabase client with anon key from environment
    const envConfig = getSafeEnvironmentConfig()
    const anonKey = envConfig.supabase.anonKey || ''
    if (!anonKey) {
      return NextResponse.json(
        { success: false, error: 'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno' },
        { status: 400 }
      )
    }
    const supabase = createClient(supabaseUrl, anonKey)
    
    // Sign in with admin credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: `Error de autenticación: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'No se pudo autenticar con las credenciales proporcionadas' },
        { status: 400 }
      )
    }

    // Test if user has admin privileges by trying to access admin functions
    try {
      // Try to get project settings (admin only)
      const { data: projectData, error: projectError } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
      
      // If we can access app_settings, we have admin privileges
      console.log('🔧 [Setup] Admin connection test successful')
      
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con credenciales de admin',
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      })

    } catch (accessError) {
      return NextResponse.json(
        { success: false, error: 'Las credenciales no tienen permisos de administrador' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Setup admin test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
