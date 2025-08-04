import { checkDatabaseConnection } from './database-config'

// Check if database is properly configured and accessible
export async function isDatabaseConfigured(): Promise<boolean> {
  try {
    const connection = await checkDatabaseConnection()
    return connection.success
  } catch (error) {
    console.error('Error checking database configuration:', error)
    return false
  }
}

// Check if user has admin privileges
export async function isUserAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false
  
  try {
    const { getSupabaseClient } = await import('./supabase')
    const supabase = await getSupabaseClient()
    if (!supabase) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Check if app is in maintenance mode
export async function isMaintenanceMode(): Promise<boolean> {
  // For now, always return false since we removed maintenance mode
  return false
}

// Validate database connection and return detailed status
export async function validateDatabaseStatus(): Promise<{
  configured: boolean
  connected: boolean
  error?: string
}> {
  try {
    const connection = await checkDatabaseConnection()
    
    return {
      configured: true,
      connected: connection.success,
      error: connection.error
    }
  } catch (error) {
    return {
      configured: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}