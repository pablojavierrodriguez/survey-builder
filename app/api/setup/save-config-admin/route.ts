import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveLocalConfig } from '@/lib/local-config'
import { clearSupabaseCache } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, adminEmail, adminPassword, publicUrl, appName } = await request.json()

    if (!supabaseUrl || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'URL, Email y Contraseña de admin son requeridos' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    
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

    // Get API keys from Supabase dashboard
    // Note: We'll need to use the service role key for admin operations
    // For now, we'll use the anon key and rely on RLS policies
    
    // STEP 1: Check if required tables exist
    console.log('🔧 [Setup] Checking if required tables exist...')
    
    const requiredTables = ['app_settings', 'survey_data', 'profiles']
    const missingTables = []
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1)
        
        if (error && error.code === '42P01') {
          missingTables.push(tableName)
        }
      } catch (err) {
        missingTables.push(tableName)
      }
    }
    
    if (missingTables.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Las siguientes tablas no existen: ${missingTables.join(', ')}. Por favor, ejecuta el SQL de inicialización en Supabase SQL Editor.`,
          sqlInstructions: `
-- =================================================================
-- SQL DE INICIALIZACIÓN - Ejecutar en Supabase SQL Editor
-- =================================================================

-- Crear tabla de configuración de la app
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT NOT NULL DEFAULT 'dev',
  survey_table_name TEXT NOT NULL DEFAULT 'survey_data',
  app_name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'
);

-- Crear tabla de respuestas de encuesta
CREATE TABLE IF NOT EXISTS public.survey_data (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_data JSONB NOT NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "app_settings_admin_access" ON public.app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "survey_data_public_insert" ON public.survey_data
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- =================================================================
-- FIN DEL SQL DE INICIALIZACIÓN
-- =================================================================
          `,
          missingTables
        },
        { status: 400 }
      )
    }

    // STEP 2: Save configuration
    console.log('🔧 [Setup] Saving configuration...')
    
    const { data: upsertData, error: updateError } = await supabase
      .from('app_settings')
      .upsert({
        environment: 'dev',
        survey_table_name: 'survey_data',
        app_name: appName || 'Survey App',
        settings: {
          database: {
            url: supabaseUrl,
            apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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

    console.log('🔧 [Setup] Upsert result:', { data: upsertData, error: updateError })

    if (updateError) {
      console.error('🔧 [Setup] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar configuración: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Save configuration locally for bootstrap and clear cache
    saveLocalConfig(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    clearSupabaseCache()

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('Setup save config admin error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}