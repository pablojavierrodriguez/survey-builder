import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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