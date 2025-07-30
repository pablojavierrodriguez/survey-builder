'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'
import { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get dynamic Supabase client
        const client = await getSupabaseClient()
        if (!client) {
          console.log('Supabase not configured - auth features disabled')
          setLoading(false)
          return
        }

        // Get initial session
        const { data, error } = await client.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        const session = data?.session
        setUser(session?.user || null)
        setLoading(false)

        // Listen for auth changes
        const { data: { subscription } } = client.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email)
            setUser(session?.user || null)
            setLoading(false)
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Auth context error:', error)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const client = await getSupabaseClient()
      if (!client) return

      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured - auth features disabled') }
      }

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error as Error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured - auth features disabled') }
      }

      const { data, error } = await client.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error: error as Error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured - Google OAuth not available') }
      }

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error: error as Error }
      }

      // OAuth redirects to callback page, so we don't set user here
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured - auth features disabled') }
      }

      const { error } = await client.auth.signOut()

      if (error) {
        return { error: error as Error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured - auth features disabled') }
      }

      const { error } = await client
        .from('profiles')
        .update(updates)
        .eq('id', user?.id)

      if (error) {
        return { error: error as Error }
      }

      // Refresh profile data
      await fetchProfile(user?.id || '')

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithPassword,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
