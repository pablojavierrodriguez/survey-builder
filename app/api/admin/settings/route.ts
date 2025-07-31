import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSettings } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'GET', '/api/admin/settings', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for admin settings request', {
        requestId,
        ip,
        error: rateLimitResult.error
      })
      
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      logger.error('Supabase not configured for admin settings', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Admin system not available' },
        { status: 503 }
      )
    }

    // Fetch settings from database
    const dbStartTime = Date.now()
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const dbDuration = Date.now() - dbStartTime

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      logger.error('Database error fetching admin settings', {
        requestId,
        ip,
        error: error.message,
        duration: dbDuration
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    logger.logDatabaseOperation('SELECT', 'app_settings', true, dbDuration)

    // Return settings or default configuration
    const settings = data || {
      id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      environment: 'dev',
      survey_table_name: 'pc_survey_data_dev',
      analytics_table_name: null,
      app_name: 'Product Community Survey (DEV)',
      app_url: 'https://productcommunitysurvey-dev.vercel.app',
      maintenance_mode: false,
      enable_analytics: true,
      enable_email_notifications: false,
      enable_export: true,
      session_timeout: 28800000,
      max_login_attempts: 20,
      theme_default: 'system',
      language_default: 'en',
      settings: {},
      description: 'Development environment configuration',
      version: '1.0.0'
    }

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    // Transform settings to match frontend expectations
    const transformedSettings = {
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        tableName: settings.survey_table_name || 'pc_survey_data_dev',
        environment: settings.environment || 'dev'
      },
      general: {
        appName: settings.app_name || 'Product Community Survey',
        publicUrl: settings.app_url || '',
        maintenanceMode: settings.maintenance_mode || false,
        analyticsEnabled: settings.enable_analytics || true
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedSettings
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in admin settings GET', {
      requestId,
      ip,
      error: errorMessage,
      duration: totalDuration
    }, error instanceof Error ? error : undefined)

    logger.logResponse(requestId, 500, totalDuration)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'POST', '/api/admin/settings', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for admin settings update', {
        requestId,
        ip,
        error: rateLimitResult.error
      })
      
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate admin settings
    const validation = validateAdminSettings(body)
    if (!validation.success) {
      logger.warn('Admin settings validation failed', {
        requestId,
        ip,
        errors: validation.details
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

    const settings = validation.data

    // Check if Supabase is configured
    if (!supabase) {
      logger.error('Supabase not configured for admin settings update', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Admin system not available' },
        { status: 503 }
      )
    }

    // Check if settings data is valid
    if (!settings) {
      logger.error('Settings data is undefined', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      )
    }

    // Prepare settings for database
    const apiSettings = {
      survey_table_name: settings.database.tableName,
      app_name: settings.general.appName,
      app_url: settings.general.publicUrl,
      maintenance_mode: settings.general.maintenanceMode,
      enable_analytics: settings.general.analyticsEnabled,
      enable_email_notifications: false, // Default to false
      enable_export: true, // Default to true
      session_timeout: 3600 * 1000, // Default to 1 hour
      max_login_attempts: 10, // Default to 10
      theme_default: 'system',
      language_default: 'en',
      settings: {
        supabase_url: settings.database.url,
        supabase_anon_key: settings.database.apiKey,
        require_https: true, // Default to true
        enable_rate_limit: true, // Default to true
        enforce_strong_passwords: false, // Default to false
        enable_two_factor: false, // Default to false
        admin_email: "", // Default to empty
        response_threshold: 10 // Default to 10
      }
    }

    // Update settings in database
    const dbStartTime = Date.now()
    const { data, error } = await supabase
      .from('app_settings')
      .upsert([apiSettings], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    const dbDuration = Date.now() - dbStartTime

    if (error) {
      logger.error('Database error updating admin settings', {
        requestId,
        ip,
        error: error.message,
        duration: dbDuration
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    // Log configuration change
    logger.logConfigChange('admin_settings', 'updated', data, ip)
    logger.logDatabaseOperation('UPSERT', 'app_settings', true, dbDuration)
    logger.info('Admin settings updated successfully', {
      requestId,
      ip,
      settingsId: data?.id
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in admin settings POST', {
      requestId,
      ip,
      error: errorMessage,
      duration: totalDuration
    }, error instanceof Error ? error : undefined)

    logger.logResponse(requestId, 500, totalDuration)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}