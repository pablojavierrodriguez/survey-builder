"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"
import type { Database } from "./supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  userIsAdmin: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  clearCorruptedSession: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const mounted = true

    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          console.warn("Supabase not configured - auth features disabled")
          if (mounted) setLoading(false)
          return
        }

        // Get Supabase client
        const client = await getSupabaseClient()
        if (!client) {
          console.warn("Could not initialize Supabase client")
          if (mounted) setLoading(false)
          return
        }

        if (mounted) setSupabase(client)

        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession()

        if (sessionError && sessionError.message.includes("Refresh Token")) {
          console.warn("🔐 [Auth] Refresh token error detected - clearing session")
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          if (!session?.user?.id) {
            console.log("🔐 [Auth] No valid user found - clearing session")
            setSession(null)
            setUser(null)
            setProfile(null)
          } else {
            setSession(session)
            setUser(session.user)

            // Fetch user profile
            try {
              const { data: profileData } = await client.from("profiles").select("*").eq("id", session.user.id).limit(1)

              if (mounted) setProfile(profileData?.[0] || null)
            } catch (profileError) {
              console.warn("Could not fetch profile:", profileError)
              if (mounted) setProfile(null)
            }
          }
        }

        // Set up auth state listener
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange(async (event: string, session: Session | null) => {
          console.log("🔐 [Auth] Auth state change:", event, session?.user?.email)

          if (mounted) {
            setSession(session)
            setUser(session?.user || null)

            if (session?.user?.id) {
              try {
                const { data: profileData } = await client
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .limit(1)

                setProfile(profileData?.[0] || null)
              } catch (error) {
                console.warn("Could not fetch profile on auth change:", error)
                setProfile(null)
              }
            } else {
              setProfile(null)
            }
          }
        })

        return () => {
          subscription?.unsubscribe()
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const userIsAdmin = profile?.email === "admin@demo.com" || profile?.email === "admin@example.com"

  const signInWithPassword = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      if (!supabase) return { error: new Error("Supabase not configured") }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Sign in failed") }
    }
  }

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      if (!supabase) return { error: new Error("Supabase not configured") }

      const { error } = await supabase.auth.signUp({ email, password })
      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Sign up failed") }
    }
  }

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      if (!supabase) return { error: new Error("Supabase not configured") }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Google sign in failed") }
    }
  }

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      if (!supabase) return { error: new Error("Supabase not configured") }

      setSession(null)
      setUser(null)
      setProfile(null)

      const { error } = await supabase.auth.signOut()

      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("sb-" + window.location.hostname + "-auth-token")

      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Sign out failed") }
    }
  }

  const clearCorruptedSession = async (): Promise<void> => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error("Error clearing session:", error)
    }

    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    try {
      if (!supabase) return { error: new Error("Supabase not configured") }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user?.id)

      if (!error) {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      }

      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Profile update failed") }
    }
  }

  const getAccessToken = (): string | null => {
    return session?.access_token || null
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    userIsAdmin,
    signInWithPassword,
    signUp,
    signInWithGoogle,
    signOut,
    clearCorruptedSession,
    updateProfile,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
