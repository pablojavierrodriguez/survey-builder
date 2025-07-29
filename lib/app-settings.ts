// App Settings Configuration
// Fetches settings from Supabase app_settings table

export interface AppSettings {
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
  theme_default: 'light' | 'dark' | 'system'
  language_default: string
  settings: Record<string, any>
}

// Cache for settings to avoid repeated API calls
let settingsCache: AppSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get Supabase configuration
function getSupabaseConfig() {
  // Server-side environment variables
  if (typeof window === 'undefined') {
    return {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    }
  }
  
  // Client-side environment variables
  return {
    supabaseUrl: (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  }
}

// Get environment-specific configuration from environment variables
function getEnvironmentConfig() {
  return {
    app_name: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
    app_url: process.env.NEXT_PUBLIC_APP_URL || '',
    survey_table_name: process.env.NEXT_PUBLIC_DB_TABLE || 'survey_data',
    enable_analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enable_email_notifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enable_export: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
    session_timeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600') * 1000, // Convert to milliseconds
    max_login_attempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '10')
  }
}

// Resolve setting with manual configuration priority
function resolveSetting(manualValue: any, envValue: any, defaultValue: any) {
  // If manual value exists and is not empty/null, use it
  if (manualValue !== null && manualValue !== undefined && manualValue !== '') {
    return manualValue
  }
  
  // Otherwise use environment variable or default
  return envValue !== null && envValue !== undefined && envValue !== '' ? envValue : defaultValue
}

// Fetch app settings from Supabase
export async function fetchAppSettings(): Promise<AppSettings | null> {
  const config = getSupabaseConfig()
  
  // Check cache first
  const now = Date.now()
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log(`📋 Using cached app settings`)
    return settingsCache
  }
  
  // If no Supabase config, return default settings
  if (!config.supabaseUrl || !config.anonKey) {
    console.warn('⚠️ No valid Supabase configuration found, using environment-based settings')
    return getDefaultSettings()
  }
  
  try {
    console.log(`🔍 Fetching app settings...`)
    
    const response = await fetch(`${config.supabaseUrl}/rest/v1/app_settings?select=*&limit=1`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch app settings: ${response.status}`)
      return getDefaultSettings()
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const settings = data[0]
      const envConfig = getEnvironmentConfig()
      
      // Merge manual settings with environment variables (manual has priority)
      const mergedSettings = {
        ...settings,
        app_name: resolveSetting(settings.app_name, envConfig.app_name, 'Product Community Survey'),
        app_url: resolveSetting(settings.app_url, envConfig.app_url, ''),
        survey_table_name: resolveSetting(settings.survey_table_name, envConfig.survey_table_name, 'survey_data'),
        enable_analytics: resolveSetting(settings.enable_analytics, envConfig.enable_analytics, true),
        enable_email_notifications: resolveSetting(settings.enable_email_notifications, envConfig.enable_email_notifications, true),
        enable_export: resolveSetting(settings.enable_export, envConfig.enable_export, true),
        session_timeout: resolveSetting(settings.session_timeout, envConfig.session_timeout, 3600000),
        max_login_attempts: resolveSetting(settings.max_login_attempts, envConfig.max_login_attempts, 10),
        // For Supabase config, manual settings always have priority
        settings: {
          ...settings.settings,
          supabase_url: resolveSetting(settings.settings?.supabase_url, config.supabaseUrl, ''),
          supabase_anon_key: resolveSetting(settings.settings?.supabase_anon_key, config.anonKey, '')
        }
      }
      
      // Cache the merged settings
      settingsCache = mergedSettings
      cacheTimestamp = now
      
      console.log(`✅ App settings loaded from Supabase (manual config has priority)`)
      return mergedSettings
    } else {
      console.warn(`⚠️ No app settings found in database, using environment defaults`)
      return getDefaultSettings()
    }
    
  } catch (error) {
    console.error('❌ Error fetching app settings:', error)
    return getDefaultSettings()
  }
}

function getDefaultSettings(): AppSettings {
  const envConfig = getEnvironmentConfig()
  
  const defaults = {
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
    theme_default: 'system' as const,
    language_default: 'en',
    settings: {}
  }
  
  return defaults
}

// Get current app settings (with caching)
export async function getAppSettings(): Promise<AppSettings> {
  const settings = await fetchAppSettings()
  return settings || getDefaultSettings()
}

// Clear settings cache (useful for testing or when settings change)
export function clearSettingsCache() {
  settingsCache = null
  cacheTimestamp = 0
  console.log('🗑️ App settings cache cleared')
}

// Update app settings in Supabase (admin only)
export async function updateAppSettings(updates: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> {
  const config = getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.anonKey) {
    return { success: false, error: 'No valid Supabase configuration found' }
  }
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/app_settings`, {
      method: 'PATCH',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
    
    // Clear cache to force refresh
    clearSettingsCache()
    
    console.log(`✅ App settings updated`)
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error updating app settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Check if app is in maintenance mode
export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getAppSettings()
  return settings.maintenance_mode
}

// Get survey table name
export async function getSurveyTableName(): Promise<string> {
  const settings = await getAppSettings()
  return settings.survey_table_name
}

// Get app name
export async function getAppName(): Promise<string> {
  const settings = await getAppSettings()
  return settings.app_name
}

// Get feature flags
export async function getFeatureFlags(): Promise<{
  enable_analytics: boolean
  enable_email_notifications: boolean
  enable_export: boolean
}> {
  const settings = await getAppSettings()
  return {
    enable_analytics: settings.enable_analytics,
    enable_email_notifications: settings.enable_email_notifications,
    enable_export: settings.enable_export
  }
}