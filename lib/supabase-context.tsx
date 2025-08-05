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

// Global state to prevent multiple simultaneous requests
let isInitializing = false
let initializationPromise: Promise<any> | null = null

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    // Prevent multiple simultaneous requests
    if (isInitializing && initializationPromise) {
      try {
        const result = await initializationPromise
        return result
      } catch (error) {
        // If the existing request failed, try again
        console.log('🔧 [Supabase] Previous request failed, retrying...')
      }
    }

    isInitializing = true
    initializationPromise = (async () => {
      try {
        console.log('🔧 [Supabase] Fetching configuration...')
        
        const response = await fetch('/api/admin/settings', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
          const { url, apiKey } = result.data.database
          const newClient = createClient<Database>(url, apiKey)
          console.log('🔧 [Supabase] Client created successfully')
          return newClient
        } else {
          throw new Error('Configuration not available')
        }
      } catch (error) {
        console.error('🔧 [Supabase] Error fetching config:', error)
        throw error
      } finally {
        isInitializing = false
        initializationPromise = null
      }
    })()

    try {
      const newClient = await initializationPromise
      setClient(newClient)
      setError(null)
      return newClient
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load configuration')
      throw error
    }
  }

  const refreshClient = async () => {
    setIsLoading(true)
    try {
      await fetchClient()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initClient = async () => {
      try {
        await fetchClient()
      } catch (error) {
        // Error already set in fetchClient
      } finally {
        setIsLoading(false)
      }
    }

    initClient()
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