import { useState, useEffect } from 'react'

interface AppSettings {
  general: {
    surveyTitle: string
    publicUrl: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
    debugMode: boolean
  }
  database: {
    url?: string
    apiKey?: string
    tableName: string
    environment: string
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const config = result.data
            const apiSettings: AppSettings = {
              general: {
                surveyTitle: config.general?.surveyTitle || 'My Survey',
                publicUrl: config.general?.publicUrl || '',
                maintenanceMode: config.general?.maintenanceMode || false,
                analyticsEnabled: config.general?.analyticsEnabled || true,
                debugMode: config.general?.debugMode || false,
              },
              database: {
                url: config.database?.url || '',
                apiKey: config.database?.apiKey || '',
                tableName: config.database?.tableName || 'survey_responses',
                environment: config.database?.environment || 'development',
              }
            }
            setSettings(apiSettings)
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading }
}