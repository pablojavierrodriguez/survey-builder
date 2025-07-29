import { createClient } from '@supabase/supabase-js'

// Get environment variables safely
function getEnvVar(key: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use window.__ENV__
    return (window as any).__ENV__?.[key] || ''
  } else {
    // Server-side: use process.env
    return process.env[key] || ''
  }
}

// Use standard Next.js environment variables for Supabase
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if we can use Supabase features
export function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured - falling back to demo mode')
    return false
  }
  return true
}

// Database types for better TypeScript support
export type Profile = {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'collaborator' | 'viewer'
  created_at: string
  updated_at: string
}

export type SurveyResponse = {
  id: string
  created_at: string
  updated_at: string
  role: string
  seniority: string
  company_type: string
  industry: string
  product_type: string
  customer_segment: string
  main_challenge: string
  tools_used: string[]
  learning_methods: string[]
  salary_range?: string
  email?: string
  currency?: string
  location?: string
  experience_years?: number
  team_size?: number
  product_stage?: string
  user_feedback?: string
  additional_notes?: string
}
