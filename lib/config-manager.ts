// Simplified Configuration Manager
// Focuses on getting Supabase working immediately

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

class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig | null = null

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  // Simple environment variable getter
  private getEnvVar(key: string): string {
    if (typeof window !== 'undefined') {
      // Client-side: try window.__ENV__ first, then process.env
      return (window as any).__ENV__?.[key] || process.env[key] || ''
    } else {
      // Server-side: use process.env
      return process.env[key] || ''
    }
  }

  // Get Supabase configuration with multiple fallbacks
  private getSupabaseConfig(): { url: string; apiKey: string } {
    const url = 
      this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
      this.getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ||
      this.getEnvVar('POSTGRES_SUPABASE_URL') ||
      ''

    const apiKey = 
      this.getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      this.getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      this.getEnvVar('POSTGRES_SUPABASE_ANON_KEY') ||
      ''

    console.log('🔧 ConfigManager - Supabase Config:', {
      url: url ? 'SET' : 'EMPTY',
      apiKey: apiKey ? 'SET' : 'EMPTY',
      envKeys: {
        NEXT_PUBLIC_SUPABASE_URL: this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
        POSTGRES_NEXT_PUBLIC_SUPABASE_URL: this.getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
        POSTGRES_SUPABASE_URL: this.getEnvVar('POSTGRES_SUPABASE_URL') ? 'SET' : 'EMPTY',
      }
    })

    return { url, apiKey }
  }

  // Get configuration with proper fallback hierarchy
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config
    }

    // Get environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: this.getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      NEXT_PUBLIC_DB_TABLE: this.getEnvVar('NEXT_PUBLIC_DB_TABLE'),
      NEXT_PUBLIC_APP_NAME: this.getEnvVar('NEXT_PUBLIC_APP_NAME'),
      NEXT_PUBLIC_APP_URL: this.getEnvVar('NEXT_PUBLIC_APP_URL'),
      NEXT_PUBLIC_NODE_ENV: this.getEnvVar('NEXT_PUBLIC_NODE_ENV'),
      NEXT_PUBLIC_ENABLE_ANALYTICS: this.getEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS'),
    }

    // Get Supabase config with fallbacks
    const supabaseConfig = this.getSupabaseConfig()

    // Build configuration with proper priority:
    // 1. Environment variables (primary)
    // 2. Default values (fallback)
    this.config = {
      database: {
        url: supabaseConfig.url,
        apiKey: supabaseConfig.apiKey,
        tableName: env.NEXT_PUBLIC_DB_TABLE || "survey_data",
        environment: env.NEXT_PUBLIC_NODE_ENV || "production",
      },
      general: {
        appName: env.NEXT_PUBLIC_APP_NAME || "Product Community Survey",
        publicUrl: env.NEXT_PUBLIC_APP_URL || "",
        maintenanceMode: false,
        analyticsEnabled: env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
      },
    }

    console.log('🔧 ConfigManager - Final configuration:', {
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