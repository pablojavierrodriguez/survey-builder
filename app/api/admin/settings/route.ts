import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSettings } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/admin/settings', 'ADMIN')
    if (!rateLimitResult.allowed) {
      console.warn(`Admin settings rate limit exceeded for IP ${clientIP}: ${rateLimitResult.error}`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    const client = await getSupabaseClient()
    if (!client) {
      console.error(`Supabase client not available for admin settings request from IP ${clientIP}`)
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

    if (error) {
      console.error(`Failed to fetch admin settings for IP ${clientIP}:`, error.message)
      return NextResponse.json({
        success: false,
        error: 'Failed to load settings',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Admin settings fetched successfully in ${duration}ms for IP ${clientIP}`)

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Admin settings GET error for IP ${clientIP} after ${duration}ms:`, error)
    
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
      console.warn(`Admin settings update rate limit exceeded for IP ${clientIP}: ${rateLimitResult.error}`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
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

    const client = await getSupabaseClient()
    if (!client) {
      console.error(`Supabase client not available for admin settings update from IP ${clientIP}`)
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Prepare settings data (validation.data is guaranteed to exist if validation.success is true)
    const validatedData = validation.data!
    const settingsData = {
      survey_table_name: validatedData.database.tableName,
      app_name: validatedData.general.appName,
      app_url: validatedData.general.publicUrl,
      maintenance_mode: validatedData.general.maintenanceMode,
      enable_analytics: validatedData.general.analyticsEnabled,
      settings: {
        supabase_url: validatedData.database.url,
        supabase_anon_key: validatedData.database.apiKey,
        connection_timeout: 30,
      }
    }

    // Update or insert settings
    const { data, error } = await client
      .from('app_settings')
      .upsert(settingsData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error(`Failed to update admin settings for IP ${clientIP}:`, error.message)
      return NextResponse.json({
        success: false,
        error: 'Failed to save settings',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Admin settings updated successfully in ${duration}ms for IP ${clientIP}`)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Admin settings POST error for IP ${clientIP} after ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}