import { createClient } from '@supabase/supabase-js'

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      survey_data: {
        Row: {
          id: string
          role: string
          seniority_level: string
          company_type: string
          industry: string
          product_type: string
          customer_segment: string
          main_challenge: string
          tools: string[]
          learning_methods: string[]
          salary_range?: string
          email?: string
          created_at: string
        }
        Insert: {
          id?: string
          role: string
          seniority_level: string
          company_type: string
          industry: string
          product_type: string
          customer_segment: string
          main_challenge: string
          tools: string[]
          learning_methods: string[]
          salary_range?: string
          email?: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          seniority_level?: string
          company_type?: string
          industry?: string
          product_type?: string
          customer_segment?: string
          main_challenge?: string
          tools?: string[]
          learning_methods?: string[]
          salary_range?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}

// Global Supabase client instance
let supabaseClient: any = null
let configLoaded = false

// Function to get Supabase client with dynamic config from API
export async function getSupabaseClient() {
  // Return cached client if already loaded
  if (supabaseClient && configLoaded) {
    return supabaseClient
  }
  
  try {
    // Fetch config from API endpoint
    const response = await fetch('/api/config/supabase')
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }
    
    const config = await response.json()
    
    if (config.error) {
      throw new Error(config.error)
    }
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.warn('Supabase configuration incomplete from API')
      return null
    }
    
    // Create client with fetched config
    supabaseClient = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey)
    configLoaded = true
    
    console.log('✅ Supabase client created successfully')
    return supabaseClient
    
  } catch (error) {
    console.error('Error fetching Supabase config from API:', error)
    return null
  }
}

// Check if Supabase is configured (async version)
export async function isSupabaseConfigured() {
  const client = await getSupabaseClient()
  return !!client
}

// Helper function to check if we can use Supabase features
export async function requireSupabase() {
  const client = await getSupabaseClient()
  if (!client) {
    console.warn('Supabase not configured - features disabled')
    return false
  }
  return true
}

// For backward compatibility - returns null initially, should use getSupabaseClient() instead
export const supabase = null
