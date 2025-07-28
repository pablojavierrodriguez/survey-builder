"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Database, 
  Shield, 
  Palette, 
  Bell, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Info
} from "lucide-react"
import { getAppSettings, updateAppSettings, clearSettingsCache } from "@/lib/app-settings"
import type { AppSettings } from "@/lib/app-settings"

export default function AppConfigPage() {
  const [devSettings, setDevSettings] = useState<AppSettings | null>(null)
  const [prodSettings, setProdSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const [dev, prod] = await Promise.all([
        getAppSettings('dev'),
        getAppSettings('prod')
      ])
      
      setDevSettings(dev)
      setProdSettings(prod)
      setMessage({ type: 'success', text: 'Settings loaded successfully' })
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (environment: 'dev' | 'prod', settings: Partial<AppSettings>) => {
    setSaving(true)
    try {
      const result = await updateAppSettings(environment, settings)
      
      if (result.success) {
        setMessage({ type: 'success', text: `${environment.toUpperCase()} settings saved successfully` })
        await loadSettings() // Reload to get updated settings
      } else {
        setMessage({ type: 'error', text: `Failed to save ${environment} settings: ${result.error}` })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const clearCache = async () => {
    try {
      clearSettingsCache()
      setMessage({ type: 'success', text: 'Cache cleared successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear cache' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">App Configuration</h1>
          <p className="text-muted-foreground">
            Manage application settings for different environments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearCache}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
          <Button
            onClick={loadSettings}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="dev" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dev" className="flex items-center gap-2">
            <Badge variant="secondary">DEV</Badge>
            Development
          </TabsTrigger>
          <TabsTrigger value="prod" className="flex items-center gap-2">
            <Badge variant="destructive">PROD</Badge>
            Production
          </TabsTrigger>
        </TabsList>

        {/* Development Settings */}
        <TabsContent value="dev" className="space-y-6">
          {devSettings && (
            <EnvironmentSettings
              environment="dev"
              settings={devSettings}
              onSave={saveSettings}
              saving={saving}
            />
          )}
        </TabsContent>

        {/* Production Settings */}
        <TabsContent value="prod" className="space-y-6">
          {prodSettings && (
            <EnvironmentSettings
              environment="prod"
              settings={prodSettings}
              onSave={saveSettings}
              saving={saving}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface EnvironmentSettingsProps {
  environment: 'dev' | 'prod'
  settings: AppSettings
  onSave: (environment: 'dev' | 'prod', settings: Partial<AppSettings>) => Promise<void>
  saving: boolean
}

function EnvironmentSettings({ environment, settings, onSave, saving }: EnvironmentSettingsProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = async () => {
    await onSave(environment, localSettings)
  }

  const handleChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings)

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic application configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">App Name</Label>
              <Input
                id="app-name"
                value={localSettings.app_name}
                onChange={(e) => handleChange('app_name', e.target.value)}
                placeholder="Application name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-url">App URL</Label>
              <Input
                id="app-url"
                value={localSettings.app_url}
                onChange={(e) => handleChange('app_url', e.target.value)}
                placeholder="https://your-app.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="survey-table">Survey Table Name</Label>
              <Input
                id="survey-table"
                value={localSettings.survey_table_name}
                onChange={(e) => handleChange('survey_table_name', e.target.value)}
                placeholder="pc_survey_data_dev"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (ms)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={localSettings.session_timeout}
                onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                placeholder="28800000"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance-mode"
              checked={localSettings.maintenance_mode}
              onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
            />
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            Enable or disable application features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics">Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Enable analytics and tracking features
                </p>
              </div>
              <Switch
                id="analytics"
                checked={localSettings.enable_analytics}
                onCheckedChange={(checked) => handleChange('enable_analytics', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Enable email notification features
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={localSettings.enable_email_notifications}
                onCheckedChange={(checked) => handleChange('enable_email_notifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="export">Data Export</Label>
                <p className="text-sm text-muted-foreground">
                  Enable data export functionality
                </p>
              </div>
              <Switch
                id="export"
                checked={localSettings.enable_export}
                onCheckedChange={(checked) => handleChange('enable_export', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            UI Settings
          </CardTitle>
          <CardDescription>
            User interface configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Default Theme</Label>
              <Select
                value={localSettings.theme_default}
                onValueChange={(value) => handleChange('theme_default', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Default Language</Label>
              <Select
                value={localSettings.language_default}
                onValueChange={(value) => handleChange('language_default', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Security and authentication configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
            <Input
              id="max-login-attempts"
              type="number"
              value={localSettings.max_login_attempts}
              onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
              placeholder="3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Environment Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              Environment: <Badge variant="outline">{environment.toUpperCase()}</Badge>
              {hasChanges && <Badge variant="secondary" className="ml-2">Modified</Badge>}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}