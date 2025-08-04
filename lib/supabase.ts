import { createClient } from '@supabase/supabase-js'

// Simple environment variable getter (client-side only)
function getEnvVar(key: string): string {
  // Client-side: only use NEXT_PUBLIC_ variables
  return process.env[key] || ''
}

// Get Supabase configuration (client-side only)
function getSupabaseConfig() {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Only log if configured to avoid noise
  if (supabaseUrl && supabaseAnonKey) {
    console.log('🔧 [Supabase] Config Check:', {
      supabaseUrl: 'SET',
      supabaseAnonKey: 'SET'
    })
  }

  return { supabaseUrl, supabaseAnonKey }
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Only log if configured
if (isSupabaseConfigured) {
  console.log('🔧 [Supabase] Client initialized successfully')
}

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
  return null
}

// Helper function to check if we can use Supabase features
export function requireSupabase() {
  return !!(isSupabaseConfigured && supabase)
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
