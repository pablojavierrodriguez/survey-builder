import { createClient } from '@supabase/supabase-js'
import { getConfig } from './config-manager'

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

// Global Supabase client instance (server only)
let supabaseClient: any = null
let configLoaded = false

// Function to get Supabase client with dynamic config
export async function getSupabaseClient() {
  // On the server, use config-manager directly
  if (typeof window === 'undefined') {
    const config = await getConfig()
    if (!config.database.url || !config.database.apiKey) {
      console.warn('Supabase not configured (server)')
      return null
    }
    if (supabaseClient && configLoaded) {
      return supabaseClient
    }
    supabaseClient = createClient<Database>(config.database.url, config.database.apiKey)
    configLoaded = true
    return supabaseClient
  }
  // On the client, fetch from /api/config
  try {
    const response = await fetch('/api/config')
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }
    const config = await response.json()
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.warn('Supabase not configured (client)')
      return null
    }
    return createClient<Database>(config.supabaseUrl, config.supabaseAnonKey)
  } catch (error) {
    console.error('Error fetching Supabase config from /api/config:', error)
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
