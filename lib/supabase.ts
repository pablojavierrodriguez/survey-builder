import { createClient } from '@supabase/supabase-js'

// Extend Window interface for client-side Supabase
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: any
  }
}

// For server-side, use environment variables directly
let supabaseUrl = ''
let supabaseAnonKey = ''

// For client-side, we'll fetch the config from our API
if (typeof window !== 'undefined') {
  // Client-side: fetch config from API
  fetch('/api/config/supabase')
    .then(response => response.json())
    .then(config => {
      supabaseUrl = config.supabaseUrl
      supabaseAnonKey = config.supabaseAnonKey
      // Re-initialize the client with the fetched config
      if (supabaseUrl && supabaseAnonKey) {
        window.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey)
      }
    })
    .catch(error => {
      console.error('Failed to fetch Supabase config:', error)
    })
} else {
  // Server-side: use environment variables
  supabaseUrl = process.env.POSTGRES_SUPABASE_URL || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || ''
  supabaseAnonKey = process.env.POSTGRES_SUPABASE_ANON_KEY || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to get the client (with fallback for client-side)
export function getSupabaseClient() {
  if (typeof window !== 'undefined' && window.__SUPABASE_CLIENT__) {
    return window.__SUPABASE_CLIENT__
  }
  return supabase
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
