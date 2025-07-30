"use client"

import { useState, useEffect } from "react"
import { supabase, requireSupabase, isSupabaseConfigured } from "@/lib/supabase"
import { getCurrentUserPermissions, getUserRole, getRoleDisplayName, type UserRole } from "@/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Database, Shield, Bell, Save, TestTube, Lock, Eye, Users, Plus, Trash2, Loader2, UserPlus, Info } from "lucide-react"

interface AppSettings {
  database: {
    url: string
    apiKey: string
    tableName: string
    connectionTimeout: number
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
      url: "",
      apiKey: "",
      tableName: "",
      connectionTimeout: 30,
    },
    general: {
      appName: "",
      publicUrl: typeof window !== 'undefined' ? window.location.origin : '',
      maintenanceMode: false,
      analyticsEnabled: false,
    },
  })

  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"success" | "error" | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  // User Management State
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' })

  // Permissions and role management
  const [userRole, setUserRole] = useState<UserRole>('viewer')
  const [permissions, setPermissions] = useState(getCurrentUserPermissions())
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)

  useEffect(() => {
    // Load user role and permissions
    const currentRole = getUserRole()
    setUserRole(currentRole)
    setPermissions(getCurrentUserPermissions())

    // Load settings from API
    loadSettings()
    
    // Load users if permitted
    if (permissions.canViewUsers) {
      fetchUsers()
    }
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Use the new centralized configuration manager
      const { getConfig } = await import('@/lib/config-manager')
      const config = await getConfig()
      
      // Check if Supabase is configured
      const { isSupabaseConfigured } = await import('@/lib/supabase')
      const configured = await isSupabaseConfigured()
      setSupabaseConfigured(configured)
      
      // Transform to local settings format
      const apiSettings = {
        database: {
          url: config.database.url,
          apiKey: config.database.apiKey,
          tableName: config.database.tableName,
          connectionTimeout: 30,
        },
        general: {
          appName: config.general.appName,
          publicUrl: config.general.publicUrl,
          maintenanceMode: config.general.maintenanceMode,
          analyticsEnabled: config.general.analyticsEnabled,
        },
      }
      
      setSettings(apiSettings)
      console.log('🔍 Settings - Loaded configuration:', {
        databaseUrl: config.database.url ? 'SET' : 'EMPTY',
        databaseKey: config.database.apiKey ? 'SET' : 'EMPTY',
        tableName: config.database.tableName,
        appName: config.general.appName,
        supabaseConfigured: configured,
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      
      // Fallback to empty settings
      const emptySettings = {
        database: {
          url: "",
          apiKey: "",
          tableName: "",
          connectionTimeout: 30,
        },
        general: {
          appName: "Product Community Survey",
          publicUrl: "",
          maintenanceMode: false,
          analyticsEnabled: false,
        },
      }
      
      setSettings(emptySettings)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      console.log('Fetching users from Supabase...')
      
      // Get dynamic Supabase client
      const { getSupabaseClient } = await import('@/lib/supabase')
      const client = await getSupabaseClient()
      if (!client) {
        console.error('Supabase client not available')
        setUsers([])
        return
      }

      // Test connection first
      const { data: testData, error: testError } = await client
        .from('profiles')
        .select('count')
        .limit(1)

      if (testError) {
        console.error('Database connection failed:', testError)
        setUsers([])
        return
      }

      // Try to fetch from user_management view first
      const { data: viewData, error: viewError } = await client
        .from('user_management')
        .select('*')
        .order('created_at', { ascending: false })

      if (!viewError && viewData) {
        console.log('Users loaded from view:', viewData.length)
        setUsers(viewData || [])
      } else {
        // Fallback to profiles table
        const { data: profileData, error: profileError } = await client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (!profileError && profileData) {
          console.log('Users loaded from profiles:', profileData.length)
          setUsers(profileData || [])
        } else {
          console.error('Error fetching users:', profileError || viewError)
          setUsers([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const createUser = async () => {
    if (!permissions.canManageUsers) {
      alert("⚠️ Demo mode: User creation is not allowed")
      return
    }
    
    if (!newUser.email || !newUser.password) return

    setCreatingUser(true)
    try {
      console.log('Creating user with Supabase Auth:', newUser.email)
      
      // Get dynamic Supabase client
      const { getSupabaseClient } = await import('@/lib/supabase')
      const client = await getSupabaseClient()
      if (!client) {
        alert('❌ Supabase client not initialized')
        return
      }
      
      const { data, error } = await client.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            role: newUser.role,
            full_name: newUser.email.split('@')[0] // Use email prefix as name
          }
        }
      })

      if (error) {
        console.error('Create user error:', error)
        alert(`❌ Failed to create user: ${error.message}`)
      } else {
        console.log('User created successfully:', data)
        setNewUser({ email: '', password: '', role: 'viewer' })
        await fetchUsers()
        alert('✅ User created successfully! They will receive a confirmation email.')
      }
    } catch (error) {
      console.error('Create user exception:', error)
      alert(`❌ Failed to create user: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setCreatingUser(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      // Note: Deleting auth users requires admin API
      alert('ℹ️ User deletion requires admin privileges. Contact administrator.')
    } catch (error) {
      alert('❌ Failed to delete user: Network error')
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    if (!permissions.canManageUsers) {
      alert("⚠️ Demo mode: User role changes are not allowed")
      return
    }
    
    try {
      console.log('Updating user role:', userId, role)
      
      // Get dynamic Supabase client
      const { getSupabaseClient } = await import('@/lib/supabase')
      const client = await getSupabaseClient()
      if (!client) {
        alert('❌ Supabase client not initialized')
        return
      }
      
      // Try using the RPC function first
      const { error: rpcError } = await client.rpc('update_user_role', {
        user_id: userId,
        new_role: role
      })

      if (!rpcError) {
        await fetchUsers()
        alert('✅ User role updated successfully!')
        return
      }

      // Fallback to direct profiles update
      const { error: updateError } = await client
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        alert(`❌ Failed to update role: ${updateError.message}`)
      } else {
        await fetchUsers()
        alert('✅ User role updated successfully!')
      }
    } catch (error) {
      alert('❌ Failed to update role: Network error')
    }
  }

  const saveSettings = async () => {
    if (!permissions.canEditSettings) {
      alert("⚠️ Demo mode: Settings cannot be saved")
      return
    }
    
    setIsSaving(true)

    try {
      // Transform local settings to API format
      const apiSettings = {
        survey_table_name: settings.database.tableName,
        app_name: settings.general.appName,
        app_url: settings.general.publicUrl,
        maintenance_mode: settings.general.maintenanceMode,
        enable_analytics: settings.general.analyticsEnabled,
        enable_email_notifications: false, // Default to false
        enable_export: true, // Default to true
        session_timeout: 3600 * 1000, // Default to 1 hour
        max_login_attempts: 10, // Default to 10
        theme_default: 'system',
        language_default: 'en',
        settings: {
          supabase_url: settings.database.url,
          supabase_anon_key: settings.database.apiKey,
          connection_timeout: settings.database.connectionTimeout,
          require_https: true, // Default to true
          enable_rate_limit: true, // Default to true
          enforce_strong_passwords: false, // Default to false
          enable_two_factor: false, // Default to false
          admin_email: "", // Default to empty
          response_threshold: 10 // Default to 10
        }
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiSettings)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Settings saved successfully:', result)
        
        // Refresh the configuration manager
        const { refreshConfig } = await import('@/lib/config-manager')
        await refreshConfig()
        
        // Dispatch custom events to notify other components
        window.dispatchEvent(new CustomEvent('app_settings_changed', { 
          detail: settings 
        }))
        window.dispatchEvent(new CustomEvent('settingsUpdated', { 
          detail: settings 
        }))
        
        alert("Settings saved successfully!")
      } else {
        const error = await response.json()
        console.error('Failed to save settings:', error)
        alert(`Failed to save settings: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
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

  // Debug function to show environment variables
  const showDebugInfo = () => {
    const env = (window as any).__ENV__ || {}
    console.log('🔍 Debug - Environment Variables:', env)
    console.log('🔍 Debug - Current Settings:', settings)
    alert(`Environment Variables:\n${JSON.stringify(env, null, 2)}\n\nCurrent Settings:\n${JSON.stringify(settings, null, 2)}`)
  }

  // Sanitize sensitive data for demo users
  const getSafeSettings = (settings: AppSettings): AppSettings => {
    if (permissions.canViewSensitiveData) {
      return settings
    }
    
    // Return safe/demo version for admin-demo role
    return {
      ...settings,
      database: {
        ...settings.database,
        url: "https://your-project.supabase.co",
        apiKey: "your_supabase_anon_key_here_••••••••••••••••",
      }
    }
  }

  const updateSettings = (section: keyof AppSettings, key: string, value: any) => {
    if (!permissions.canEditSettings) {
      alert("⚠️ Demo mode: Settings changes are not allowed")
      return
    }
    
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const safeSettings = getSafeSettings(settings)

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {userRole === 'admin-demo' && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> You're viewing the admin interface in read-only mode. 
            Data may be masked for security. Real functionality is available with full access credentials.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{getRoleDisplayName(userRole)}</Badge>
            {!permissions.canEditSettings && (
              <Badge variant="secondary" className="text-xs">Read-Only</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={showDebugInfo} 
            variant="outline"
          >
            <Info className="w-4 h-4 mr-2" />
            Debug
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={isSaving || !permissions.canEditSettings}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Database Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Database className="w-5 h-5" />
            Database Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Supabase URL</label>
                             <Input
                 value={safeSettings.database.url}
                 onChange={(e) => updateSettings("database", "url", e.target.value)}
                 placeholder="https://your-project.supabase.co"
                 className="bg-background text-foreground border-border"
                 disabled={!permissions.canEditSettings}
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Table Name</label>
              <Input
                value={safeSettings.database.tableName}
                onChange={(e) => updateSettings("database", "tableName", e.target.value)}
                placeholder="Enter table name (e.g., survey_data)"
                className="bg-background text-foreground border-border"
                disabled={!permissions.canEditSettings}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
            <div className="flex gap-2">
                             <Input
                 type={showApiKey ? "text" : "password"}
                 value={safeSettings.database.apiKey}
                 onChange={(e) => updateSettings("database", "apiKey", e.target.value)}
                 placeholder="Your Supabase anon key"
                 className="flex-1 bg-background text-foreground border-border"
                 disabled={!permissions.canEditSettings}
               />
              <Button variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button onClick={testDatabaseConnection} disabled={testingConnection} variant="outline">
              <TestTube className="w-4 h-4 mr-2" />
              {testingConnection ? "Testing..." : "Test Connection"}
            </Button>
            {connectionStatus && (
              <Badge variant={connectionStatus === "success" ? "default" : "destructive"}>
                {connectionStatus === "success" ? "Connected" : "Failed"}
              </Badge>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Connection Timeout (seconds)
            </label>
            <Input
              type="number"
              value={settings.database.connectionTimeout}
              onChange={(e) =>
                updateSettings("database", "connectionTimeout", Number.parseInt(e.target.value))
              }
              className="w-32 bg-background text-foreground border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Application Name</label>
              <Input
                value={settings.general.appName}
                onChange={(e) => updateSettings("general", "appName", e.target.value)}
                placeholder="Product Survey Builder"
                className="bg-background text-foreground border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Public URL</label>
              <Input
                value={settings.general.publicUrl}
                onChange={(e) => updateSettings("general", "publicUrl", e.target.value)}
                placeholder="https://your-domain.com"
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Maintenance Mode</label>
                <p className="text-xs text-muted-foreground">Temporarily disable survey collection</p>
              </div>
              <Switch
                checked={settings.general.maintenanceMode}
                onCheckedChange={(checked) => updateSettings("general", "maintenanceMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Analytics Enabled</label>
                <p className="text-xs text-muted-foreground">Track usage and performance metrics</p>
              </div>
              <Switch
                checked={settings.general.analyticsEnabled}
                onCheckedChange={(checked) => updateSettings("general", "analyticsEnabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management - Enhanced with Supabase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage application users and their permissions. Now with Supabase Auth integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              <strong>Authentication Methods:</strong>
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 ml-4">
              <li>• <strong>Demo Users:</strong> viewer/viewer123, admin-demo/demo123 (public)</li>
              {userRole === 'admin' && (
                <li>• <strong>Private Users:</strong> collaborator/collab456, admin/admin789</li>
              )}
              <li>• <strong>Google OAuth:</strong> {supabaseConfigured ? 'Available on login page' : 'Requires Supabase config'}</li>
              <li>• <strong>Email/Password:</strong> {supabaseConfigured ? 'Created via form below' : 'Requires Supabase config'}</li>
            </ul>
          </div>
          
          <div className="space-y-4">
                         {/* Create New User */}
             {permissions.canManageUsers ? (
               <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                 <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">➕ Create New User (Supabase Auth)</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="dark:bg-gray-900 dark:text-gray-50"
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="dark:bg-gray-900 dark:text-gray-50"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-gray-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="collaborator">Collaborator</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  onClick={createUser}
                  disabled={creatingUser || !newUser.email || !newUser.password}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">➕ Create New User</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  👀 Demo mode: User creation interface is available in full admin access
                </p>
              </div>
            )}

            {/* Current Users */}
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">👥 Current Users ({users.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="text-xs"
                >
                  {loadingUsers ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
              
              {/* Demo Users Info */}
                             <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                 <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">🔒 Demo Credentials (Hardcoded)</h4>
                 <div className="space-y-2 text-xs">
                   <div className="flex justify-between items-center">
                     <span className="text-amber-700 dark:text-amber-300">Viewer: viewer / viewer123</span>
                     <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">ANALYTICS ONLY</Badge>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-amber-700 dark:text-amber-300">Admin Demo: admin-demo / demo123</span>
                     <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">READ-ONLY ADMIN</Badge>
                   </div>
                   {userRole === 'admin' && (
                     <>
                       <div className="flex justify-between items-center">
                         <span className="text-amber-700 dark:text-amber-300">Collaborator: collaborator / collab456</span>
                         <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">SURVEY EDITOR</Badge>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-amber-700 dark:text-amber-300">Admin: admin / admin789</span>
                         <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">FULL ACCESS</Badge>
                       </div>
                     </>
                   )}
                   <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                     ℹ️ These are hardcoded demo accounts. {userRole === 'admin-demo' ? 'Some credentials are hidden in demo mode.' : 'Real users are managed below.'}
                   </p>
                 </div>
               </div>

                             {/* Real Users from Supabase */}
               <div className="space-y-2">
                 <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   {userRole === 'admin-demo' ? 'Sample Users (Demo Data):' : 'Supabase Auth Users:'}
                 </h5>
                 
                 {loadingUsers ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                  </div>
                                 ) : userRole === 'admin-demo' ? (
                   // Show demo-safe user data for admin-demo role
                   [
                     { id: 'demo-1', email: 'john.doe@example.com', full_name: 'John Doe', role: 'viewer', created_at: '2024-01-15', email_confirmed: true },
                     { id: 'demo-2', email: 'jane.smith@company.com', full_name: 'Jane Smith', role: 'collaborator', created_at: '2024-01-10', email_confirmed: true },
                     { id: 'demo-3', email: 'admin@company.com', full_name: 'System Admin', role: 'admin', created_at: '2024-01-01', email_confirmed: true }
                   ].map((user) => (
                     <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                             🔑 {user.email}
                           </span>
                           {user.email_confirmed && (
                             <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                               ✓ Verified
                             </Badge>
                           )}
                         </div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                           {user.full_name} • Created: {new Date(user.created_at).toLocaleDateString()}
                         </p>
                       </div>
                       <div className="flex items-center gap-2 flex-shrink-0">
                         <Badge variant="outline" className="text-xs">
                           {user.role?.toUpperCase() || 'VIEWER'}
                         </Badge>
                         <span className="text-xs text-gray-400">Read-only</span>
                       </div>
                     </div>
                   ))
                 ) : users.length === 0 ? (
                   <div className="text-center py-6 text-gray-500">
                     <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                     <p className="text-sm font-medium mb-2">No real users found</p>
                     <p className="text-xs">Create users above or users can sign up via Google on login page</p>
                   </div>
                 ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            🔑 {user.email}
                          </span>
                          {user.email_confirmed && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.full_name && `${user.full_name} • `}
                          Created: {new Date(user.created_at).toLocaleDateString()}
                          {user.last_sign_in_at && ` • Last login: ${new Date(user.last_sign_in_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {user.role?.toUpperCase() || 'VIEWER'}
                        </Badge>
                        <select
                          value={user.role || 'viewer'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="collaborator">Collaborator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
