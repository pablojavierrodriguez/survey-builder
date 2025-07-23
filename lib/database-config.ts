// Database configuration based on environment/branch
export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: 'dev' | 'main'
}

// Get current branch/environment from various sources
function getCurrentEnvironment(): 'dev' | 'main' {
  // Check if we're in a specific environment
  if (typeof window !== 'undefined') {
    // Client-side detection
    const hostname = window.location.hostname
    
    // If hostname contains 'dev' or we're on localhost, consider it dev
    if (hostname.includes('dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'dev'
    }
  }
  
  // Check environment variables
  const nodeEnv = process.env.NODE_ENV
  const branch = process.env.BRANCH || process.env.VERCEL_GIT_COMMIT_REF
  
  // If we detect dev branch or development environment
  if (branch === 'dev' || nodeEnv === 'development') {
    return 'dev'
  }
  
  // Default to main for production
  return 'main'
}

export function getDatabaseConfig(): DatabaseConfig {
  const environment = getCurrentEnvironment()
  
  const baseConfig = {
    supabaseUrl: "https://qaauhwulohxeeacexrav.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8"
  }
  
  if (environment === 'dev') {
    return {
      ...baseConfig,
      tableName: "pc_survey_data_dev",
      environment: 'dev'
    }
  } else {
    return {
      ...baseConfig, 
      tableName: "pc_survey_data",
      environment: 'main'
    }
  }
}

// Helper function to get the API endpoint
export function getDatabaseEndpoint(path: string = ""): string {
  const config = getDatabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}${path}`
}

// Helper function to get headers for Supabase requests
export function getDatabaseHeaders(): HeadersInit {
  const config = getDatabaseConfig()
  return {
    "apikey": config.anonKey,
    "Authorization": `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  }
}

// Function to create dev table if it doesn't exist
export async function ensureDevTableExists(): Promise<boolean> {
  const config = getDatabaseConfig()
  
  if (config.environment !== 'dev') {
    return true // No need to create table for main
  }
  
  try {
    // Try to fetch from dev table first
    const response = await fetch(getDatabaseEndpoint("?limit=1"), {
      headers: getDatabaseHeaders()
    })
    
    if (response.ok) {
      return true // Table exists
    }
    
    // If table doesn't exist, we would need to create it
    // For now, return false to indicate manual creation needed
    console.warn(`Dev table ${config.tableName} may not exist. Please create it manually with the same structure as pc_survey_data`)
    return false
    
  } catch (error) {
    console.error("Error checking dev table:", error)
    return false
  }
}