// Centralized configuration management with secure API access
interface AppConfig {
  appName: string
  appUrl: string
  enableExport: boolean
  enableEmailNotifications: boolean
  enableAnalytics: boolean
  environment: string
  isProduction: boolean
}

interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: string
}

interface SettingsConfig {
  database: {
    url: string
    apiKey: string
    tableName: string
    environment: string
  }
  general: {
    appName: string
    publicUrl: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
}

class ConfigManager {
  private appConfig: AppConfig | null = null
  private databaseConfig: DatabaseConfig | null = null
  private settingsConfig: SettingsConfig | null = null
  private lastFetch: number = 0
  private lastSettingsFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Get app configuration from secure API
  async getAppConfig(): Promise<AppConfig> {
    const now = Date.now()
    
    // Return cached config if still valid
    if (this.appConfig && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.appConfig
    }

    try {
      const response = await fetch('/api/config/app')
      const result = await response.json()
      
      if (result.success && result.data) {
        this.appConfig = result.data
        this.lastFetch = now
        return result.data // Return the data directly, not this.appConfig
      } else {
        throw new Error(result.error || 'Failed to fetch app config')
      }
    } catch (error) {
      console.error('Error fetching app config:', error)
      
      // Return fallback config
      const fallbackConfig: AppConfig = {
        appName: 'Product Community Survey',
        appUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        enableExport: true,
        enableEmailNotifications: false,
        enableAnalytics: true,
        environment: 'development',
        isProduction: false
      }
      
      // Cache the fallback config
      this.appConfig = fallbackConfig
      this.lastFetch = now
      
      return fallbackConfig
    }
  }

  // Get settings configuration from admin settings API
  async getSettingsConfig(): Promise<SettingsConfig> {
    const now = Date.now()
    
    // Return cached config if still valid
    if (this.settingsConfig && (now - this.lastSettingsFetch) < this.CACHE_DURATION) {
      return this.settingsConfig
    }

    try {
      const response = await fetch('/api/admin/settings')
      const result = await response.json()
      
      if (result.success && result.data) {
        this.settingsConfig = result.data
        this.lastSettingsFetch = now
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch settings config')
      }
    } catch (error) {
      console.error('Error fetching settings config:', error)
      
      // Return fallback config
      const fallbackConfig: SettingsConfig = {
        database: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          tableName: process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data_dev',
          environment: process.env.NODE_ENV || 'development'
        },
        general: {
          appName: 'Product Community Survey',
          publicUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          maintenanceMode: false,
          analyticsEnabled: true
        }
      }
      
      // Cache the fallback config
      this.settingsConfig = fallbackConfig
      this.lastSettingsFetch = now
      
      return fallbackConfig
    }
  }

  // Get dynamic table name from settings
  async getTableName(): Promise<string> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.database.tableName
    } catch (error) {
      console.error('Error getting table name from settings:', error)
      // Fallback to environment variable or default
      return process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data_dev'
    }
  }

  // Get database configuration (server-side only)
  getDatabaseConfig(): DatabaseConfig {
    return {
      supabaseUrl: 
        process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ||
        process.env.POSTGRES_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        '',
      anonKey: 
        process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.POSTGRES_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        '',
      tableName: process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data',
      environment: process.env.NODE_ENV || 'development'
    }
  }

  // Get database configuration with dynamic table name (server-side only)
  async getDatabaseConfigWithDynamicTable(): Promise<DatabaseConfig> {
    const baseConfig = this.getDatabaseConfig()
    const dynamicTableName = await this.getTableName()
    
    return {
      ...baseConfig,
      tableName: dynamicTableName
    }
  }

  // Check if database is configured
  isDatabaseConfigured(): boolean {
    try {
      const config = this.getDatabaseConfig()
      return !!(config.supabaseUrl && config.anonKey)
    } catch {
      return false
    }
  }

  // Get specific config value
  async getConfigValue(key: keyof AppConfig): Promise<any> {
    const config = await this.getAppConfig()
    return config[key]
  }

  // Refresh configuration cache
  async refreshConfig(): Promise<void> {
    this.lastFetch = 0
    this.lastSettingsFetch = 0
    this.appConfig = null
    this.settingsConfig = null
    await this.getAppConfig()
    await this.getSettingsConfig()
  }

  // Get environment variable safely (server-side only)
  getEnvVar(key: string): string {
    if (typeof window !== 'undefined') {
      throw new Error('Environment variables are server-side only')
    }
    return process.env[key] || ''
  }
}

// Global config manager instance
export const configManager = new ConfigManager()

// Convenience functions
export const getAppConfig = () => configManager.getAppConfig()
export const getSettingsConfig = () => configManager.getSettingsConfig()
export const getTableName = () => configManager.getTableName()
export const getDatabaseConfig = () => configManager.getDatabaseConfig()
export const getDatabaseConfigWithDynamicTable = () => configManager.getDatabaseConfigWithDynamicTable()
export const isDatabaseConfigured = () => configManager.isDatabaseConfigured()
export const getConfigValue = (key: keyof AppConfig) => configManager.getConfigValue(key)
export const refreshConfig = () => configManager.refreshConfig()
export const getEnvVar = (key: string) => configManager.getEnvVar(key)