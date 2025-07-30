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
  getAccessToken: () => string | null
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
        const supabase = await getSupabaseClient()
        if (!supabase) {
          console.warn('Supabase not configured - auth features disabled')
          setLoading(false)
          return
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: any, session: any) => {
            console.log('Auth state changed:', event, session?.user?.id)
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
              // Fetch user profile
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              setProfile(profileData)
            } else {
              setProfile(null)
            }
          }
        )

        setLoading(false)
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signInWithPassword = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) {
        return { error: new Error('Supabase not configured') }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error as Error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) {
        return { error: new Error('Supabase not configured') }
      }

      const { error } = await supabase.auth.signUp({ email, password })
      return { error: error as Error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) {
        return { error: new Error('Supabase not configured') }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      return { error: error as Error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) {
        return { error: new Error('Supabase not configured') }
      }

      const { error } = await supabase.auth.signOut()
      return { error: error as Error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase || !user) {
        return { error: new Error('Supabase not configured or user not authenticated') }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      
      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
      }
      
      return { error: error as Error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const getAccessToken = (): string | null => {
    return session?.access_token || null
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
    getAccessToken,
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
