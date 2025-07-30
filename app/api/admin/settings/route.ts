import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSettings } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleGetSettings(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'GET /api/admin/settings')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      requestLogger.warn('Rate limit exceeded', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      requestLogger.error('Supabase not configured', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Settings service unavailable' },
        { status: 503 }
      )
    }

    // Fetch settings from database
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      requestLogger.error('Failed to fetch settings', error, { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Failed to load settings' },
        { status: 500 }
      )
    }

    // Return default settings if none exist
    if (!data) {
      requestLogger.info('No settings found, returning defaults', { ip: clientIP })
      return NextResponse.json({
        success: true,
        data: {
          database: {
            url: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || '',
            apiKey: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            tableName: process.env.NEXT_PUBLIC_DB_TABLE || 'survey_data',
            connectionTimeout: 30
          },
          general: {
            appName: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
            publicUrl: process.env.NEXT_PUBLIC_APP_URL || '',
            maintenanceMode: false,
            analyticsEnabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
          }
        }
      })
    }

    // Parse settings from database
    const settings = data.settings || {}
    
    requestLogger.info('Settings loaded successfully', { 
      ip: clientIP,
      settingsId: data.id 
    })

    return NextResponse.json({
      success: true,
      data: {
        database: {
          url: settings.supabase_url || '',
          apiKey: settings.supabase_anon_key || '',
          tableName: data.survey_table_name || 'survey_data',
          connectionTimeout: settings.connection_timeout || 30
        },
        general: {
          appName: data.app_name || 'Product Community Survey',
          publicUrl: data.app_url || '',
          maintenanceMode: data.maintenance_mode || false,
          analyticsEnabled: data.enable_analytics || false
        }
      }
    })

  } catch (error) {
    requestLogger.error('Unexpected error fetching settings', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUpdateSettings(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'POST /api/admin/settings')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      requestLogger.warn('Rate limit exceeded', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate settings data
    const validation = validateAdminSettings(body)
    if (!validation.success) {
      requestLogger.warn('Settings validation failed', { 
        errors: validation.details,
        ip: clientIP 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid settings data',
          details: validation.details 
        },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      requestLogger.error('Supabase not configured', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Settings service unavailable' },
        { status: 503 }
      )
    }

    // Prepare settings for database
    const apiSettings = {
      survey_table_name: validation.data.database.tableName,
      app_name: validation.data.general.appName,
      app_url: validation.data.general.publicUrl,
      maintenance_mode: validation.data.general.maintenanceMode,
      enable_analytics: validation.data.general.analyticsEnabled,
      enable_email_notifications: false, // Default to false
      enable_export: true, // Default to true
      session_timeout: 3600 * 1000, // Default to 1 hour
      max_login_attempts: 10, // Default to 10
      theme_default: 'system',
      language_default: 'en',
      settings: {
        supabase_url: validation.data.database.url,
        supabase_anon_key: validation.data.database.apiKey,
        connection_timeout: validation.data.database.connectionTimeout,
        require_https: true, // Default to true
        enable_rate_limit: true, // Default to true
        enforce_strong_passwords: false, // Default to false
        enable_two_factor: false, // Default to false
        admin_email: "", // Default to empty
        response_threshold: 10 // Default to 10
      }
    }

    // Update or insert settings
    const { data, error } = await supabase
      .from('app_settings')
      .upsert([apiSettings], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      requestLogger.error('Failed to save settings', error, { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    requestLogger.info('Settings updated successfully', { 
      ip: clientIP,
      settingsId: data.id 
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: { id: data.id }
    })

  } catch (error) {
    requestLogger.error('Unexpected error updating settings', error as Error, { ip: clientIP })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handlers
export const GET = withLogging(handleGetSettings)
export const POST = withLogging(handleUpdateSettings)