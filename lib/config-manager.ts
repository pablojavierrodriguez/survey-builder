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
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    enableRateLimit: boolean
    enforceStrongPasswords: boolean
    enableTwoFactor: boolean
  }
  features: {
    enableExport: boolean
    enableEmailNotifications: boolean
    enableAnalytics: boolean
  }
}

interface CompleteConfig {
  app: AppConfig
  database: DatabaseConfig
  settings: SettingsConfig
}

class ConfigManager {
  private appConfig: AppConfig | null = null
  private databaseConfig: DatabaseConfig | null = null
  private settingsConfig: SettingsConfig | null = null
  private completeConfig: CompleteConfig | null = null
  private lastFetch: number = 0
  private lastSettingsFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Get current environment
  private getCurrentEnvironment(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use URL to determine environment
      const hostname = window.location.hostname
      if (hostname.includes('dev') || hostname.includes('localhost')) {
        return 'dev'
      }
      return 'prod'
    }
    // Server-side: use NODE_ENV
    return process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
  }

  // Get complete configuration (all settings)
  async getCompleteConfig(): Promise<CompleteConfig> {
    const now = Date.now()
    
    // Return cached config if still valid
    if (this.completeConfig && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.completeConfig
    }

    try {
      const [appConfig, settingsConfig] = await Promise.all([
        this.getAppConfig(),
        this.getSettingsConfig()
      ])

      const databaseConfig = this.getDatabaseConfig()

      this.completeConfig = {
        app: appConfig,
        database: databaseConfig,
        settings: settingsConfig
      }
      
      this.lastFetch = now
      return this.completeConfig
    } catch (error) {
      console.error('Error getting complete config:', error)
      
      // Return fallback config
      const fallbackConfig: CompleteConfig = {
        app: {
          appName: 'Product Community Survey',
          appUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          enableExport: true,
          enableEmailNotifications: false,
          enableAnalytics: true,
          environment: 'development',
          isProduction: false
        },
        database: {
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
          tableName: process.env.NEXT_PUBLIC_DB_TABLE || 'pc_survey_data_dev',
          environment: process.env.NODE_ENV || 'development'
        },
        settings: {
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
          },
          security: {
            sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '28800000'),
            maxLoginAttempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '3'),
            enableRateLimit: true,
            enforceStrongPasswords: false,
            enableTwoFactor: false
          },
          features: {
            enableExport: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
            enableEmailNotifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
            enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
          }
        }
      }
      
      this.completeConfig = fallbackConfig
      this.lastFetch = now
      
      return fallbackConfig
    }
  }

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
        return result.data
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
      const environment = this.getCurrentEnvironment()
      const response = await fetch(`/api/admin/settings?environment=${environment}`)
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
      
      // Return fallback config based on environment
      const environment = this.getCurrentEnvironment()
      const isProd = environment === 'prod'
      
      const fallbackConfig: SettingsConfig = {
        database: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          tableName: isProd ? 'pc_survey_data' : 'pc_survey_data_dev',
          environment: environment
        },
        general: {
          appName: isProd ? 'Product Community Survey' : 'Product Community Survey (DEV)',
          publicUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          maintenanceMode: false,
          analyticsEnabled: true
        },
        security: {
          sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '28800000'),
          maxLoginAttempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '3'),
          enableRateLimit: true,
          enforceStrongPasswords: isProd, // Stricter in prod
          enableTwoFactor: false
        },
        features: {
          enableExport: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
          enableEmailNotifications: isProd, // Only in prod
          enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
        }
      }
      
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
      // Fallback to environment variable or default based on environment
      const environment = this.getCurrentEnvironment()
      const isProd = environment === 'prod'
      return process.env.NEXT_PUBLIC_DB_TABLE || (isProd ? 'pc_survey_data' : 'pc_survey_data_dev')
    }
  }

  // Get app name from settings
  async getAppName(): Promise<string> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.general.appName
    } catch (error) {
      console.error('Error getting app name from settings:', error)
      const environment = this.getCurrentEnvironment()
      const isProd = environment === 'prod'
      return process.env.NEXT_PUBLIC_APP_NAME || (isProd ? 'Product Community Survey' : 'Product Community Survey (DEV)')
    }
  }

  // Get session timeout from settings
  async getSessionTimeout(): Promise<number> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.security.sessionTimeout
    } catch (error) {
      console.error('Error getting session timeout from settings:', error)
      return parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '28800000')
    }
  }

  // Get max login attempts from settings
  async getMaxLoginAttempts(): Promise<number> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.security.maxLoginAttempts
    } catch (error) {
      console.error('Error getting max login attempts from settings:', error)
      return parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '3')
    }
  }

  // Get analytics enabled from settings
  async getAnalyticsEnabled(): Promise<boolean> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.features.enableAnalytics
    } catch (error) {
      console.error('Error getting analytics enabled from settings:', error)
      return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    }
  }

  // Get export enabled from settings
  async getExportEnabled(): Promise<boolean> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.features.enableExport
    } catch (error) {
      console.error('Error getting export enabled from settings:', error)
      return process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true'
    }
  }

  // Get email notifications enabled from settings
  async getEmailNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await this.getSettingsConfig()
      return settings.features.enableEmailNotifications
    } catch (error) {
      console.error('Error getting email notifications enabled from settings:', error)
      const environment = this.getCurrentEnvironment()
      return environment === 'prod' // Only enabled in production
    }
  }

  // Get database configuration (server-side only)
  getDatabaseConfig(): DatabaseConfig {
    const environment = this.getCurrentEnvironment()
    const isProd = environment === 'prod'
    
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
      tableName: process.env.NEXT_PUBLIC_DB_TABLE || (isProd ? 'pc_survey_data' : 'pc_survey_data_dev'),
      environment: environment
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
    this.completeConfig = null
    await this.getCompleteConfig()
  }

  // Get environment variable safely (server-side only)
  getEnvVar(key: string): string {
    if (typeof window !== 'undefined') {
      throw new Error('Environment variables are server-side only')
    }
    return process.env[key] || ''
  }

  // Get current environment (public method)
  getEnvironment(): string {
    return this.getCurrentEnvironment()
  }
}

// Global config manager instance
export const configManager = new ConfigManager()

// Convenience functions
export const getCompleteConfig = () => configManager.getCompleteConfig()
export const getAppConfig = () => configManager.getAppConfig()
export const getSettingsConfig = () => configManager.getSettingsConfig()
export const getTableName = () => configManager.getTableName()
export const getAppName = () => configManager.getAppName()
export const getSessionTimeout = () => configManager.getSessionTimeout()
export const getMaxLoginAttempts = () => configManager.getMaxLoginAttempts()
export const getAnalyticsEnabled = () => configManager.getAnalyticsEnabled()
export const getExportEnabled = () => configManager.getExportEnabled()
export const getEmailNotificationsEnabled = () => configManager.getEmailNotificationsEnabled()
export const getDatabaseConfig = () => configManager.getDatabaseConfig()
export const getDatabaseConfigWithDynamicTable = () => configManager.getDatabaseConfigWithDynamicTable()
export const isDatabaseConfigured = () => configManager.isDatabaseConfigured()
export const getConfigValue = (key: keyof AppConfig) => configManager.getConfigValue(key)
export const refreshConfig = () => configManager.refreshConfig()
export const getEnvVar = (key: string) => configManager.getEnvVar(key)
export const getEnvironment = () => configManager.getEnvironment()