// =====================================================================================
// APPLICATION TYPES - Proper type definitions to replace 'any' usage
// =====================================================================================

import type { Database } from "./supabase"

// Supabase client types
export interface SupabaseClient {
  from: (table: string) => any
  auth: {
    getUser: () => Promise<{ data: { user: any } | null; error: any }>
    getSession: () => Promise<{ data: { session: any } | null; error: any }>
    onAuthStateChange: (callback: (event: string, session: any) => void) => { data: { subscription: any } }
    exchangeCodeForSession: (code: string) => Promise<any>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>
    signUp: (credentials: { email: string; password: string }) => Promise<any>
    signInWithOAuth: (provider: { provider: string }) => Promise<any>
    signOut: () => Promise<any>
  }
}

export interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder
  insert: (data: any) => SupabaseQueryBuilder
  upsert: (data: any) => SupabaseQueryBuilder
  update: (data: any) => SupabaseQueryBuilder
  delete: () => SupabaseQueryBuilder
  eq: (column: string, value: any) => SupabaseQueryBuilder
  limit: (count: number) => SupabaseQueryBuilder
  then: (callback: (result: any) => void) => Promise<any>
}

// Survey data types
export interface SurveyData {
  role: string
  other_role: string
  seniority: string
  company_type: string
  company_size: string
  industry: string
  product_type: string
  customer_segment: string
  main_challenge: string
  daily_tools: string[]
  other_tool: string
  learning_methods: string[]
  salary_currency: string
  salary_min: string
  salary_max: string
  salary_average: string
  email: string
}

// App settings types
export interface AppSettings {
  general: {
    maintenanceMode: boolean
    debugMode: boolean
    [key: string]: any
  }
  [key: string]: any
}

// Auth context types
export interface AuthContextType {
  user: any | null
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null
  session: any | null
  loading: boolean
  userIsAdmin: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  clearCorruptedSession: () => Promise<void>
  updateProfile: (updates: Partial<Database["public"]["Tables"]["profiles"]["Row"]>) => Promise<{ error: Error | null }>
  getAccessToken: () => string | null
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Database operation types
export interface DatabaseOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Form data types
export interface FormData {
  get: (key: string) => string | null
  entries: () => IterableIterator<[string, string]>
}

// Error types
export interface AppError {
  message: string
  code?: string
  details?: any
}