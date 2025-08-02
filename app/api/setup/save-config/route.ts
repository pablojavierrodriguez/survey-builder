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

    // Temporarily disable RLS to allow initial setup
    const { error: disableRLSError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;'
      })

    if (disableRLSError) {
      console.warn('Could not disable RLS (might already be disabled):', disableRLSError.message)
    }

    // Save configuration to database
    const { error: saveError } = await supabase
      .from('app_settings')
      .upsert({
        environment: 'dev',
        settings: {
          database: {
            url: supabaseUrl,
            apiKey: supabaseKey,
            tableName: 'pc_survey_data_dev',
            environment: 'development'
          },
          general: {
            appName: appName || 'Product Community Survey (DEV)',
            publicUrl: publicUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://productcommunitysurvey-dev.vercel.app',
            maintenanceMode: false,
            analyticsEnabled: true
          }
        }
      }, {
        onConflict: 'environment'
      })

    if (saveError) {
      return NextResponse.json(
        { success: false, error: `Error al guardar: ${saveError.message}` },
        { status: 500 }
      )
    }

    // Re-enable RLS and create secure policy
    const { error: enableRLSError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
          
          CREATE POLICY "app_settings_admin_access" ON public.app_settings
            FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
              )
            );
        `
      })

    if (enableRLSError) {
      console.warn('Could not re-enable RLS:', enableRLSError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('Setup save config error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}