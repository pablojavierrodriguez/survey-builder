import { useState, useEffect } from 'react'

export function useDebugMode() {
  const [debugMode, setDebugMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDebugMode = async () => {
      try {
        // Prefer local settings if available to avoid protected admin endpoints
        try {
          const local = typeof window !== 'undefined' ? localStorage.getItem('app_settings') : null
          if (local) {
            const parsed = JSON.parse(local)
            if (parsed?.general?.debugMode === true) {
              setDebugMode(true)
            }
          }
        } catch {}

        // Public status endpoint; do not require auth and ignore failures
        const response = await fetch('/api/config/check')
        if (response.ok) {
          // We intentionally do not elevate debug mode from here
          // keep debugMode as-is (possibly set by local settings)
        }
      } catch (error) {
        // Degrade silently in public pages
      } finally {
        setLoading(false)
      }
    }

    fetchDebugMode()
  }, [])

  return { debugMode, loading }
}
