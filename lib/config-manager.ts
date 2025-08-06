import { createClient } from '@supabase/supabase-js'

// Configuration interface
export interface AppConfig {
  database: {
    url: string
    apiKey: string
    serviceRoleKey?: string
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

// Configuration sources priority:
// 1. Environment variables (highest priority)
// 2. Local config file (.app-config.json)
// 3. Database (lowest priority)

export class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig | null = null
  private supabaseClient: any = null

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  // Check if environment variables are available
  private hasEnvironmentConfig(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  // Load config from environment variables
  private loadFromEnvironment(): AppConfig | null {
    if (!this.hasEnvironmentConfig()) return null

    return {
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        tableName: 'survey_data',
        environment: process.env.NODE_ENV || 'development'
      },
      general: {
        appName: process.env.NEXT_PUBLIC_APP_NAME || 'Survey App',
        publicUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
        analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false'
      }
    }
  }

  // Load config from local file (server-side only)
  private async loadFromLocalFile(): Promise<AppConfig | null> {
    try {
      // Only try to read local file on server side
      if (typeof window !== 'undefined') return null

      // Dynamic import to avoid client-side issues
      const fs = await import('fs')
      const path = await import('path')
      
      const configPath = path.join(process.cwd(), '.app-config.json')
      
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8')
        return JSON.parse(configData)
      }
    } catch (error) {
      // Silently fail if fs is not available (client-side)
      console.warn('Could not load local config file:', error)
    }
    return null
  }

  // Save config to local file (server-side only)
  async saveToLocalFile(config: AppConfig): Promise<boolean> {
    try {
      // Only save on server side
      if (typeof window !== 'undefined') return false

      // Dynamic import to avoid client-side issues
      const fs = await import('fs')
      const path = await import('path')
      
      const configPath = path.join(process.cwd(), '.app-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      console.log('✅ Configuration saved to local file')
      return true
    } catch (error) {
      console.error('❌ Error saving local config:', error)
      return false
    }
  }

  // Load config from database using bootstrap credentials
  private async loadFromDatabase(bootstrapUrl?: string, bootstrapKey?: string): Promise<AppConfig | null> {
    try {
      // Use bootstrap credentials or fallback to environment
      const url = bootstrapUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = bootstrapKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) return null

      const supabase = createClient(url, key)
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('environment', 'dev')
        .limit(1)
        .single()

      if (error || !data) return null

      return data.settings
    } catch (error) {
      console.warn('Could not load config from database:', error)
      return null
    }
  }

  // Get configuration with fallback chain
  async getConfig(bootstrapUrl?: string, bootstrapKey?: string): Promise<AppConfig | null> {
    // Return cached config if available
    if (this.config) return this.config

    // Try environment variables first
    let config = this.loadFromEnvironment()
    if (config) {
      console.log('📋 Config loaded from environment variables')
      this.config = config
      return config
    }

    // Try local file
    config = await this.loadFromLocalFile()
    if (config) {
      console.log('📋 Config loaded from local file')
      this.config = config
      return config
    }

    // Try database with bootstrap credentials
    config = await this.loadFromDatabase(bootstrapUrl, bootstrapKey)
    if (config) {
      console.log('📋 Config loaded from database')
      this.config = config
      return config
    }

    console.warn('⚠️ No configuration found')
    return null
  }

  // Create Supabase client from config
  async getSupabaseClient(bootstrapUrl?: string, bootstrapKey?: string): Promise<any> {
    if (this.supabaseClient) return this.supabaseClient

    const config = await this.getConfig(bootstrapUrl, bootstrapKey)
    if (!config) return null

    this.supabaseClient = createClient(config.database.url, config.database.apiKey)
    return this.supabaseClient
  }

  // Save configuration to multiple sources
  async saveConfig(config: AppConfig): Promise<{ success: boolean; savedTo: string[] }> {
    const savedTo: string[] = []

    try {
      // Save to local file
      const localSaved = await this.saveToLocalFile(config)
      if (localSaved) savedTo.push('local')

      // Save to database if we have a client
      if (this.supabaseClient) {
        const { error } = await this.supabaseClient
          .from('app_settings')
          .upsert({
            environment: 'dev',
            survey_table_name: config.database.tableName,
            app_name: config.general.appName,
            settings: config
          })

        if (!error) {
          savedTo.push('database')
          console.log('✅ Configuration saved to database')
        }
      }

      // Update cached config
      this.config = config

      return { success: savedTo.length > 0, savedTo }
    } catch (error) {
      console.error('❌ Error saving configuration:', error)
      return { success: false, savedTo }
    }
  }

  // Clear cached configuration
  clearCache(): void {
    this.config = null
    this.supabaseClient = null
    console.log('🗑️ Configuration cache cleared')
  }

  // Check if configuration is available
  async isConfigured(bootstrapUrl?: string, bootstrapKey?: string): Promise<boolean> {
    const config = await this.getConfig(bootstrapUrl, bootstrapKey)
    return !!config
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance()