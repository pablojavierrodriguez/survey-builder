import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSettings } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

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

    // Get Supabase client using environment variables
    const { createClient } = await import('@supabase/supabase-js')
    
    const bootstrapUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const bootstrapKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!bootstrapUrl || !bootstrapKey) {
      logger.error('Supabase not configured for admin settings', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 503 }
      )
    }

    const supabaseClient = createClient(bootstrapUrl, bootstrapKey)

    // Get environment from NODE_ENV
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

    // Fetch settings from database
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('*')
      .eq('environment', environment)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      logger.error('Database error fetching admin settings', {
        requestId,
        ip,
        error: error.message,
        environment
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Return user-saved settings from DB if they exist
    if (data?.settings) {
      return NextResponse.json({
        success: true,
        data: data.settings,
        environment: environment,
        source: 'database'
      })
    }

    // Fallback: return bootstrap configuration
    return NextResponse.json({
      success: true,
      data: {
        database: {
          url: bootstrapUrl,
          apiKey: bootstrapKey
        },
        general: {
          appName: 'Survey Builder',
          publicUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          maintenanceMode: false,
          analyticsEnabled: true
        }
      },
      environment: environment,
      source: 'bootstrap'
    })

  } catch (error) {
    logger.error('Unexpected error in admin settings', {
      requestId,
      ip,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
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
    
    // Extract settings from body (body.settings) or use body directly
    const settingsData = body.settings || body
    
    // Validate admin settings
    const validation = validateAdminSettings(settingsData)
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

    // Get Supabase client using bootstrap config
    const { createClient } = await import('@supabase/supabase-js')
    
    const bootstrapUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const bootstrapKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!bootstrapUrl || !bootstrapKey) {
      logger.error('Bootstrap configuration not available for settings update', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 503 }
      )
    }

    const supabaseClient = createClient(bootstrapUrl, bootstrapKey)

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

    // Get environment from NODE_ENV
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

    // Prepare settings for database (no database credentials)
    const apiSettings = {
      environment: environment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: settings, // Store the entire validated settings object
      version: '2.0.0'
    }

    // Update settings in database for specific environment
    const dbStartTime = Date.now()
    const { data, error } = await supabaseClient
      .from('app_settings')
      .upsert([apiSettings], { 
        onConflict: 'environment',
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
        duration: dbDuration,
        environment
      })
      
      // If table doesn't exist, return a more helpful error
      if (error.message.includes('relation "app_settings" does not exist')) {
        return NextResponse.json(
          { success: false, error: 'Settings table not found. Please contact administrator.' },
          { status: 500 }
        )
      }
      
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
      settingsId: data?.id,
      environment
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      data: data.settings,
      environment: environment,
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