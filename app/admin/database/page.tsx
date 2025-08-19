"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, Download, Trash2, Eye, Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getSupabaseConfig, ensureDevTableExists, ensureTableExists } from "@/lib/database-config"

interface SurveyResponse {
  id: string
  role: string
  other_role?: string
  seniority: string
  company_type: string
  company_size: string
  industry: string
  product_type: string
  customer_segment: string
  main_challenge: string
  daily_tools: string[]
  other_tool?: string
  learning_methods: string[]
  salary_currency: string
  salary_min?: string
  salary_max?: string
  salary_average?: string
  email?: string
  created_at: string
}

export default function DatabasePage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<SurveyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("testing")
  const [setupLoading, setSetupLoading] = useState(false)
  const [devTableExists, setDevTableExists] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [hasConfig, setHasConfig] = useState(false)

  useEffect(() => {
    testConnection()
    fetchResponses()
  }, [])

  useEffect(() => {
    filterResponses()
  }, [responses, searchTerm, selectedRole])

  useEffect(() => {
    const handleSettingsChange = () => {
      console.log('Settings changed, refreshing database info...')
      testConnection()
      fetchResponses()
    }

    window.addEventListener('app_settings_changed', handleSettingsChange)
    window.addEventListener('settingsUpdated', handleSettingsChange)
    
    window.addEventListener('storage', (e) => {
      if (e.key === 'survey_settings' || e.key === 'app_settings') {
        handleSettingsChange()
      }
    })

    return () => {
      window.removeEventListener('app_settings_changed', handleSettingsChange)
      window.removeEventListener('settingsUpdated', handleSettingsChange)
    }
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus("testing")
      // Fetch settings from admin API; if unauthorized or not configured, hide config card
      try {
        const resp = await fetch('/api/admin/settings')
        if (resp.ok) {
          const json = await resp.json()
          if (json?.success && json?.data?.database) {
            setConfig({
              supabaseUrl: json.data.database.url || '',
              anonKey: json.data.database.apiKey || '',
              tableName: json.data.database.tableName || 'survey_responses',
              environment: json.data.database.environment || 'production'
            })
            setHasConfig(true)
          } else {
            setHasConfig(false)
          }
        } else {
          setHasConfig(false)
        }
      } catch {
        setHasConfig(false)
      }
      
      const dbConfig = hasConfig ? config : await getSupabaseConfig()
      if (!hasConfig) {
        setConfig(dbConfig)
      }
      
      if (!dbConfig.supabaseUrl || !dbConfig.anonKey) {
        setConnectionStatus("disconnected")
        return
      }

      const response = await fetch('/api/admin/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: dbConfig.tableName })
      })

      if (response.ok) {
        setConnectionStatus("connected")
        const tableExists = await ensureTableExists(dbConfig.tableName)
        setDevTableExists(tableExists)
      } else {
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus("disconnected")
    }
  }

  const fetchResponses = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/database')
      if (response.ok) {
        const result = await response.json()
        if (result?.success && result?.data?.records) {
          setResponses(result.data.records)
          setConnectionStatus("connected")
        } else {
          setResponses([])
          setConnectionStatus("disconnected")
        }
      } else {
        setResponses([])
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("Error fetching responses:", error)
      setResponses([])
      setConnectionStatus("disconnected")
    } finally {
      setIsLoading(false)
    }
  }

  const filterResponses = () => {
    let filtered = responses || []

    if (searchTerm) {
      filtered = filtered.filter(
        (response) =>
          response.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.main_challenge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.company_type?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedRole) {
      filtered = filtered.filter((response) => response.role === selectedRole)
    }

    setFilteredResponses(filtered)
  }

  const exportData = () => {
    const csvContent = [
      [
        "ID","Role","Other Role","Company Type","Main Challenge","Daily Tools","Learning Methods","Email","Created At"
      ].join(","),
      ...filteredResponses.map((response) => [
        response.id,
        `"${response.role || ""}"`,
        `"${response.other_role || ""}"`,
        `"${response.company_type || ""}"`,
        `"${(response.main_challenge || "").replace(/"/g, '""')}"`,
        `"${(response.daily_tools || []).join("; ")}"`,
        `"${(response.learning_methods || []).join("; ")}"`,
        `"${response.email || ""}"`,
        response.created_at
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `survey-responses-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const deleteResponse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return
    if (connectionStatus !== "connected") { alert("❌ Cannot delete response: Not connected"); return }

    try {
      const config = await getSupabaseConfig()
      if (!config.supabaseUrl || !config.anonKey) { alert("❌ No valid DB config"); return }

      const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) { fetchResponses(); alert("✅ Response deleted") }
      else { alert(`❌ Failed to delete: ${response.status} ${response.statusText}`) }
    } catch (error) { console.error(error); alert("❌ Network error") }
  }

  const handleAutoSetup = async () => {
    setSetupLoading(true)
    try {
      const config = await getSupabaseConfig()
      const manualInstructions = `📋 MANUAL SETUP REQUIRED:

Current Configuration:
- Environment: ${config.environment}
- Table Name: ${config.tableName}
- Supabase URL: ${config.supabaseUrl}

Steps:
1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Copy & run schema script
4. Script creates tables and sample data

🔗 Link: ${config.supabaseUrl}/project/default/sql

Note: Auto-setup is not available.`
      alert(manualInstructions)
    } catch (error) { console.error(error); alert('Error during setup.') }
    finally { setSetupLoading(false) }
  }

  const uniqueRoles = [...new Set((responses || []).map((r) => r.role))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Database Management</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> :
             connectionStatus === "disconnected" ? <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> :
             <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 animate-spin" />}
            <span className="text-xs sm:text-sm text-muted-foreground capitalize">{connectionStatus}</span>
          </div>
          <Button onClick={() => { testConnection(); fetchResponses() }} variant="outline" size="sm" className="text-xs sm:text-sm">
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Config Info (only if configured) */}
      {hasConfig && config?.supabaseUrl && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Configuration</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {config?.environment?.toUpperCase()} - Table: {config?.tableName}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  URL: {config?.supabaseUrl?.substring(0, 30)}...
                </p>
              </div>
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Setup */}
      {connectionStatus === "disconnected" && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">🚀 Auto-Setup Available</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              Table `{config?.tableName || 'unknown'}` doesn't exist. Create it automatically or manually using SQL.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAutoSetup} disabled={setupLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {setupLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> :
                 <><Database className="w-4 h-4 mr-2" />Auto-Setup</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/setup_dev_database.sql', '_blank')} className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-amber-900/30">
                📄 Manual SQL Script
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold text-foreground">{responses.length}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-3xl font-bold text-foreground">{filteredResponses.length}</p>
              </div>
              <Filter className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Roles</p>
                <p className="text-3xl font-bold text-foreground">{uniqueRoles.length}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <Input placeholder="Search responses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 sm:pl-10 text-sm" />
            </div>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 border bg-input text-input-foreground border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background text-sm">
              <option value="">All Roles</option>
              {uniqueRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <Button onClick={exportData} disabled={filteredResponses.length === 0} size="sm" className="text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Survey Responses ({filteredResponses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted-foreground/50 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No responses found.</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredResponses.map((response) => (
                <div key={response.id} className="border border-border rounded-lg p-3 sm:p-4 bg-card text-card-foreground">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                        {response.role && <Badge variant="outline" className="text-xs">{response.role}</Badge>}
                        {response.company_type && <Badge variant="secondary" className="text-xs">{response.company_type}</Badge>}
                        {response.created_at && <span className="text-xs text-muted-foreground">{new Date(response.created_at).toLocaleString()}</span>}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground mb-2 break-words">
                        <strong>Challenge:</strong> {response.main_challenge || "-"}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-muted-foreground">Tools:</span>
                        {(response.daily_tools || []).map((tool, i) => <Badge key={i} variant="outline" className="text-xs">{tool}</Badge>)}
                      </div>
                      {response.email && <p className="text-xs text-muted-foreground break-all"><strong>Email:</strong> {response.email}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteResponse(response.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
