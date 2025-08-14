import { createClient } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabase"

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

  private hasEnvironmentConfig(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  async isConfigured(): Promise<boolean> {
    // Check environment variables first (highest priority)
    if (this.hasEnvironmentConfig()) {
      return true
    }

    // Check local file
    const localConfig = await this.loadFromLocalFile()
    if (localConfig) {
      return true
    }

    // Check database
    const dbConfig = await this.loadFromDatabase()
    if (dbConfig) {
      return true
    }

    return false
  }

  private loadFromEnvironment(): AppConfig | null {
    if (!this.hasEnvironmentConfig()) return null

    return {
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        tableName: "survey_data",
        environment: process.env.NODE_ENV || "development",
      },
      general: {
        appName: process.env.NEXT_PUBLIC_APP_NAME || "Survey App",
        publicUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
        analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false",
      },
    }
  }

  private async loadFromLocalFile(): Promise<AppConfig | null> {
    if (typeof window !== "undefined") return null

    try {
      const fs = await import("fs")
      const path = await import("path")
      const configPath = path.join(process.cwd(), ".app-config.json")

      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf8")
        return JSON.parse(configData)
      }
    } catch (error) {
      console.warn("Could not load local config file:", error)
    }
    return null
  }

  async saveToLocalFile(config: AppConfig): Promise<boolean> {
    if (typeof window !== "undefined") return false

    try {
      const fs = await import("fs")
      const path = await import("path")
      const configPath = path.join(process.cwd(), ".app-config.json")

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      console.log("✅ Configuration saved to local file")
      return true
    } catch (error) {
      console.error("❌ Error saving local config:", error)
      return false
    }
  }


  async saveConfig(config: AppConfig): Promise<{ success: boolean; savedTo: string }> {
    try {
      const supabase = await this.getSupabaseClient()
      if (!supabase) throw new Error("Supabase client not available")

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          environment: config.database.environment,
          settings: config,
        })

      if (error) {
        console.error("Error saving config to database:", error)
        return { success: false, savedTo: "none" }
      }

      console.log("Config saved to database successfully")
      return { success: true, savedTo: "database" }
    } catch (err) {
      console.error("Failed saveConfig:", err)
      return { success: false, savedTo: "error" }
    }
  }

  private async loadFromDatabase(bootstrapUrl?: string, bootstrapKey?: string): Promise<AppConfig | null> {
    try {
      const url = bootstrapUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = bootstrapKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) return null

      const supabase = createClient(url, key)

      const { data, error } = await supabase
        .from("app_settings")
        .select("settings")
        .eq("environment", "dev")
        .limit(1)
        .single()

      if (error || !data) return null

      return data.settings
    } catch (error) {
      console.warn("Could not load config from database:", error)
      return null
    }
  }

  async getConfig(bootstrapUrl?: string, bootstrapKey?: string): Promise<AppConfig | null> {
    if (this.config) return this.config

    let config = this.loadFromEnvironment()
    if (config) {
      console.log("📋 Config loaded from environment variables")
      this.config = config
      return config
    }

    config = await this.loadFromLocalFile()
    if (config) {
      console.log("📋 Config loaded from local file")
      this.config = config
      return config
    }

    config = await this.loadFromDatabase(bootstrapUrl, bootstrapKey)
    if (config) {
      console.log("📋 Config loaded from database")
      this.config = config
      return config
    }

    console.warn("⚠️ No configuration found")
    return null
  }

  async getSupabaseClient(bootstrapUrl?: string, bootstrapKey?: string): Promise<any> {
    if (this.supabaseClient) return this.supabaseClient

    this.supabaseClient = await getSupabaseClient()
    return this.supabaseClient
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance()
