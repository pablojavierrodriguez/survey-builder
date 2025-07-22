"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Shield, Bell, Save, TestTube, Lock } from "lucide-react"

interface AppSettings {
  database: {
    url: string
    apiKey: string
    tableName: string
    connectionTimeout: number
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    requireHttps: boolean
    enableRateLimit: boolean
  }
  notifications: {
    emailAlerts: boolean
    adminEmail: string
    responseThreshold: number
  }
  general: {
    appName: string
    publicUrl: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    database: {
      url: "https://qaauhwulohxeeacexrav.supabase.co",
      apiKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
      tableName: "pc_survey_data",
      connectionTimeout: 30,
    },
    security: {
      sessionTimeout: 480, // 8 hours in minutes
      maxLoginAttempts: 3,
      requireHttps: true,
      enableRateLimit: true,
    },
    notifications: {
      emailAlerts: false,
      adminEmail: "admin@example.com",
      responseThreshold: 10,
    },
    general: {
      appName: "Product Survey Builder",
      publicUrl: window.location.origin,
      maintenanceMode: false,
      analyticsEnabled: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"success" | "error" | null>(null)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("app_settings")
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }
  }, [])

  const saveSettings = async () => {
    setIsSaving(true)

    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Save to localStorage (in production, this would be saved to backend)
    localStorage.setItem("app_settings", JSON.stringify(settings))

    setIsSaving(false)
    alert("Settings saved successfully!")
  }

  const testDatabaseConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)

    try {
      const response = await fetch(`${settings.database.url}/rest/v1/`, {
        headers: {
          apikey: settings.database.apiKey,
        },
      })

      setConnectionStatus(response.ok ? "success" : "error")
    } catch (error) {
      setConnectionStatus("error")
    } finally {
      setTestingConnection(false)
    }
  }

  const updateSettings = (section: keyof AppSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Database Settings */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supabase URL</label>
              <Input
                value={settings.database.url}
                onChange={(e) => updateSettings("database", "url", e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table Name</label>
              <Input
                value={settings.database.tableName}
                onChange={(e) => updateSettings("database", "tableName", e.target.value)}
                placeholder="pc_survey_data"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={settings.database.apiKey}
                onChange={(e) => updateSettings("database", "apiKey", e.target.value)}
                placeholder="Your Supabase anon key"
                className="flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
              <Button onClick={testDatabaseConnection} disabled={testingConnection} variant="outline">
                <TestTube className="w-4 h-4 mr-2" />
                {testingConnection ? "Testing..." : "Test"}
              </Button>
            </div>

            {connectionStatus && (
              <div
                className={`mt-2 flex items-center gap-2 text-sm ${
                  connectionStatus === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {connectionStatus === "success" ? (
                  <>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Connected
                    </Badge>
                    Database connection successful
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Failed
                    </Badge>
                    Unable to connect to database
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connection Timeout (seconds)
            </label>
            <Input
              type="number"
              value={settings.database.connectionTimeout}
              onChange={(e) => updateSettings("database", "connectionTimeout", Number.parseInt(e.target.value))}
              className="w-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSettings("security", "sessionTimeout", Number.parseInt(e.target.value))}
                className="w-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Users will be logged out after this period of inactivity
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Login Attempts</label>
              <Input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => updateSettings("security", "maxLoginAttempts", Number.parseInt(e.target.value))}
                className="w-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Require HTTPS</label>
                <p className="text-xs text-gray-500">Force secure connections only</p>
              </div>
              <Switch
                checked={settings.security.requireHttps}
                onCheckedChange={(checked) => updateSettings("security", "requireHttps", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Rate Limiting</label>
                <p className="text-xs text-gray-500">Prevent brute force attacks</p>
              </div>
              <Switch
                checked={settings.security.enableRateLimit}
                onCheckedChange={(checked) => updateSettings("security", "enableRateLimit", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Alerts</label>
              <p className="text-xs text-gray-500">Receive notifications for new responses</p>
            </div>
            <Switch
              checked={settings.notifications.emailAlerts}
              onCheckedChange={(checked) => updateSettings("notifications", "emailAlerts", checked)}
            />
          </div>

          {settings.notifications.emailAlerts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Email</label>
                <Input
                  type="email"
                  value={settings.notifications.adminEmail}
                  onChange={(e) => updateSettings("notifications", "adminEmail", e.target.value)}
                  placeholder="admin@example.com"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alert Threshold</label>
                <Input
                  type="number"
                  value={settings.notifications.responseThreshold}
                  onChange={(e) =>
                    updateSettings("notifications", "responseThreshold", Number.parseInt(e.target.value))
                  }
                  className="w-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Send alert every N responses</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Name</label>
              <Input
                value={settings.general.appName}
                onChange={(e) => updateSettings("general", "appName", e.target.value)}
                placeholder="Product Survey Builder"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Public URL</label>
              <Input
                value={settings.general.publicUrl}
                onChange={(e) => updateSettings("general", "publicUrl", e.target.value)}
                placeholder="https://your-domain.com"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                <p className="text-xs text-gray-500">Temporarily disable survey collection</p>
              </div>
              <Switch
                checked={settings.general.maintenanceMode}
                onCheckedChange={(checked) => updateSettings("general", "maintenanceMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Analytics Enabled</label>
                <p className="text-xs text-gray-500">Track usage and performance metrics</p>
              </div>
              <Switch
                checked={settings.general.analyticsEnabled}
                onCheckedChange={(checked) => updateSettings("general", "analyticsEnabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Lock className="w-5 h-5" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 dark:text-yellow-100">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Authentication:</strong> Demo credentials are hardcoded for testing purposes.
            </p>
            <p>
              <strong>Session Management:</strong> Sessions are stored in localStorage and sessionStorage.
            </p>
            <p>
              <strong>Database Access:</strong> Using Supabase Row Level Security with anonymous access.
            </p>
            <p>
              <strong>Production Notes:</strong> Implement proper JWT authentication, server-side session management,
              and environment variables for sensitive data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
