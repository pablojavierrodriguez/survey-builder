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

class ConfigManager {
  private appConfig: AppConfig | null = null
  private databaseConfig: DatabaseConfig | null = null
  private lastFetch: number = 0
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

  // Get database configuration (server-side only)
  getDatabaseConfig(): DatabaseConfig {
    if (typeof window !== 'undefined') {
      throw new Error('Database config is server-side only')
    }

    if (this.databaseConfig) {
      return this.databaseConfig
    }

    const supabaseUrl = 
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ||
      process.env.POSTGRES_SUPABASE_URL ||
      ''

    const anonKey = 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.POSTGRES_SUPABASE_ANON_KEY ||
      ''

    this.databaseConfig = {
      supabaseUrl,
      anonKey,
      tableName: process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data',
      environment: process.env.NODE_ENV || 'development'
    }

    return this.databaseConfig
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
    this.appConfig = null
    await this.getAppConfig()
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
export const getDatabaseConfig = () => configManager.getDatabaseConfig()
export const isDatabaseConfigured = () => configManager.isDatabaseConfigured()
export const getConfigValue = (key: keyof AppConfig) => configManager.getConfigValue(key)
export const refreshConfig = () => configManager.refreshConfig()
export const getEnvVar = (key: string) => configManager.getEnvVar(key)