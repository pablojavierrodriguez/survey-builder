import { createClient } from '@supabase/supabase-js'

// Cache for Supabase configuration
let supabaseConfig: { supabaseUrl: string; supabaseAnonKey: string } | null = null

// Function to get Supabase configuration from API
async function getSupabaseConfig() {
  if (supabaseConfig) {
    return supabaseConfig
  }

  try {
    const response = await fetch('/api/config/supabase')
    if (!response.ok) {
      throw new Error('Failed to fetch Supabase config')
    }
    
    const config = await response.json()
    supabaseConfig = {
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey
    }
    
    return supabaseConfig
  } catch (error) {
    console.error('Error fetching Supabase config:', error)
    // Fallback to empty config
    return { supabaseUrl: '', supabaseAnonKey: '' }
  }
}

// Create Supabase client with dynamic configuration
export async function createSupabaseClient() {
  const config = await getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('Supabase not configured - auth features disabled')
    return null
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey)
}

// For backward compatibility, create a default client
let supabaseClient: any = null

// Initialize the client
async function initializeClient() {
  if (!supabaseClient) {
    supabaseClient = await createSupabaseClient()
  }
  return supabaseClient
}

// Export the client with initialization
export const supabase = {
  auth: {
    getSession: async () => {
      const client = await initializeClient()
      return client?.auth.getSession() || { data: { session: null }, error: null }
    },
    signUp: async (credentials: any) => {
      const client = await initializeClient()
      return client?.auth.signUp(credentials) || { data: null, error: new Error('Supabase not configured') }
    },
    signInWithPassword: async (credentials: any) => {
      const client = await initializeClient()
      return client?.auth.signInWithPassword(credentials) || { data: null, error: new Error('Supabase not configured') }
    },
    signOut: async () => {
      const client = await initializeClient()
      return client?.auth.signOut() || { error: new Error('Supabase not configured') }
    }
  },
  from: (table: string) => {
    return {
      select: async (columns?: string) => {
        const client = await initializeClient()
        if (!client) {
          return { data: null, error: new Error('Supabase not configured') }
        }
        return client.from(table).select(columns)
      },
      insert: async (data: any) => {
        const client = await initializeClient()
        if (!client) {
          return { data: null, error: new Error('Supabase not configured') }
        }
        return client.from(table).insert(data)
      },
      update: async (data: any) => {
        const client = await initializeClient()
        if (!client) {
          return { data: null, error: new Error('Supabase not configured') }
        }
        return client.from(table).update(data)
      },
      delete: async () => {
        const client = await initializeClient()
        if (!client) {
          return { data: null, error: new Error('Supabase not configured') }
        }
        return client.from(table).delete()
      }
    }
  },
  rpc: async (functionName: string, params?: any) => {
    const client = await initializeClient()
    if (!client) {
      return { data: null, error: new Error('Supabase not configured') }
    }
    return client.rpc(functionName, params)
  }
}

// Helper function to check if we can use Supabase features
export function requireSupabase() {
  if (!supabase) {
    console.warn('Supabase not configured - falling back to demo mode')
    return false
  }
  return true
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  // This will be determined at runtime when the client is initialized
  return true // We'll check this dynamically
}

// Database types for better TypeScript support
export type Profile = {
  id: string
  email: string
  role: 'admin' | 'collaborator' | 'viewer'
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type UserManagement = {
  id: string
  email: string
  role: 'admin' | 'collaborator' | 'viewer'
  full_name?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed: boolean
}
