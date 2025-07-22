"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, TrendingUp, Database, Activity, Clock, CheckCircle } from "lucide-react"

interface DashboardStats {
  totalResponses: number
  todayResponses: number
  completionRate: number
  avgTimeToComplete: number
  topRole: string
  topIndustry: string
  recentResponses: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch survey responses from Supabase
      const response = await fetch(
        "https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data?select=*&order=created_at.desc",
        {
          headers: {
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()

        // Calculate stats
        const today = new Date().toDateString()
        const todayResponses = data.filter((r: any) => new Date(r.created_at).toDateString() === today).length

        const roles = data.map((r: any) => r.role).filter(Boolean)
        const topRole = getMostFrequent(roles) || "N/A"

        const industries = data.map((r: any) => r.industry || r.company_type).filter(Boolean)
        const topIndustry = getMostFrequent(industries) || "N/A"

        setStats({
          totalResponses: data.length,
          todayResponses,
          completionRate: 85, // Mock completion rate
          avgTimeToComplete: 4.2, // Mock average time
          topRole,
          topIndustry,
          recentResponses: data.slice(0, 5),
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMostFrequent = (arr: string[]) => {
    const frequency: { [key: string]: number } = {}
    arr.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1
    })
    return Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b), "")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stats?.totalResponses || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stats?.todayResponses || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stats?.completionRate || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stats?.avgTimeToComplete || 0}m</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Most Common Role</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats?.topRole}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Top Industry</span>
              <span className="text-sm font-bold text-green-700 dark:text-green-300">{stats?.topIndustry}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Database Status</span>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentResponses.map((response, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{response.role}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(response.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{response.company_type || "N/A"}</div>
                </div>
              )) || <div className="text-center py-4 text-gray-500">No responses yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <FileText className="w-6 h-6" />
              Configure Survey
            </Button>
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <Database className="w-6 h-6" />
              Manage Database
            </Button>
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <TrendingUp className="w-6 h-6" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
