import { useState, useEffect } from 'react'

export function useDebugMode() {
  const [debugMode, setDebugMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDebugMode = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.general?.debugMode) {
            setDebugMode(result.data.general.debugMode)
          }
        }
      } catch (error) {
        console.error('Error fetching debug mode:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDebugMode()
  }, [])

  return { debugMode, loading }
}
