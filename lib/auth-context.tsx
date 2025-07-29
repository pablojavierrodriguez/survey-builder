'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
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
    // Only initialize Supabase auth if configured
    if (!supabase) {
      console.log('Supabase not configured - auth features disabled')
      setLoading(false)
      return
    }

    // Check if Supabase URL is not a placeholder
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Supabase URL is placeholder - auth features disabled')
      setLoading(false)
      return
    }

    try {
      // Get initial session
      if (supabase) {
        supabase.auth.getSession().then(({ data, error }) => {
          if (error) {
            console.error('Error getting session:', error)
          }
          const session = data?.session
          setUser(session?.user || null)
          setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email)
            setUser(session?.user || null)
            setLoading(false)
          }
        )

        return () => subscription.unsubscribe()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth context error:', error)
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase!
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
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Supabase not configured - Google OAuth not available') }
    }
    
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    
    const { error } = await supabase!.auth.signOut()
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }

    const { error } = await supabase!
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error) {
      await fetchProfile(user.id)
    }

    return { error }
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
