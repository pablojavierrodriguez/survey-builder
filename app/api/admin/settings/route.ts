import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSettings } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Get Supabase client
    const client = await getSupabaseClient()
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Fetch settings from database
    const { data, error } = await client
      .from('app_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch settings',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: data || null,
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: `${responseTime}ms`,
        rateLimitRemaining: rateLimitResult.remaining
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error('Settings fetch failed', {
      clientIP,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate settings data
    const validation = validateAdminSettings(body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid settings data',
        details: validation.details || validation.error,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Get Supabase client
    const client = await getSupabaseClient()
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Prepare settings data
    const settingsData = {
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
        connection_timeout: 30,
        require_https: true, // Default to true
        enable_rate_limit: true, // Default to true
        enforce_strong_passwords: false, // Default to false
        enable_two_factor: false, // Default to false
        admin_email: "", // Default to empty
        response_threshold: 10 // Default to 10
      }
    }

    // Insert or update settings
    const { data, error } = await client
      .from('app_settings')
      .upsert(settingsData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save settings',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: `${responseTime}ms`,
        rateLimitRemaining: rateLimitResult.remaining
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error('Settings save failed', {
      clientIP,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}