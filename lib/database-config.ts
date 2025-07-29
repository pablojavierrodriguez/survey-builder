// Database Configuration
// Centralized database configuration management

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
      supabaseUrl: process.env.POSTGRES_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.POSTGRES_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      tableName: process.env.NEXT_PUBLIC_DB_TABLE || "survey_data",
      environment: process.env.NODE_ENV || "production"
    }
  }
  
  // Client-side environment variables
  return {
    supabaseUrl: (window as any).__ENV__?.POSTGRES_SUPABASE_URL || (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: (window as any).__ENV__?.POSTGRES_SUPABASE_ANON_KEY || (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    tableName: (window as any).__ENV__?.NEXT_PUBLIC_DB_TABLE || "survey_data",
    environment: (window as any).__ENV__?.NODE_ENV || "production"
  }
}

// Get database configuration synchronously (for immediate use)
export function getDatabaseConfigSync(): DatabaseConfig {
  return getSupabaseConfig()
}

// Get database configuration asynchronously (for API calls)
export async function getDatabaseConfig(): Promise<DatabaseConfig> {
  return getSupabaseConfig()
}

// Get database endpoint for API calls
export async function getDatabaseEndpoint(): Promise<string> {
  const config = getSupabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}`
}

// Get database endpoint synchronously
export function getDatabaseEndpointSync(): string {
  const config = getSupabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}`
}

// Get database headers for API calls
export async function getDatabaseHeaders(): Promise<Record<string, string>> {
  const config = getSupabaseConfig()
  return {
    'apikey': config.anonKey,
    'Authorization': `Bearer ${config.anonKey}`,
    'Content-Type': 'application/json'
  }
}

// Get database headers synchronously
export function getDatabaseHeadersSync(): Record<string, string> {
  const config = getSupabaseConfig()
  return {
    'apikey': config.anonKey,
    'Authorization': `Bearer ${config.anonKey}`,
    'Content-Type': 'application/json'
  }
}

// Validate database configuration
export function validateDatabaseConfig(config: DatabaseConfig): boolean {
  return !!(config.supabaseUrl && config.anonKey && config.tableName)
}

// Function to check if any table exists
export async function ensureTableExists(tableName?: string): Promise<boolean> {
  const config = getSupabaseConfig()
  const targetTable = tableName || config.tableName
  
  try {
    // Try to fetch from the specified table
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${targetTable}?limit=1`, {
      headers: await getDatabaseHeaders()
    })
    
    if (response.ok) {
      return true // Table exists
    }
    
    // If table doesn't exist, log warning
    console.warn(`Table ${targetTable} may not exist. Status: ${response.status}`)
    return false
    
  } catch (error) {
    console.error(`Error checking table ${targetTable}:`, error)
    return false
  }
}

// Function to create dev table if it doesn't exist (backward compatibility)
export async function ensureDevTableExists(): Promise<boolean> {
  return ensureTableExists('pc_survey_data_dev')
}

// Function to submit survey data to Supabase
export async function submitSurveyToDatabase(surveyData: any): Promise<{ success: boolean; error?: string; data?: any }> {
  const config = getSupabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
      method: 'POST',
      headers: await getDatabaseHeaders(),
      body: JSON.stringify({
        ...surveyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Survey submission failed:', errorText)
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorText}` 
      }
    }

    const data = await response.json()
    console.log('✅ Survey submitted to database:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error submitting survey to database:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Function to get database connection status
export async function checkDatabaseConnection(): Promise<{ 
  connected: boolean; 
  environment: string; 
  tableName: string; 
  error?: string 
}> {
  const config = getSupabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?limit=1`, {
      headers: await getDatabaseHeaders()
    })
    
    if (response.ok) {
      return {
        connected: true,
        environment: config.environment,
        tableName: config.tableName
      }
    } else {
      return {
        connected: false,
        environment: config.environment,
        tableName: config.tableName,
        error: `HTTP ${response.status}: ${await response.text()}`
      }
    }
  } catch (error) {
    return {
      connected: false,
      environment: config.environment,
      tableName: config.tableName,
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}
