import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSettings } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/admin/settings`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error(`Supabase not configured for IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Fetch settings from database
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error(`Failed to fetch settings for IP ${clientIP}:`, error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch settings',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Settings fetched successfully for IP ${clientIP} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Settings GET error for IP ${clientIP} after ${duration}ms:`, error)
    
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
      console.warn(`Rate limit exceeded for IP ${clientIP} on /api/admin/settings`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate admin settings
    const validation = validateAdminSettings(body)
    if (!validation.success) {
      console.warn(`Admin settings validation failed for IP ${clientIP}:`, validation.error)
      return NextResponse.json({
        success: false,
        error: 'Invalid settings data',
        details: validation.details,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error(`Supabase not configured for IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Prepare settings data
    const settingsData = {
      survey_table_name: validation.data!.database.tableName,
      app_name: validation.data!.general.appName,
      app_url: validation.data!.general.publicUrl,
      maintenance_mode: validation.data!.general.maintenanceMode,
      enable_analytics: validation.data!.general.analyticsEnabled,
      enable_email_notifications: false, // Default to false
      enable_export: true, // Default to true
      session_timeout: 3600 * 1000, // Default to 1 hour
      max_login_attempts: 10, // Default to 10
      theme_default: 'system',
      language_default: 'en',
      settings: {
        supabase_url: validation.data!.database.url,
        supabase_anon_key: validation.data!.database.apiKey,
        connection_timeout: 30,
        require_https: true, // Default to true
        enable_rate_limit: true, // Default to true
        enforce_strong_passwords: false, // Default to false
        enable_two_factor: false, // Default to false
        admin_email: "", // Default to empty
        response_threshold: 10 // Default to 10
      }
    }

    // Save settings to database
    const { data, error } = await supabase
      .from('app_settings')
      .upsert([settingsData])
      .select()
      .single()

    if (error) {
      console.error(`Failed to save settings for IP ${clientIP}:`, error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save settings',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Settings saved successfully for IP ${clientIP} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Settings POST error for IP ${clientIP} after ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}