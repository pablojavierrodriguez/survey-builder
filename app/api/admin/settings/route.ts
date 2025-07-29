import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
function getSupabaseConfig() {
  return {
    supabaseUrl: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    anonKey: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
  }
}

// Get current environment
function getCurrentEnvironment(): 'dev' | 'prod' {
  const nodeEnv = process.env.NODE_ENV
  const branch = process.env.BRANCH || process.env.VERCEL_GIT_COMMIT_REF
  
  if (branch === 'dev' || nodeEnv === 'development') {
    return 'dev'
  }
  
  return 'prod'
}

// GET - Fetch app settings
export async function GET() {
  try {
    const config = getSupabaseConfig()
    
    if (!config.supabaseUrl || !config.anonKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration not found' 
      }, { status: 500 })
    }

    const supabase = createClient(config.supabaseUrl, config.anonKey)
    const environment = getCurrentEnvironment()

    // Fetch settings from app_settings table
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('environment', environment)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching app settings:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch app settings' 
      }, { status: 500 })
    }

    // If no settings found, return default settings
    if (!data) {
      const defaultSettings = {
        environment,
        survey_table_name: process.env.NEXT_PUBLIC_DB_TABLE || (environment === 'dev' ? 'pc_survey_data_dev' : 'pc_survey_data'),
        app_name: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
        app_url: process.env.NEXT_PUBLIC_APP_URL || '',
        maintenance_mode: false,
        enable_analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
        enable_email_notifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
        enable_export: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
        session_timeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600') * 1000,
        max_login_attempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '10'),
        theme_default: 'system',
        language_default: 'en',
        settings: {}
      }
      
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Update app settings
export async function POST(request: NextRequest) {
  try {
    const config = getSupabaseConfig()
    
    if (!config.supabaseUrl || !config.anonKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration not found' 
      }, { status: 500 })
    }

    const supabase = createClient(config.supabaseUrl, config.anonKey)
    const environment = getCurrentEnvironment()
    const body = await request.json()

    // Prepare settings data
    const settingsData = {
      environment,
      survey_table_name: body.survey_table_name || process.env.NEXT_PUBLIC_DB_TABLE || (environment === 'dev' ? 'pc_survey_data_dev' : 'pc_survey_data'),
      app_name: body.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
      app_url: body.app_url || process.env.NEXT_PUBLIC_APP_URL || '',
      maintenance_mode: body.maintenance_mode || false,
      enable_analytics: body.enable_analytics ?? (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'),
      enable_email_notifications: body.enable_email_notifications ?? (process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true'),
      enable_export: body.enable_export ?? (process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true'),
      session_timeout: body.session_timeout || parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600') * 1000,
      max_login_attempts: body.max_login_attempts || parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '10'),
      theme_default: body.theme_default || 'system',
      language_default: body.language_default || 'en',
      settings: body.settings || {},
      updated_at: new Date().toISOString()
    }

    // Check if settings exist for this environment
    const { data: existingSettings } = await supabase
      .from('app_settings')
      .select('id')
      .eq('environment', environment)
      .single()

    let result

    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('app_settings')
        .update(settingsData)
        .eq('environment', environment)
        .select()
    } else {
      // Insert new settings
      result = await supabase
        .from('app_settings')
        .insert(settingsData)
        .select()
    }

    if (result.error) {
      console.error('Error saving app settings:', result.error)
      return NextResponse.json({ 
        error: 'Failed to save app settings' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data[0] 
    })
  } catch (error) {
    console.error('Error in POST /api/admin/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}