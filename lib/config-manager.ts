// Centralized Configuration Manager
// Handles environment variables, database settings, and manual configurations

export interface DatabaseConfig {
  url: string
  apiKey: string
  tableName: string
  environment: string
}

export interface AppConfig {
  database: DatabaseConfig
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    requireHttps: boolean
    enableRateLimit: boolean
    enforceStrongPasswords: boolean
    enableTwoFactor: boolean
  }
  notifications: {
    emailAlerts: boolean
    adminEmail: string
    responseThreshold: number
  }
  general: {
    appName: string
    publicUrl: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
}

class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig | null = null
  private databaseSettings: any = null

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  // Get environment variables safely
  private getEnvVar(key: string): string {
    if (typeof window !== 'undefined') {
      // Client-side: use window.__ENV__
      return (window as any).__ENV__?.[key] || ''
    } else {
      // Server-side: use process.env
      return process.env[key] || ''
    }
  }

  // Load database settings from API
  private async loadDatabaseSettings(): Promise<any> {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 ConfigManager - Database settings loaded:', {
          hasSettings: !!data.settings,
          settingsKeys: data.settings ? Object.keys(data.settings) : [],
          supabaseUrl: data.settings?.supabase_url ? 'SET' : 'EMPTY',
          supabaseKey: data.settings?.supabase_anon_key ? 'SET' : 'EMPTY'
        })
        return data
      }
    } catch (error) {
      console.error('ConfigManager - Error loading database settings:', error)
    }
    return null
  }

  // Get configuration with proper fallback hierarchy
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config
    }

    // Load database settings first
    this.databaseSettings = await this.loadDatabaseSettings()

    // Get environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: this.getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      NEXT_PUBLIC_DB_TABLE: this.getEnvVar('NEXT_PUBLIC_DB_TABLE'),
      NEXT_PUBLIC_APP_NAME: this.getEnvVar('NEXT_PUBLIC_APP_NAME'),
      NEXT_PUBLIC_APP_URL: this.getEnvVar('NEXT_PUBLIC_APP_URL'),
      NEXT_PUBLIC_NODE_ENV: this.getEnvVar('NEXT_PUBLIC_NODE_ENV'),
      NEXT_PUBLIC_SESSION_TIMEOUT: this.getEnvVar('NEXT_PUBLIC_SESSION_TIMEOUT'),
      NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS: this.getEnvVar('NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS'),
      NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS: this.getEnvVar('NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS'),
      NEXT_PUBLIC_ENABLE_ANALYTICS: this.getEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS'),
    }

    console.log('🔍 ConfigManager - Environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
      NEXT_PUBLIC_DB_TABLE: env.NEXT_PUBLIC_DB_TABLE,
      NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
    })

    // Build configuration with proper priority:
    // 1. Manual settings from database (highest priority)
    // 2. Environment variables (fallback)
    // 3. Default values (lowest priority)
    this.config = {
      database: {
        url: this.databaseSettings?.settings?.supabase_url || env.NEXT_PUBLIC_SUPABASE_URL || "",
        apiKey: this.databaseSettings?.settings?.supabase_anon_key || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        tableName: this.databaseSettings?.survey_table_name || env.NEXT_PUBLIC_DB_TABLE || "survey_data",
        environment: this.databaseSettings?.environment || env.NEXT_PUBLIC_NODE_ENV || "production",
      },
      security: {
        sessionTimeout: this.databaseSettings?.session_timeout || Number.parseInt(env.NEXT_PUBLIC_SESSION_TIMEOUT || "3600"),
        maxLoginAttempts: this.databaseSettings?.max_login_attempts || Number.parseInt(env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "10"),
        requireHttps: true,
        enableRateLimit: true,
        enforceStrongPasswords: false,
        enableTwoFactor: false,
      },
      notifications: {
        emailAlerts: this.databaseSettings?.enable_email_notifications || env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === "true",
        adminEmail: "",
        responseThreshold: 10,
      },
      general: {
        appName: this.databaseSettings?.app_name || env.NEXT_PUBLIC_APP_NAME || "Product Community Survey",
        publicUrl: this.databaseSettings?.app_url || env.NEXT_PUBLIC_APP_URL || "",
        maintenanceMode: this.databaseSettings?.maintenance_mode || false,
        analyticsEnabled: this.databaseSettings?.enable_analytics || env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
      },
    }

    console.log('🔍 ConfigManager - Final configuration:', {
      databaseUrl: this.config.database.url ? 'SET' : 'EMPTY',
      databaseKey: this.config.database.apiKey ? 'SET' : 'EMPTY',
      tableName: this.config.database.tableName,
      appName: this.config.general.appName,
    })

    return this.config
  }

  // Check if database is properly configured
  async isDatabaseConfigured(): Promise<boolean> {
    const config = await this.getConfig()
    return !!(config.database.url && config.database.apiKey)
  }

  // Get database configuration only
  async getDatabaseConfig(): Promise<DatabaseConfig> {
    const config = await this.getConfig()
    return config.database
  }

  // Refresh configuration (useful after settings changes)
  async refreshConfig(): Promise<AppConfig> {
    this.config = null
    this.databaseSettings = null
    return this.getConfig()
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance()

// Export convenience functions
export const getConfig = () => configManager.getConfig()
export const getDatabaseConfig = () => configManager.getDatabaseConfig()
export const isDatabaseConfigured = () => configManager.isDatabaseConfigured()
export const refreshConfig = () => configManager.refreshConfig()