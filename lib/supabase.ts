import { createClient } from '@supabase/supabase-js'

// Cache for Supabase configuration
let supabaseConfig: { supabaseUrl: string; supabaseAnonKey: string } | null = null
let supabaseClient: any = null

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
  if (supabaseClient) {
    return supabaseClient
  }

  const config = await getSupabaseConfig()
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('Supabase not configured - auth features disabled')
    return null
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey)
  return supabaseClient
}

// Initialize the client immediately
createSupabaseClient().then(client => {
  supabaseClient = client
})

// Export the client
export const supabase = supabaseClient

// Helper function to check if we can use Supabase features
export function requireSupabase() {
  if (!supabaseClient) {
    console.warn('Supabase not configured - falling back to demo mode')
    return false
  }
  return true
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!supabaseClient
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
