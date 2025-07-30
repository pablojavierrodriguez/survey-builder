import { createClient } from '@supabase/supabase-js'

// Simple environment variable getter
function getEnvVar(key: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: try window.__ENV__ first, then process.env
    return (window as any).__ENV__?.[key] || process.env[key] || ''
  } else {
    // Server-side: use process.env
    return process.env[key] || ''
  }
}

// Get Supabase configuration with multiple fallbacks
function getSupabaseConfig() {
  // Try multiple possible variable names
  const supabaseUrl = 
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
    getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ||
    getEnvVar('POSTGRES_SUPABASE_URL') ||
    ''

  const supabaseAnonKey = 
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnvVar('POSTGRES_SUPABASE_ANON_KEY') ||
    ''

  console.log('🔧 Supabase Config Check:', {
    supabaseUrl: supabaseUrl ? 'SET' : 'EMPTY',
    supabaseAnonKey: supabaseAnonKey ? 'SET' : 'EMPTY',
    envKeys: {
      NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
      POSTGRES_NEXT_PUBLIC_SUPABASE_URL: getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
      POSTGRES_SUPABASE_URL: getEnvVar('POSTGRES_SUPABASE_URL') ? 'SET' : 'EMPTY',
    }
  })

  return { supabaseUrl, supabaseAnonKey }
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Function to get Supabase client with dynamic config
export async function getSupabaseClient() {
  if (supabase) {
    return supabase
  }
  
  // Try to fetch config from API if not available
  try {
    const response = await fetch('/api/config/supabase')
    const config = await response.json()
    
    if (config.supabaseUrl && config.supabaseAnonKey) {
      return createClient(config.supabaseUrl, config.supabaseAnonKey)
    }
  } catch (error) {
    console.error('Error fetching Supabase config from API:', error)
  }
  
  return null
}

// Helper function to check if we can use Supabase features
export function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured - falling back to demo mode')
    return false
  }
  return true
}

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
