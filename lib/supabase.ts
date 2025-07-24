import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

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
