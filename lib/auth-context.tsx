'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'
import { Profile } from './supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
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

  const signIn = async (email: string, password: string) => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured') }
      }
      
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured') }
      }
      
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error }
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
        return { error }
      }

      // OAuth redirects to callback page, so we don't set user here
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured') }
      }
      
      const { error } = await client.auth.signOut()
      if (error) {
        return { error }
      }

      setUser(null)
      setProfile(null)
      setSession(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }
    try {
      const client = await getSupabaseClient()
      if (!client) {
        return { error: new Error('Supabase not configured') }
      }

      const { error } = await client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (!error) {
        await fetchProfile(user.id)
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
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
