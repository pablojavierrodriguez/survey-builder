"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"
import type { Database } from "./supabase"
import { getUserRoleFromProfile } from "./permissions"
import type { AuthContextType, SupabaseClient } from "./types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]



const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    let mounted = true

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

        if (mounted) setSupabase(client as unknown as SupabaseClient)

        const {
          data: { subscription },
        } = client.auth.onAuthStateChange(async (event: string, session: Session | null) => {
          console.log("🔐 [Auth] State change:", event, session?.user?.email)

          if (session?.user?.id) {
            if (mounted) {
              setSession(session)
              setUser(session.user)

              // Fetch user profile with retry logic
              let profileData = null
              let retryCount = 0
              const maxRetries = 3
              
              while (retryCount < maxRetries) {
                try {
                  const { data, error } = await Promise.race([
                    client
                      .from("profiles")
                      .select("*")
                      .eq("id", session.user.id)
                      .limit(1),
                    new Promise<{ data: Profile[] | null; error: any }>((_, reject) => 
                      setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
                    )
                  ])
                  
                  if (error) {
                    console.warn(`🔐 [Auth] Profile fetch error (attempt ${retryCount + 1}):`, error)
                    retryCount++
                    if (retryCount < maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                      continue
                    }
                    throw error
                  }
                  
                  profileData = data
                  break
                } catch (profileError: unknown) {
                  console.warn(`🔐 [Auth] Profile fetch failed (attempt ${retryCount + 1}):`, profileError)
                  retryCount++
                  if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                    continue
                  }
                  console.error("🔐 [Auth] Could not fetch profile after all retries:", profileError)
                  if (mounted) setProfile(null)
                  return
                }
              }
              
              console.log("🔐 [Auth] Profile loaded:", profileData?.[0])
              const loadedProfile = profileData?.[0] || null
              const userRole = getUserRoleFromProfile(loadedProfile, session.user.email)
              console.log("🔐 [Auth] User role determined:", userRole, "for email:", session.user.email)
              if (mounted) setProfile(loadedProfile)
            }
          } else {
            console.log("🔐 [Auth] No valid session found")
            if (mounted) {
              setSession(null)
              setUser(null)
              setProfile(null)
            }
          }
        })

        // Clear potentially corrupted tokens
        localStorage.removeItem("supabase.auth.token")
        localStorage.removeItem(`sb-${window.location.hostname}-auth-token`)

        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession()

        if (sessionError) {
          console.warn("🔐 [Auth] Session error - clearing all auth data:", sessionError.message)
          await client.auth.signOut()
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        } else if (session?.user?.id) {
          if (mounted) {
            setSession(session)
            setUser(session.user)

            // Fetch user profile with retry logic
            let profileData = null
            let retryCount = 0
            const maxRetries = 3
            
            while (retryCount < maxRetries) {
              try {
                const { data, error } = await Promise.race([
                  client.from("profiles").select("*").eq("id", session.user.id).limit(1),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Initial profile fetch timeout")), 5000)
                  )
                ]) as any
                
                if (error) {
                  console.warn(`🔐 [Auth] Initial profile fetch error (attempt ${retryCount + 1}):`, error)
                  retryCount++
                  if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                    continue
                  }
                  throw error
                }
                
                profileData = data
                break
              } catch (profileError: unknown) {
                console.warn(`🔐 [Auth] Initial profile fetch failed (attempt ${retryCount + 1}):`, profileError)
                retryCount++
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                  continue
                }
                console.error("🔐 [Auth] Could not fetch initial profile after all retries:", profileError)
                if (mounted) setProfile(null)
                break
              }
            }
            
            console.log("🔐 [Auth] Initial profile loaded:", profileData?.[0])
            const loadedProfile = profileData?.[0] || null
            const userRole = getUserRoleFromProfile(loadedProfile, session.user.email)
            console.log("🔐 [Auth] Initial user role determined:", userRole, "for email:", session.user.email)
            if (mounted) setProfile(loadedProfile)
          }
        } else {
          console.log("🔐 [Auth] No valid session found")
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        }

        return () => {
          mounted = false
          try {
            subscription.unsubscribe()
          } catch (e) {}
        }
      } catch (authError: unknown) {
        console.warn("🔐 [Auth] Auth error - clearing session:", authError instanceof Error ? authError.message : "Unknown error")
        const client = supabase
        try {
          if (client) {
            await client.auth.signOut()
          }
          localStorage.removeItem("supabase.auth.token")
          localStorage.removeItem(`sb-${window.location.hostname}-auth-token`)
        } catch (clearError) {
          console.warn("Error clearing auth data:", clearError)
        }

        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const userIsAdmin = getUserRoleFromProfile(profile, user?.email) === "admin"

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
      } as any)
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