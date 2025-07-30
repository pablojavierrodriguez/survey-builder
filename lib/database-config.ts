import { supabase } from './supabase'

// Get environment variables safely
function getEnvVar(key: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: try window.__ENV__ first, then process.env
    return (window as any).__ENV__?.[key] || process.env[key] || ''
  } else {
    // Server-side: use process.env
    return process.env[key] || ''
  }
}

export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: string
}

// Get Supabase configuration from environment variables
export function getSupabaseConfig(): DatabaseConfig {
  // Try multiple possible variable names
  const supabaseUrl = 
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
    getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ||
    getEnvVar('POSTGRES_SUPABASE_URL') ||
    ''

  const anonKey = 
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnvVar('POSTGRES_SUPABASE_ANON_KEY') ||
    ''

  console.log('🔧 Database Config - Supabase Config:', {
    supabaseUrl: supabaseUrl ? 'SET' : 'EMPTY',
    anonKey: anonKey ? 'SET' : 'EMPTY',
  })

  return {
    supabaseUrl,
    anonKey,
    tableName: getEnvVar('NEXT_PUBLIC_DB_TABLE') || "survey_data",
    environment: getEnvVar('NEXT_PUBLIC_NODE_ENV') || "production"
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

// Check database connection
export async function checkDatabaseConnection(): Promise<{
  connected: boolean
  tableName: string
  error?: string
}> {
  const config = getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.anonKey) {
    return {
      connected: false,
      tableName: config.tableName,
      error: 'Database not configured'
    }
  }

  try {
    const client = supabase
    if (!client) {
      return {
        connected: false,
        tableName: config.tableName,
        error: 'Supabase client not available'
      }
    }

    // Test connection by trying to fetch a single row
    const { data, error } = await client
      .from(config.tableName)
      .select('id')
      .limit(1)

    if (error) {
      return {
        connected: false,
        tableName: config.tableName,
        error: error.message
      }
    }

    return {
      connected: true,
      tableName: config.tableName
    }
  } catch (error) {
    return {
      connected: false,
      tableName: config.tableName,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Submit survey to database
export async function submitSurveyToDatabase(surveyData: any): Promise<{
  success: boolean
  error?: string
  id?: string
}> {
  const config = getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.anonKey) {
    return {
      success: false,
      error: 'Database not configured'
    }
  }

  try {
    const client = supabase
    if (!client) {
      return {
        success: false,
        error: 'Supabase client not available'
      }
    }

    const { data, error } = await client
      .from(config.tableName)
      .insert([surveyData])
      .select('id')
      .single()

    if (error) {
      console.error('Error submitting survey:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      id: data.id
    }
  } catch (error) {
    console.error('Error submitting survey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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
    const client = supabase
    if (!client) {
      return false
    }

    // Try to create table if it doesn't exist
    const { error } = await client.rpc('create_survey_table_if_not_exists', {
      table_name: targetTable
    })

    if (error) {
      console.warn('Table creation failed (might already exist):', error.message)
    }

    return true
  } catch (error) {
    console.error('Error ensuring table exists:', error)
    return false
  }
}

// Ensure dev table exists
export async function ensureDevTableExists(): Promise<boolean> {
  return ensureTableExists('pc_survey_data_dev')
}
