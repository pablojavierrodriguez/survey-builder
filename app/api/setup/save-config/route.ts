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
    
    // STEP 1: Create exec_sql function first (if it doesn't exist)
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: `
          -- Create exec_sql function if it doesn't exist
          CREATE OR REPLACE FUNCTION public.exec_sql(sql_command TEXT)
          RETURNS VOID 
          SECURITY DEFINER
          SET search_path = public
          LANGUAGE plpgsql
          AS $$
          BEGIN
            EXECUTE sql_command;
          END;
          $$;
          
          GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
        `
      })
    } catch (execError) {
      // If exec_sql doesn't exist, create it manually
      try {
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql_command TEXT)
            RETURNS VOID 
            SECURITY DEFINER
            SET search_path = public
            LANGUAGE plpgsql
            AS $$
            BEGIN
              EXECUTE sql_command;
            END;
            $$;
          `
        })
      } catch (manualError) {
        console.warn('🔧 [Setup] Could not create exec_sql function:', manualError)
      }
    }

    // STEP 2: Create tables
    try {
      console.log('🔧 [Setup] Creating tables...')
      
      // Create tables using direct SQL queries
      const tables = [
        {
          name: 'app_settings',
          sql: `CREATE TABLE IF NOT EXISTS public.app_settings (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            environment TEXT NOT NULL DEFAULT 'dev',
            survey_table_name TEXT NOT NULL DEFAULT 'survey_data',
            app_name TEXT NOT NULL,
            settings JSONB DEFAULT '{}'
          )`
        },
        {
          name: 'survey_data',
          sql: `CREATE TABLE IF NOT EXISTS public.survey_data (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            response_data JSONB NOT NULL,
            session_id TEXT,
            user_agent TEXT,
            ip_address INET
          )`
        },
        {
          name: 'profiles',
          sql: `CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )`
        }
      ]
      
      // Try to create exec_sql function first
      try {
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql_command TEXT)
            RETURNS VOID 
            SECURITY DEFINER
            SET search_path = public
            LANGUAGE plpgsql
            AS $$
            BEGIN
              EXECUTE sql_command;
            END;
            $$;
          `
        })
        console.log('🔧 [Setup] Created exec_sql function')
      } catch (execError) {
        console.log('🔧 [Setup] exec_sql function creation failed, using direct approach')
      }
      
      // Create tables using exec_sql if available, otherwise use direct approach
      for (const table of tables) {
        try {
          // Try exec_sql first
          const { error: tableError } = await supabaseAdmin.rpc('exec_sql', { 
            sql_command: table.sql
          })
          
          if (tableError) {
            console.log(`🔧 [Setup] exec_sql failed for ${table.name}, trying direct approach...`)
            // If exec_sql fails, we'll need to create tables manually in Supabase
            throw new Error(`exec_sql not available for ${table.name}`)
          } else {
            console.log(`🔧 [Setup] Created table ${table.name} using exec_sql`)
          }
        } catch (err) {
          console.error(`🔧 [Setup] Error creating ${table.name}:`, err)
          // For now, we'll assume tables need to be created manually
          console.log(`🔧 [Setup] Table ${table.name} needs to be created manually in Supabase`)
        }
      }
      
      console.log('🔧 [Setup] Tables creation attempt completed')
      
      // Verify table exists
      const { data: tableCheck, error: tableCheckError } = await supabaseAdmin
        .from('app_settings')
        .select('count')
        .limit(1)
      
      console.log('🔧 [Setup] Table check:', { data: tableCheck, error: tableCheckError })
      
      // If table doesn't exist, return error with instructions
      if (tableCheckError && tableCheckError.code === '42P01') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Las tablas no se pudieron crear automáticamente. Por favor, ejecuta el siguiente SQL en Supabase SQL Editor:',
            sqlInstructions: `
-- Ejecuta esto en Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT NOT NULL DEFAULT 'dev',
  survey_table_name TEXT NOT NULL DEFAULT 'survey_data',
  app_name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.survey_data (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_data JSONB NOT NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
            `
          },
          { status: 400 }
        )
      }
      
    } catch (tableError) {
      console.error('🔧 [Setup] Error creating tables:', tableError)
      const errorMessage = tableError instanceof Error ? tableError.message : 'Unknown error'
      return NextResponse.json(
        { success: false, error: `Error al crear tablas: ${errorMessage}` },
        { status: 500 }
      )
    }

    // STEP 3: Save configuration
    console.log('🔧 [Setup] Attempting to save configuration...')
    
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

    // STEP 4: Enable RLS and create policies
    try {
      // Enable RLS on all tables
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: 'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;' 
      })
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: 'ALTER TABLE public.survey_data ENABLE ROW LEVEL SECURITY;' 
      })
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' 
      })

      // Create simple policies
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: `
          CREATE POLICY "app_settings_admin_access" ON public.app_settings
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
          
          CREATE POLICY "survey_data_public_insert" ON public.survey_data
            FOR INSERT TO anon, authenticated WITH CHECK (true);
          
          CREATE POLICY "profiles_self_read" ON public.profiles
            FOR SELECT TO authenticated USING (auth.uid() = id);
        `
      })

      console.log('🔧 [Setup] RLS enabled and policies created')
    } catch (rlsError) {
      console.warn('🔧 [Setup] Warning: Could not enable RLS automatically:', rlsError)
    }

    // Save configuration locally for bootstrap and clear cache
    saveLocalConfig(supabaseUrl, supabaseKey)
    clearSupabaseCache()

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