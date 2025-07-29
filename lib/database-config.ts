import { supabase } from './supabase'

export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: string
}

// Get Supabase configuration from environment variables
export function getSupabaseConfig(): DatabaseConfig {
  // Server-side environment variables
  if (typeof window === 'undefined') {
    return {
      supabaseUrl: process.env.POSTGRES_SUPABASE_URL || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.POSTGRES_SUPABASE_ANON_KEY || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      tableName: process.env.NEXT_PUBLIC_DB_TABLE || "survey_data",
      environment: process.env.NODE_ENV || "production"
    }
  }
  
  // Client-side: use window.__ENV__ or fallback
  const env = (window as any).__ENV__ || {}
  return {
    supabaseUrl: "",
    anonKey: "",
    tableName: env.NEXT_PUBLIC_DB_TABLE || "survey_data",
    environment: "production"
  }
}

// Get database configuration
export function getDatabaseConfig(): DatabaseConfig {
  return getSupabaseConfig()
}

// Get database configuration synchronously (for backward compatibility)
export function getDatabaseConfigSync(): DatabaseConfig {
  return getSupabaseConfig()
}

// Get database endpoint for API calls
export function getDatabaseEndpointSync(): string {
  const config = getSupabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}`
}

// Get database endpoint for API calls (async version)
export async function getDatabaseEndpoint(): Promise<string> {
  return getDatabaseEndpointSync()
}

// Get database headers for API calls
export function getDatabaseHeadersSync(): Record<string, string> {
  const config = getSupabaseConfig()
  return {
    'apikey': config.anonKey,
    'Authorization': `Bearer ${config.anonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
}

// Get database headers for API calls (async version)
export async function getDatabaseHeaders(): Promise<Record<string, string>> {
  return getDatabaseHeadersSync()
}

// Function to check if any table exists
export async function ensureTableExists(tableName?: string): Promise<boolean> {
  const config = getSupabaseConfig()
  const targetTable = tableName || config.tableName
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${targetTable}?limit=1`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    })
    
    return response.ok
  } catch (error) {
    console.error('Error checking table existence:', error)
    return false
  }
}

// Function to ensure dev table exists (for development)
export async function ensureDevTableExists(): Promise<boolean> {
  return ensureTableExists('pc_survey_data_dev')
}

// Function to submit survey data to Supabase
export async function submitSurveyToDatabase(surveyData: any): Promise<{ success: boolean; error?: string; data?: any }> {
  const config = getSupabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(surveyData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Database submission error:', response.status, errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Database submission exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

// Function to check database connection
export async function checkDatabaseConnection(): Promise<{
  connected: boolean; 
  tableName: string; 
  error?: string 
}> {
  const config = getSupabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?limit=1`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    })

    if (response.ok) {
      return { connected: true, tableName: config.tableName }
    } else {
      const errorText = await response.text()
      console.error('Database connection failed:', response.status, errorText)
      return { 
        connected: false, 
        tableName: config.tableName, 
        error: `HTTP ${response.status}: ${errorText}` 
      }
    }
  } catch (error) {
    console.error('Database connection exception:', error)
    return { 
      connected: false, 
      tableName: config.tableName, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}
