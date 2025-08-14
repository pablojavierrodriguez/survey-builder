"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, Download, Trash2, Eye, Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getSupabaseConfig, ensureTableExists } from "@/lib/database-config"

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
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    testConnection()
    fetchResponses()
  }, [])

  useEffect(() => {
    filterResponses()
  }, [responses, searchTerm, selectedRole])

  const testConnection = async () => {
    try {
      setConnectionStatus("testing")
      const dbConfig = await getSupabaseConfig()
      setConfig(dbConfig)

      if (!dbConfig?.supabaseUrl || !dbConfig?.anonKey) {
        setConnectionStatus("disconnected")
        return
      }

      const tableExists = await ensureTableExists(dbConfig.tableName)
      if (tableExists) setConnectionStatus("connected")
      else setConnectionStatus("disconnected")
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
        setResponses(result?.data?.records || [])
        if (result?.success) setConnectionStatus("connected")
        else setConnectionStatus("disconnected")
      } else {
        console.error('Database connection failed:', response.status, response.statusText)
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
    let filtered = [...responses]

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r?.main_challenge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r?.company_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedRole) {
      filtered = filtered.filter((r) => r?.role === selectedRole)
    }

    setFilteredResponses(filtered)
  }

  const exportData = () => {
    if (!filteredResponses?.length) return

    const csvContent = [
      ["ID","Role","Other Role","Company Type","Main Challenge","Daily Tools","Learning Methods","Email","Created At"].join(","),
      ...filteredResponses.map((r) => [
        r.id || "",
        `"${r.role || ""}"`,
        `"${r.other_role || ""}"`,
        `"${r.company_type || ""}"`,
        `"${(r.main_challenge || "").replace(/"/g,'""')}"`,
        `"${(r.daily_tools || []).join("; ")}"`,
        `"${(r.learning_methods || []).join("; ")}"`,
        `"${r.email || ""}"`,
        r.created_at || ""
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
    if (!id || !confirm("Are you sure you want to delete this response?")) return

    if (connectionStatus !== "connected") {
      alert("❌ Cannot delete response: Not connected to database")
      return
    }

    try {
      const config = await getSupabaseConfig()
      if (!config?.supabaseUrl || !config?.anonKey) {
        alert("❌ Cannot delete response: No valid database configuration")
        return
      }

      const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchResponses()
        alert("✅ Response deleted successfully")
      } else {
        alert(`❌ Failed to delete response: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error deleting response:", error)
      alert("❌ Error deleting response: Network error")
    }
  }

  const handleAutoSetup = async () => {
    setSetupLoading(true)
    try {
      const config = await getSupabaseConfig()
      const manualInstructions = `📋 MANUAL SETUP REQUIRED:

Current Configuration:
- Environment: ${config?.environment || 'UNKNOWN'}
- Table Name: ${config?.tableName || 'unknown'}
- Supabase URL: ${config?.supabaseUrl || 'N/A'}

Steps:
1. Go to your Supabase Dashboard
2. Open the SQL Editor
3. Copy and run the database schema script

🔗 Direct link: ${config?.supabaseUrl || '#'}/project/default/sql`

      alert(manualInstructions)
    } catch (error) {
      console.error('Setup error:', error)
      alert('Error during setup. Please try again.')
    } finally {
      setSetupLoading(false)
    }
  }

  const uniqueRoles = Array.from(new Set((responses || []).map((r) => r?.role || ""))).filter(Boolean).sort()

  return (
    <div className="space-y-6">
      {/* ... Aquí va tu JSX completo sin cambios, usando filteredResponses || [] y responses || [] donde corresponda */}
    </div>
  )
}
