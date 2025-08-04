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

    // Test connection with anon key first
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json(
        { success: false, error: `Error de conexión con Anon Key: ${testError.message}` },
        { status: 400 }
      )
    }
    
    // Use service role key for setup (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // STEP 1: Create tables if they don't exist
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: `
          -- Create app_settings table
          CREATE TABLE IF NOT EXISTS public.app_settings (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            environment TEXT NOT NULL UNIQUE CHECK (environment IN ('dev', 'prod')),
            survey_table_name TEXT NOT NULL,
            analytics_table_name TEXT,
            app_name TEXT NOT NULL,
            app_url TEXT,
            maintenance_mode BOOLEAN DEFAULT FALSE,
            enable_analytics BOOLEAN DEFAULT TRUE,
            enable_email_notifications BOOLEAN DEFAULT FALSE,
            enable_export BOOLEAN DEFAULT TRUE,
            session_timeout INTEGER DEFAULT 28800000,
            max_login_attempts INTEGER DEFAULT 3,
            theme_default TEXT DEFAULT 'system' CHECK (theme_default IN ('light', 'dark', 'system')),
            language_default TEXT DEFAULT 'en',
            settings JSONB DEFAULT '{}',
            description TEXT,
            version TEXT DEFAULT '1.0.0'
          );

          -- Create survey tables
          CREATE TABLE IF NOT EXISTS public.pc_survey_data (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            role TEXT,
            other_role TEXT,
            seniority TEXT,
            company_type TEXT,
            company_size TEXT,
            industry TEXT,
            product_type TEXT,
            customer_segment TEXT,
            main_challenge TEXT,
            daily_tools TEXT[],
            other_tool TEXT,
            learning_methods TEXT[],
            salary_currency TEXT DEFAULT 'USD',
            salary_min TEXT,
            salary_max TEXT,
            salary_average TEXT,
            email TEXT,
            session_id TEXT,
            source TEXT DEFAULT 'web',
            user_agent TEXT,
            ip_address INET
          );

          CREATE TABLE IF NOT EXISTS public.pc_survey_data_dev (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            role TEXT,
            other_role TEXT,
            seniority TEXT,
            company_type TEXT,
            company_size TEXT,
            industry TEXT,
            product_type TEXT,
            customer_segment TEXT,
            main_challenge TEXT,
            daily_tools TEXT[],
            other_tool TEXT,
            learning_methods TEXT[],
            salary_currency TEXT DEFAULT 'USD',
            salary_min TEXT,
            salary_max TEXT,
            salary_average TEXT,
            email TEXT,
            session_id TEXT,
            source TEXT DEFAULT 'web',
            user_agent TEXT,
            ip_address INET
          );

          -- Create profiles table
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      console.log('🔧 [Setup] Tables created successfully')
    } catch (tableError) {
      console.warn('🔧 [Setup] Warning: Could not create tables:', tableError)
    }

    // STEP 2: Clean up any existing problematic policies/triggers
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql_command: `
          -- Remove problematic triggers
          DROP TRIGGER IF EXISTS auto_enable_rls_trigger ON public.app_settings;
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          
          -- Remove problematic functions
          DROP FUNCTION IF EXISTS auto_enable_rls_function() CASCADE;
          DROP FUNCTION IF EXISTS public.setup_initial_config(TEXT, TEXT, TEXT, TEXT) CASCADE;
          
          -- Remove all existing policies
          DROP POLICY IF EXISTS "Public can read app settings" ON public.app_settings;
          DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
          DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
          DROP POLICY IF EXISTS "app_settings_elegant_access" ON public.app_settings;
          DROP POLICY IF EXISTS "app_settings_setup_policy" ON public.app_settings;
          DROP POLICY IF EXISTS "Public can insert survey data" ON public.pc_survey_data;
          DROP POLICY IF EXISTS "Admins can view all survey data" ON public.pc_survey_data;
          DROP POLICY IF EXISTS "Collaborators can view survey data" ON public.pc_survey_data;
          DROP POLICY IF EXISTS "Public can insert dev survey data" ON public.pc_survey_data_dev;
          DROP POLICY IF EXISTS "Admins can view all dev survey data" ON public.pc_survey_data_dev;
          DROP POLICY IF EXISTS "Collaborators can view dev survey data" ON public.pc_survey_data_dev;
          DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
          DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
          DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
          DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
        `
      })
      console.log('🔧 [Setup] Cleaned up problematic policies/triggers')
    } catch (cleanupError) {
      console.warn('🔧 [Setup] Warning: Could not cleanup:', cleanupError)
    }

    // STEP 3: Save configuration
    const { error: updateError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        environment: 'dev',
        survey_table_name: 'pc_survey_data_dev',
        app_name: appName || 'Product Community Survey (DEV)',
        settings: {
          database: {
            url: supabaseUrl,
            apiKey: supabaseKey,
            tableName: 'pc_survey_data_dev',
            environment: 'development'
          },
          general: {
            appName: appName || 'Product Community Survey (DEV)',
            publicUrl: publicUrl || '',
            maintenanceMode: false,
            analyticsEnabled: true,
            debugMode: true
          }
        }
      })

    // STEP 4: Enable RLS and create policies automatically
    if (!updateError) {
      try {
        // Enable RLS on all tables
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: 'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;' 
        })
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: 'ALTER TABLE public.pc_survey_data ENABLE ROW LEVEL SECURITY;' 
        })
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: 'ALTER TABLE public.pc_survey_data_dev ENABLE ROW LEVEL SECURITY;' 
        })
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' 
        })

        // Create simple policies that don't cause recursion
        await supabaseAdmin.rpc('exec_sql', { 
          sql_command: `
            CREATE POLICY "app_settings_simple_policy" ON public.app_settings
              FOR ALL TO authenticated USING (true) WITH CHECK (true);
            
            CREATE POLICY "survey_data_public_insert" ON public.pc_survey_data
              FOR INSERT TO anon, authenticated WITH CHECK (true);
            
            CREATE POLICY "survey_data_dev_public_insert" ON public.pc_survey_data_dev
              FOR INSERT TO anon, authenticated WITH CHECK (true);
            
            CREATE POLICY "profiles_self_read" ON public.profiles
              FOR SELECT TO authenticated USING (auth.uid() = id);
          `
        })

        console.log('🔧 [Setup] RLS enabled and policies created automatically')
      } catch (rlsError) {
        console.warn('🔧 [Setup] Warning: Could not enable RLS automatically:', rlsError)
      }
    }



    if (updateError) {
      console.error('🔧 [Setup] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar configuración: ${updateError.message}` },
        { status: 500 }
      )
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