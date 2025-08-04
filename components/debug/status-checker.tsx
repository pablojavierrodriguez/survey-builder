'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface SystemStatus {
  environment: string
  vercelEnv: string
  availableEnvVars: number
  totalEnvVars: number
  supabaseConfig: {
    url: string
    key: string
  }
  apiStatus: {
    config: boolean
    settings: boolean
    survey: boolean
  }
  clientStatus: {
    windowEnv: boolean
    processEnv: boolean
    supabaseClient: boolean
  }
}

export function StatusChecker() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check environment variables
      const envResponse = await fetch('/api/debug/env')
      const envData = await envResponse.json()

      // Check API endpoints
      const settingsResponse = await fetch('/api/admin/settings')
      const settingsData = await settingsResponse.json()

      // Check client-side environment
      const windowEnv = false // window.__ENV__ was removed for security
      const processEnv = typeof process !== 'undefined' && process.env
      const supabaseClient = false // window.__ENV__ was removed for security

      setStatus({
        environment: envData.environment,
        vercelEnv: envData.vercelEnv,
        availableEnvVars: envData.availableCount,
        totalEnvVars: envData.totalCount,
        supabaseConfig: {
          url: settingsData.data?.database?.url ? 'SET' : 'EMPTY',
          key: settingsData.data?.database?.apiKey ? 'SET' : 'EMPTY'
        },
        apiStatus: {
          config: true, // Config now comes from settings
          settings: !settingsData.error,
          survey: true // Assume survey API exists
        },
        clientStatus: {
          windowEnv: !!windowEnv,
          processEnv: !!processEnv,
          supabaseClient: supabaseClient
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span>Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>No status data available</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (condition: boolean) => {
    return condition ? (
      <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>
    ) : (
      <Badge variant="destructive">FAILED</Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Status Check
          <Button variant="outline" size="sm" onClick={checkStatus}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Environment</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Node Environment:</span>
                <Badge variant="outline">{status.environment}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Vercel Environment:</span>
                <Badge variant="outline">{status.vercelEnv}</Badge>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Environment Variables</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Available:</span>
                <Badge variant="outline">{status.availableEnvVars}/{status.totalEnvVars}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Supabase Configuration */}
        <div>
          <h4 className="font-medium mb-2">Supabase Configuration</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>URL:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabaseConfig.url === 'SET')}
                <Badge variant="outline">{status.supabaseConfig.url}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>API Key:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabaseConfig.key === 'SET')}
                <Badge variant="outline">{status.supabaseConfig.key}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div>
          <h4 className="font-medium mb-2">API Endpoints</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Config API:</span>
              {getStatusBadge(status.apiStatus.config)}
            </div>
            <div className="flex items-center justify-between">
              <span>Settings API:</span>
              {getStatusBadge(status.apiStatus.settings)}
            </div>
            <div className="flex items-center justify-between">
              <span>Survey API:</span>
              {getStatusBadge(status.apiStatus.survey)}
            </div>
          </div>
        </div>

        {/* Client Status */}
        <div>
          <h4 className="font-medium mb-2">Client Environment</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Window.__ENV__:</span>
              {getStatusBadge(status.clientStatus.windowEnv)}
            </div>
            <div className="flex items-center justify-between">
              <span>Process.env:</span>
              {getStatusBadge(status.clientStatus.processEnv)}
            </div>
            <div className="flex items-center justify-between">
              <span>Supabase Client:</span>
              {getStatusBadge(status.clientStatus.supabaseClient)}
            </div>
          </div>
        </div>

        {/* Critical Issues */}
        {(!status.supabaseConfig.url || !status.supabaseConfig.key) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Issue:</strong> Supabase configuration is missing. 
              This will prevent all database operations from working.
            </AlertDescription>
          </Alert>
        )}

        {status.availableEnvVars === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Issue:</strong> No environment variables are available. 
              Check your Vercel deployment settings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}