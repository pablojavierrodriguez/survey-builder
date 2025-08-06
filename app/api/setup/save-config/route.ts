import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveLocalConfig } from '@/lib/local-config'
import { clearSupabaseCache } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, publicUrl, appName } = await request.json()

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'URL, Anon Key y Service Role Key son requeridos' },
        { status: 400 }
      )
    }

    // Use service role key for setup (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // STEP 1: Check if required tables exist
    console.log('🔧 [Setup] Checking if required tables exist...')
    
    const requiredTables = ['app_settings', 'survey_data', 'profiles']
    const missingTables = []
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabaseAdmin
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

    // STEP 2: Save configuration to database
    console.log('🔧 [Setup] Saving configuration...')
    
    const { data: upsertData, error: updateError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        environment: 'dev',
        survey_table_name: 'survey_data',
        app_name: appName || 'Survey App',
        settings: {
          database: {
            url: supabaseUrl,
            apiKey: supabaseKey,
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

    // STEP 3: Try to set Vercel environment variables automatically
    console.log('🔧 [Setup] Attempting to set Vercel environment variables...')
    
    try {
      const vercelToken = process.env.VERCEL_TOKEN
      const vercelProjectId = process.env.VERCEL_PROJECT_ID
      
      if (vercelToken && vercelProjectId) {
        // Set environment variables via Vercel API
        const envVars = [
          {
            key: 'NEXT_PUBLIC_SUPABASE_URL',
            value: supabaseUrl,
            target: ['production', 'preview', 'development']
          },
          {
            key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            value: supabaseKey,
            target: ['production', 'preview', 'development']
          }
        ]
        
        for (const envVar of envVars) {
          const response = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/env`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(envVar)
          })
          
          if (response.ok) {
            console.log(`🔧 [Setup] Environment variable ${envVar.key} set successfully`)
          } else {
            console.warn(`🔧 [Setup] Failed to set environment variable ${envVar.key}`)
          }
        }
      } else {
        console.log('🔧 [Setup] Vercel token or project ID not available, skipping automatic env var setup')
      }
    } catch (envError) {
      console.warn('🔧 [Setup] Error setting environment variables:', envError)
    }

    console.log('🔧 [Setup] Configuration saved to database successfully')

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      clearCache: true, // Signal to client to clear cache
      environmentVariablesSet: true
    })

  } catch (error) {
    console.error('Setup save config error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}