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

      // Always fetch config from database (simple and scalable)
      const response = await fetch('/api/admin/settings')
      const result = await response.json()
      
      if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
        const { url, apiKey } = result.data.database
        const newClient = createClient<Database>(url, apiKey)
        setClient(newClient)
      } else {
        setError('Configuration not available')
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