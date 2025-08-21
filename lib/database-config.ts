import { getSupabaseClient } from "./supabase"
import { getSafeEnvironmentConfig } from "./env"

// Note: environment variables are accessed via centralized env config

export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: string
}

// Get Supabase configuration from environment variables
export function getSupabaseConfig(): DatabaseConfig {
  const envConfig = getSafeEnvironmentConfig()
  const supabaseUrl = envConfig.supabase.url || ""
  const anonKey = envConfig.supabase.anonKey || ""

  console.log("🔧 Database Config - Supabase Config:", {
    supabaseUrl: supabaseUrl ? "SET" : "EMPTY",
    anonKey: anonKey ? "SET" : "EMPTY",
  })

  return {
    supabaseUrl,
    anonKey,
    tableName: (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_DB_TABLE || "pc_survey_data_dev") : "pc_survey_data_dev"),
    environment: envConfig.app.environment || "production",
  }
}

// Check database connection
export async function checkDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  const config = getSupabaseConfig()

  if (!config.supabaseUrl || !config.anonKey) {
    return { success: false, error: "Database not configured" }
  }

  try {
    const client = await getSupabaseClient()
    if (!client) {
      return { success: false, error: "Supabase client not available" }
    }

    const { error } = await client.from("survey_responses").select("id").limit(1)

    if (error) {
      console.error("🔧 Database connection test error:", error)
      return { success: false, error: `Database connection failed: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    console.error("🔧 Database connection exception:", error)
    return {
      success: false,
      error: `Database connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Submit survey to database
export async function submitSurveyToDatabase(
  surveyData: any,
): Promise<{ success: boolean; error?: string; data?: any }> {
  const config = getSupabaseConfig()

  if (!config.supabaseUrl || !config.anonKey) {
    return { success: false, error: "Database not configured" }
  }

  try {
    const client = await getSupabaseClient()
    if (!client) {
      return { success: false, error: "Supabase client not available" }
    }

    const { data, error } = await client.from("survey_responses").insert([surveyData]).select()

    if (error) {
      console.error("Survey submission error:", error)
      return { success: false, error: `Failed to submit survey: ${error.message}` }
    }

    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error("Survey submission exception:", error)
    return { success: false, error: `Survey submission failed: ${error}` }
  }
}

// Get database endpoint for API calls
export function getDatabaseEndpoint(): string {
  const config = getSupabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}`
}

// Get database headers for API calls
export function getDatabaseHeaders(): Record<string, string> {
  const config = getSupabaseConfig()
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  }
}

// Ensure table exists (for development)
export async function ensureTableExists(tableName?: string): Promise<boolean> {
  const config = getSupabaseConfig()
  const targetTable = tableName || config.tableName

  if (!config.supabaseUrl || !config.anonKey) {
    return false
  }

  try {
    const client = await getSupabaseClient()
    if (!client) {
      return false
    }

    // Try to create table if it doesn't exist
    const { error } = await client.rpc("create_survey_table_if_not_exists", {
      table_name: targetTable,
    })

    if (error) {
      console.warn("Table creation failed (might already exist):", error.message)
    }

    return true
  } catch (error) {
    console.error("Error ensuring table exists:", error)
    return false
  }
}

// Ensure dev table exists
export async function ensureDevTableExists(): Promise<boolean> {
  return ensureTableExists("pc_survey_data_dev")
}
