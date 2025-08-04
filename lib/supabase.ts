import { createClient } from '@supabase/supabase-js'

// Simple environment variable getter (server-side only)
function getEnvVar(key: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: only use NEXT_PUBLIC_ variables
    return process.env[key] || ''
  } else {
    // Server-side: try POSTGRES_ variables first, then NEXT_PUBLIC_
    const postgresKey = key.replace('NEXT_PUBLIC_', 'POSTGRES_')
    return process.env[postgresKey] || process.env[key] || ''
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

  // Only log on server side to avoid POSTGRES_ warnings
  if (typeof window === 'undefined') {
    console.log('🔧 [Supabase] Config Check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'EMPTY',
      supabaseAnonKey: supabaseAnonKey ? 'SET' : 'EMPTY',
      envKeys: {
        NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
        POSTGRES_NEXT_PUBLIC_SUPABASE_URL: getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
        POSTGRES_SUPABASE_URL: getEnvVar('POSTGRES_SUPABASE_URL') ? 'SET' : 'EMPTY',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'SET' : 'EMPTY',
        POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'SET' : 'EMPTY',
        POSTGRES_SUPABASE_ANON_KEY: getEnvVar('POSTGRES_SUPABASE_ANON_KEY') ? 'SET' : 'EMPTY',
      }
    })
  } else {
    // Client-side logging without POSTGRES_ variables
    console.log('🔧 [Supabase] Config Check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'EMPTY',
      supabaseAnonKey: supabaseAnonKey ? 'SET' : 'EMPTY',
      envKeys: {
        NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'EMPTY',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'SET' : 'EMPTY',
      }
    })
  }

  return { supabaseUrl, supabaseAnonKey }
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

console.log('🔧 [Supabase] Client initialization:', {
  isConfigured: isSupabaseConfigured,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0
})

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Function to get Supabase client with dynamic config
export async function getSupabaseClient() {
  if (supabase) {
    return supabase
  }
  
  // If not configured, return null
  console.log('🔧 [Supabase] Not configured - auth features disabled')
  return null
}

// Helper function to check if we can use Supabase features
export function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('⚠️ [Supabase] Not configured - falling back to demo mode')
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
