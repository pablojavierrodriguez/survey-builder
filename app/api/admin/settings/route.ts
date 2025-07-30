import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  handleApiError, 
  withRateLimit, 
  withValidation, 
  withDatabaseConnection,
  formatSuccessResponse,
  validateAdminSettingsRequest,
  withAuthentication,
  withAuthorization,
  createConfigurationError,
  createDatabaseError,
  createValidationError
} from '@/lib/error-handler'
import logger from '@/lib/logger'

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function GET(request: NextRequest) {
  const requestLogger = logger.createRequestLogger(request)
  
  try {
    await requestLogger.info('Admin settings GET request received')

    // Rate limiting
    const rateLimitCheck = await withRateLimit(request, 'ADMIN')
    if (!rateLimitCheck.allowed) {
      await requestLogger.warn('Rate limit exceeded for admin settings GET')
      return NextResponse.json(rateLimitCheck.error, { status: 429 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      await requestLogger.error('Supabase not configured for admin settings', {
        supabaseUrl: supabaseUrl ? 'SET' : 'EMPTY',
        supabaseKey: supabaseKey ? 'SET' : 'EMPTY'
      })
      throw createConfigurationError('Database not configured')
    }

    // Fetch settings from database with error handling
    const dbResult = await withDatabaseConnection(request, async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    })

    if (!dbResult.success) {
      await requestLogger.error('Failed to fetch admin settings from database', {
        error: dbResult.error?.message
      })
      return NextResponse.json(dbResult.error, { status: 500 })
    }

    // Transform database response to frontend format
    const settings = {
      database: {
        url: dbResult.data.settings?.supabase_url || '',
        apiKey: dbResult.data.settings?.supabase_anon_key || '',
        tableName: dbResult.data.survey_table_name || 'survey_data',
        connectionTimeout: dbResult.data.settings?.connection_timeout || 30,
      },
      general: {
        appName: dbResult.data.app_name || 'Product Community Survey',
        publicUrl: dbResult.data.app_url || '',
        maintenanceMode: dbResult.data.maintenance_mode || false,
        analyticsEnabled: dbResult.data.enable_analytics || false,
      },
    }

    await requestLogger.info('Admin settings fetched successfully', { 
      hasDatabaseConfig: !!(settings.database.url && settings.database.apiKey),
      tableName: settings.database.tableName,
      appName: settings.general.appName,
      duration: Date.now() - requestLogger.startTime
    })

    return NextResponse.json(formatSuccessResponse(settings, requestLogger.requestId))

  } catch (error) {
    return await handleApiError(error, request)
  }
}

export async function POST(request: NextRequest) {
  const requestLogger = logger.createRequestLogger(request)
  
  try {
    await requestLogger.info('Admin settings POST request received')

    // Rate limiting
    const rateLimitCheck = await withRateLimit(request, 'ADMIN')
    if (!rateLimitCheck.allowed) {
      await requestLogger.warn('Rate limit exceeded for admin settings POST')
      return NextResponse.json(rateLimitCheck.error, { status: 429 })
    }

    // Validate request body
    const validationResult = await withValidation(request, validateAdminSettingsRequest)
    if (!validationResult.valid) {
      await requestLogger.warn('Admin settings validation failed', {
        error: validationResult.error?.message,
        details: validationResult.error?.details
      })
      return NextResponse.json(validationResult.error, { status: 400 })
    }

    const settings = validationResult.data

    // Check if Supabase is configured
    if (!supabase) {
      await requestLogger.error('Supabase not configured for admin settings POST', {
        supabaseUrl: supabaseUrl ? 'SET' : 'EMPTY',
        supabaseKey: supabaseKey ? 'SET' : 'EMPTY'
      })
      throw createConfigurationError('Database not configured')
    }

    // Test database connection with new settings
    const testClient = createClient(settings.database.url, settings.database.apiKey)
    const { error: testError } = await testClient
      .from('app_settings')
      .select('id')
      .limit(1)

    if (testError) {
      await requestLogger.error('Database connection test failed', { 
        error: testError.message,
        code: testError.code 
      })
      throw createDatabaseError('Invalid database configuration', {
        testError: testError.message,
        code: testError.code
      })
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
        connection_timeout: settings.database.connectionTimeout,
        require_https: true, // Default to true
        enable_rate_limit: true, // Default to true
        enforce_strong_passwords: false, // Default to false
        enable_two_factor: false, // Default to false
        admin_email: "", // Default to empty
        response_threshold: 10 // Default to 10
      }
    }

    // Save settings to database with error handling
    const saveResult = await withDatabaseConnection(request, async () => {
      const { error } = await supabase
        .from('app_settings')
        .upsert([apiSettings], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) throw error
      return { success: true }
    })

    if (!saveResult.success) {
      await requestLogger.error('Failed to save admin settings to database', {
        error: saveResult.error?.message,
        details: saveResult.error?.details
      })
      return NextResponse.json(saveResult.error, { status: 500 })
    }

    await requestLogger.info('Admin settings saved successfully', { 
      appName: settings.general.appName,
      tableName: settings.database.tableName,
      hasDatabaseConfig: !!(settings.database.url && settings.database.apiKey),
      duration: Date.now() - requestLogger.startTime
    })

    return NextResponse.json(formatSuccessResponse({
      message: 'Settings saved successfully'
    }, requestLogger.requestId))

  } catch (error) {
    return await handleApiError(error, request)
  }
}