// App Settings Configuration
// Fetches settings from Supabase app_settings table based on environment

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
let settingsCache: { [key: string]: AppSettings } = {}
let cacheTimestamp: { [key: string]: number } = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get current environment
function getCurrentEnvironment(): 'dev' | 'prod' {
  // Check if we're in a specific environment
  if (typeof window !== 'undefined') {
    // Client-side detection
    const hostname = window.location.hostname
    
    // If hostname contains 'dev' or we're on localhost, consider it dev
    if (hostname.includes('dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'dev'
    }
    
    // Default to prod for client-side
    return 'prod'
  }
  
  // Server-side environment detection
  try {
    const nodeEnv = process.env.NODE_ENV
    const branch = process.env.BRANCH || process.env.VERCEL_GIT_COMMIT_REF
    
    // If we detect dev branch or development environment
    if (branch === 'dev' || nodeEnv === 'development') {
      return 'dev'
    }
  } catch (error) {
    // Fallback if environment variables are not accessible
    console.warn('Could not access environment variables:', error)
  }
  
  // Default to prod for production
  return 'prod'
}

// Get Supabase configuration
function getSupabaseConfig() {
  // Server-side environment variables
  if (typeof window === 'undefined') {
    return {
      supabaseUrl: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      anonKey: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
    }
  }
  
  // Client-side environment variables
  return {
    supabaseUrl: (window as any).__ENV__?.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ||
                 (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL ||
                 (window as any).__ENV__?.SUPABASE_URL || "",
    anonKey: (window as any).__ENV__?.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
             (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
             (window as any).__ENV__?.SUPABASE_ANON_KEY || ""
  }
}

// Get environment-specific configuration from environment variables
function getEnvironmentConfig(environment: 'dev' | 'prod') {
  const config = {
    dev: {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey (DEV)',
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      survey_table_name: process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data_dev',
      enable_analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      enable_email_notifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enable_export: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
      session_timeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600') * 1000, // Convert to milliseconds
      max_login_attempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '10')
    },
    prod: {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'https://productcommunitysurvey.vercel.app',
      survey_table_name: process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data',
      enable_analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false',
      enable_email_notifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enable_export: process.env.NEXT_PUBLIC_ENABLE_EXPORT !== 'false',
      session_timeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600') * 1000, // Convert to milliseconds
      max_login_attempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '10')
    }
  }
  
  return config[environment]
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
export async function fetchAppSettings(environment?: 'dev' | 'prod'): Promise<AppSettings | null> {
  const targetEnv = environment || getCurrentEnvironment()
  const config = getSupabaseConfig()
  
  // Check cache first
  const now = Date.now()
  if (settingsCache[targetEnv] && cacheTimestamp[targetEnv] && (now - cacheTimestamp[targetEnv]) < CACHE_DURATION) {
    console.log(`📋 Using cached app settings for ${targetEnv}`)
    return settingsCache[targetEnv]
  }
  
  // If no Supabase config, return default settings
  if (!config.supabaseUrl || !config.anonKey || config.supabaseUrl === 'https://your-project.supabase.co') {
    console.warn('⚠️ No valid Supabase configuration found, using environment-based settings')
    return getDefaultSettings(targetEnv)
  }
  
  try {
    console.log(`🔍 Fetching app settings for ${targetEnv} environment...`)
    
    const response = await fetch(`${config.supabaseUrl}/rest/v1/app_settings?environment=eq.${targetEnv}&select=*`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch app settings: ${response.status}`)
      return getDefaultSettings(targetEnv)
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const settings = data[0]
      const envConfig = getEnvironmentConfig(targetEnv)
      
      // Merge manual settings with environment variables (manual has priority)
      const mergedSettings = {
        ...settings,
        app_name: resolveSetting(settings.app_name, envConfig.app_name, 'Product Community Survey'),
        app_url: resolveSetting(settings.app_url, envConfig.app_url, ''),
        survey_table_name: resolveSetting(settings.survey_table_name, envConfig.survey_table_name, targetEnv === 'dev' ? 'pc_survey_data_dev' : 'pc_survey_data'),
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
      settingsCache[targetEnv] = mergedSettings
      cacheTimestamp[targetEnv] = now
      
      console.log(`✅ App settings loaded from Supabase for ${targetEnv} (manual config has priority)`)
      return mergedSettings
    } else {
      console.warn(`⚠️ No app settings found in database for ${targetEnv}, using environment defaults`)
      return getDefaultSettings(targetEnv)
    }
    
  } catch (error) {
    console.error('❌ Error fetching app settings:', error)
    return getDefaultSettings(targetEnv)
  }
}

function getDefaultSettings(environment: 'dev' | 'prod'): AppSettings {
  const envConfig = getEnvironmentConfig(environment)
  
  const defaults = {
    environment: environment,
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
  const environment = getCurrentEnvironment()
  const settings = await fetchAppSettings(environment)
  return settings || getDefaultSettings(environment)
}

// Clear settings cache (useful for testing or when settings change)
export function clearSettingsCache() {
  settingsCache = {}
  cacheTimestamp = {}
  console.log('🗑️ App settings cache cleared')
}

// Update app settings in Supabase (admin only)
export async function updateAppSettings(environment: 'dev' | 'prod', updates: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> {
  const config = getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.anonKey || config.supabaseUrl === 'https://your-project.supabase.co') {
    return { success: false, error: 'No valid Supabase configuration found' }
  }
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/app_settings?environment=eq.${environment}`, {
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
    
    console.log(`✅ App settings updated for ${environment}`)
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