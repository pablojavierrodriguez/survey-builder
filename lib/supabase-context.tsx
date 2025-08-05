"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

interface SupabaseContextType {
  client: any | null
  isLoading: boolean
  error: string | null
  refreshClient: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Server-side: use local config for bootstrap
      if (typeof window === 'undefined') {
        try {
          const localConfigModule = await import('./local-config')
          if (localConfigModule && typeof localConfigModule.readLocalConfig === 'function') {
            const localConfig = localConfigModule.readLocalConfig()
            if (localConfig) {
              const serverClient = createClient<Database>(localConfig.supabaseUrl, localConfig.supabaseKey)
              setClient(serverClient)
              return
            }
          }
        } catch (error) {
          // Silently handle import errors
        }
      }

      // Client-side: fetch config from database (scalable for multi-admin/multi-survey)
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/admin/settings')
        const result = await response.json()
        
        if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
          const { url, apiKey } = result.data.database
          const newClient = createClient<Database>(url, apiKey)
          setClient(newClient)
        } else {
          // Fallback to environment variables if no database config
          const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (envUrl && envKey) {
            const fallbackClient = createClient<Database>(envUrl, envKey)
            setClient(fallbackClient)
          } else {
            setError('Configuration not available')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Supabase config:', error)
      setError('Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshClient = async () => {
    await fetchClient()
  }

  useEffect(() => {
    fetchClient()
  }, [])

  return (
    <SupabaseContext.Provider value={{ client, isLoading, error, refreshClient }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}