import { getSupabaseClient } from './supabase'

export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: string
}

// Get Supabase configuration from API
export async function getSupabaseConfig(): Promise<DatabaseConfig> {
  try {
    const response = await fetch('/api/config/supabase')
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }
    
    const config = await response.json()
    
    if (config.error) {
      throw new Error(config.error)
    }
    
    return {
      supabaseUrl: config.supabaseUrl || '',
      anonKey: config.supabaseAnonKey || '',
      tableName: config.tableName || "survey_data",
      environment: config.environment || "production"
    }
  } catch (error) {
    console.error('Error fetching Supabase config:', error)
    return {
      supabaseUrl: '',
      anonKey: '',
      tableName: "survey_data",
      environment: "production"
    }
  }
}

// Check database connection
export async function checkDatabaseConnection(): Promise<{
  connected: boolean
  tableName: string
  error?: string
}> {
  try {
    const client = await getSupabaseClient()
    if (!client) {
      return {
        connected: false,
        tableName: "survey_data",
        error: 'Database not configured'
      }
    }

    const config = await getSupabaseConfig()
    
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
      tableName: "survey_data",
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
  try {
    const client = await getSupabaseClient()
    if (!client) {
      return {
        success: false,
        error: 'Database not configured'
      }
    }

    const config = await getSupabaseConfig()

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
  try {
    const client = await getSupabaseClient()
    if (!client) {
      return false
    }

    const config = await getSupabaseConfig()
    const targetTable = tableName || config.tableName

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
