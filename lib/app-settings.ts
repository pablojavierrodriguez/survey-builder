import { supabase } from './supabase'

// Cache for app settings
let settingsCache: any = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get Supabase configuration
function getSupabaseConfig() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  }
}

// Helper function to resolve setting priority: manual > env > default
function resolveSetting(manualValue: any, envValue: any, defaultValue: any) {
  if (manualValue !== undefined && manualValue !== null && manualValue !== '') {
    return manualValue
  }
  if (envValue !== undefined && envValue !== null && envValue !== '') {
    return envValue
  }
  return defaultValue
}

// Get environment configuration
function getEnvironmentConfig() {
  return {
    app_name: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
    app_url: process.env.NEXT_PUBLIC_APP_URL || '',
    survey_table_name: process.env.NEXT_PUBLIC_DB_TABLE || 'survey_data',
    enable_analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enable_email_notifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enable_export: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
    session_timeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600') * 1000,
    max_login_attempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '10')
  }
}

// Fetch app settings from Supabase
export async function fetchAppSettings(): Promise<AppSettings | null> {
  const config = getSupabaseConfig()
  
  // Check cache first
  const now = Date.now()
  if (settingsCache && (now - settingsCache.timestamp) < CACHE_DURATION) {
    return settingsCache.data
  }

  if (!config.supabaseUrl || !config.anonKey) {
    console.warn('⚠️ No valid Supabase configuration found, using environment-based settings')
    return null
  }

  try {
    console.log('🔍 Fetching app settings...')
    
    const { data, error } = await supabase!
      .from('app_settings')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching app settings:', error)
      return null
    }

    const envConfig = getEnvironmentConfig()
    
    if (data) {
      // Merge database settings with environment variables (manual has priority)
      const mergedSettings = {
        ...data,
        app_name: resolveSetting(data.app_name, envConfig.app_name, 'Product Community Survey'),
        app_url: resolveSetting(data.app_url, envConfig.app_url, ''),
        survey_table_name: resolveSetting(data.survey_table_name, envConfig.survey_table_name, 'survey_data'),
        enable_analytics: resolveSetting(data.enable_analytics, envConfig.enable_analytics, true),
        enable_email_notifications: resolveSetting(data.enable_email_notifications, envConfig.enable_email_notifications, true),
        enable_export: resolveSetting(data.enable_export, envConfig.enable_export, true),
        session_timeout: resolveSetting(data.session_timeout, envConfig.session_timeout, 3600000),
        max_login_attempts: resolveSetting(data.max_login_attempts, envConfig.max_login_attempts, 10),
        // For Supabase config, manual settings always have priority
        settings: {
          ...data.settings,
          supabase_url: resolveSetting(data.settings?.supabase_url, config.supabaseUrl, ''),
          supabase_anon_key: resolveSetting(data.settings?.supabase_anon_key, config.anonKey, '')
        }
      }

      // Cache the result
      settingsCache = {
        data: mergedSettings,
        timestamp: now
      }

      console.log('✅ App settings loaded from Supabase (manual config has priority)')
      return mergedSettings
    } else {
      // No settings in database, use environment defaults
      const defaultSettings = {
        environment: 'production',
        survey_table_name: envConfig.survey_table_name,
        app_name: envConfig.app_name,
        app_url: envConfig.app_url,
        maintenance_mode: false,
        enable_analytics: envConfig.enable_analytics,
        enable_email_notifications: envConfig.enable_email_notifications,
        enable_export: envConfig.enable_export,
        session_timeout: envConfig.session_timeout,
        max_login_attempts: envConfig.max_login_attempts,
        theme_default: 'system',
        language_default: 'en',
        settings: {
          supabase_url: config.supabaseUrl,
          supabase_anon_key: config.anonKey
        }
      }

      // Cache the result
      settingsCache = {
        data: defaultSettings,
        timestamp: now
      }

      console.log('✅ App settings loaded from environment defaults')
      return defaultSettings
    }
  } catch (error) {
    console.error('Error fetching app settings:', error)
    return null
  }
}

// Update app settings in Supabase (admin only)
export async function updateAppSettings(updates: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> {
  const config = getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.anonKey) {
    return { success: false, error: 'No valid Supabase configuration found' }
  }

  try {
    // Check if settings exist
    const { data: existingSettings } = await supabase!
      .from('app_settings')
      .select('id')
      .limit(1)
      .single()

    const settingsData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    let result

    if (existingSettings) {
      // Update existing settings
      result = await supabase!
        .from('app_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
    } else {
      // Insert new settings
      result = await supabase!
        .from('app_settings')
        .insert(settingsData)
        .select()
    }

    if (result.error) {
      console.error('Error updating app settings:', result.error)
      return { success: false, error: result.error.message }
    }

    // Clear cache
    settingsCache = null

    return { success: true }
  } catch (error) {
    console.error('Error updating app settings:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}

// Clear settings cache
export function clearSettingsCache() {
  settingsCache = null
}

// App settings interface
export interface AppSettings {
  id?: number
  environment: string
  survey_table_name: string
  app_name: string
  app_url: string
  maintenance_mode: boolean
  enable_analytics: boolean
  enable_email_notifications: boolean
  enable_export: boolean
  session_timeout: number
  max_login_attempts: number
  theme_default: string
  language_default: string
  settings: {
    supabase_url?: string
    supabase_anon_key?: string
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
}