import { createClient } from '@supabase/supabase-js'

export interface DatabaseConfig {
  url: string
  apiKey: string
  tableName: string
  environment: string
}

export interface AppConfig {
  database: DatabaseConfig
  general: {
    appName: string
    publicUrl: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
}

let cachedConfig: AppConfig | null = null
let lastLoaded = 0
const CACHE_TTL = 60 * 1000 // 1 minute

// Helper to get env vars
function getEnvVar(key: string): string {
  return process.env[key] || ''
}

// Get Supabase config from env
function getSupabaseEnvConfig() {
  return {
    url:
      getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ||
      getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
      '',
    apiKey:
      getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      '',
    tableName: getEnvVar('NEXT_PUBLIC_DB_TABLE') || 'survey_data',
    environment: getEnvVar('NEXT_PUBLIC_NODE_ENV') || 'production',
  }
}

// Get default config from env
function getDefaultConfig(): AppConfig {
  const db = getSupabaseEnvConfig()
  return {
    database: db,
    general: {
      appName: getEnvVar('NEXT_PUBLIC_APP_NAME') || 'Product Community Survey',
      publicUrl: getEnvVar('NEXT_PUBLIC_APP_URL') || '',
      maintenanceMode: false,
      analyticsEnabled: getEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS') === 'true',
    },
  }
}

// Load config from DB (app_settings)
async function loadConfigFromDB(): Promise<AppConfig | null> {
  const db = getSupabaseEnvConfig()
  if (!db.url || !db.apiKey) return null
  const supabase = createClient(db.url, db.apiKey)
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .single()
  if (error || !data) return null
  // Map DB fields to config
  return {
    database: {
      url: data.settings?.supabase_url || db.url,
      apiKey: data.settings?.supabase_anon_key || db.apiKey,
      tableName: data.survey_table_name || db.tableName,
      environment: data.environment || db.environment,
    },
    general: {
      appName: data.app_name || 'Product Community Survey',
      publicUrl: data.app_url || '',
      maintenanceMode: data.maintenance_mode || false,
      analyticsEnabled: data.enable_analytics ?? true,
    },
  }
}

// Main config loader
export async function getConfig(force = false): Promise<AppConfig> {
  if (!force && cachedConfig && Date.now() - lastLoaded < CACHE_TTL) {
    return cachedConfig
  }
  // Try DB first
  const dbConfig = await loadConfigFromDB()
  if (dbConfig) {
    cachedConfig = dbConfig
    lastLoaded = Date.now()
    return dbConfig
  }
  // Fallback to env
  const envConfig = getDefaultConfig()
  cachedConfig = envConfig
  lastLoaded = Date.now()
  return envConfig
}

// Save config to DB
export async function setConfig(newConfig: AppConfig): Promise<boolean> {
  const db = getSupabaseEnvConfig()
  if (!db.url || !db.apiKey) return false
  const supabase = createClient(db.url, db.apiKey)
  // Upsert settings
  const settingsData = {
    environment: newConfig.database.environment,
    survey_table_name: newConfig.database.tableName,
    app_name: newConfig.general.appName,
    app_url: newConfig.general.publicUrl,
    maintenance_mode: newConfig.general.maintenanceMode,
    enable_analytics: newConfig.general.analyticsEnabled,
    settings: {
      supabase_url: newConfig.database.url,
      supabase_anon_key: newConfig.database.apiKey,
    },
    updated_at: new Date().toISOString(),
  }
  // Check if exists
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .limit(1)
    .single()
  let result
  if (existing) {
    result = await supabase
      .from('app_settings')
      .update(settingsData)
      .eq('id', existing.id)
  } else {
    result = await supabase
      .from('app_settings')
      .insert(settingsData)
  }
  if (result.error) return false
  await refreshConfig()
  return true
}

// Expose only safe config to client
export async function getSafeClientConfig(): Promise<any> {
  const config = await getConfig()
  return {
    supabaseUrl: config.database.url,
    supabaseAnonKey: config.database.apiKey,
    tableName: config.database.tableName,
    environment: config.database.environment,
    appName: config.general.appName,
    publicUrl: config.general.publicUrl,
    maintenanceMode: config.general.maintenanceMode,
    analyticsEnabled: config.general.analyticsEnabled,
  }
}

export async function refreshConfig() {
  cachedConfig = null
  lastLoaded = 0
  await getConfig(true)
}