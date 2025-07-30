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

  // Get configuration with proper fallback hierarchy
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config
    }

    try {
      // Fetch Supabase config from API
      const response = await fetch('/api/config/supabase')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const apiConfig = await response.json()
      
      if (apiConfig.error) {
        throw new Error(apiConfig.error)
      }

      // Build configuration with proper priority:
      // 1. API config (from server-side environment variables)
      // 2. Default values (fallback)
      this.config = {
        database: {
          url: apiConfig.supabaseUrl || '',
          apiKey: apiConfig.supabaseAnonKey || '',
          tableName: apiConfig.tableName || "survey_data",
          environment: apiConfig.environment || "production",
        },
        general: {
          appName: "Product Community Survey",
          publicUrl: "",
          maintenanceMode: false,
          analyticsEnabled: true,
        },
      }
      
      console.log('🔧 ConfigManager - Final configuration:', {
        databaseUrl: this.config.database.url ? 'SET' : 'EMPTY',
        databaseKey: this.config.database.apiKey ? 'SET' : 'EMPTY',
        tableName: this.config.database.tableName,
        appName: this.config.general.appName,
      })
      
      return this.config
    } catch (error) {
      console.error('Error loading configuration:', error)
      
      // Return default config on error
      this.config = {
        database: {
          url: '',
          apiKey: '',
          tableName: "survey_data",
          environment: "production",
        },
        general: {
          appName: "Product Community Survey",
          publicUrl: "",
          maintenanceMode: false,
          analyticsEnabled: true,
        },
      }
      
      return this.config
    }
  }

  async refreshConfig(): Promise<AppConfig> {
    this.config = null
    return this.getConfig()
  }

  async isDatabaseConfigured(): Promise<boolean> {
    const config = await this.getConfig()
    return !!(config.database.url && config.database.apiKey)
  }
}

export const configManager = ConfigManager.getInstance()
export const getConfig = () => configManager.getConfig()
export const isDatabaseConfigured = () => configManager.isDatabaseConfigured()
export const refreshConfig = () => configManager.refreshConfig()