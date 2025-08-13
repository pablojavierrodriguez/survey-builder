"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { getPermissions, getUserRoleFromProfile } from "@/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, PieChart, TrendingUp, Users, RefreshCw, Download, Trophy, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

interface AnalyticsData {
  roleDistribution: { [key: string]: number }
  seniorityDistribution: { [key: string]: number }
  industryDistribution: { [key: string]: number }
  companyDistribution: { [key: string]: number }
  toolsUsage: { [key: string]: number }
  learningMethods: { [key: string]: number }
  totalResponses: number
}

// Memoized stop words set
const stopWords = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "as",
  "from",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "s",
  "t",
  "can",
  "will",
  "just",
  "don",
  "should",
  "now",
  "this",
  "that",
  "what",
  "with",
  "from",
  "your",
  "they",
  "have",
  "been",
])

// Memoized utility functions
const getNGrams = (text: string, n: number) => {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !stopWords.has(word))
  const ngrams = []
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "))
  }
  return ngrams
}

const getSalaryRange = (salary: number, currency: string): string => {
  if (salary < 30000) return `$${currency} < 30k`
  if (salary < 50000) return `$${currency} 30k-50k`
  if (salary < 80000) return `$${currency} 50k-80k`
  if (salary < 120000) return `$${currency} 80k-120k`
  return `$${currency} > 120k`
}

// Memoized chart component
const RankingChart = memo(
  ({
    data,
    title,
    icon,
    maxItems = 10,
  }: {
    data: { [key: string]: number }
    title: string
    icon: React.ReactNode
    maxItems?: number
  }) => {
    const sortedData = useMemo(() => {
      return Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, maxItems)
    }, [data, maxItems])

    const total = useMemo(() => {
      return Object.values(data).reduce((sum, count) => sum + count, 0)
    }, [data])

    if (sortedData.length === 0) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedData.map(([key, count]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm truncate flex-1 min-w-0">{key}</span>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <div className="w-12 sm:w-16 bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium min-w-[2rem] sm:min-w-[3rem] text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  },
)

RankingChart.displayName = "RankingChart"

// Memoized stats card component
const StatsCard = memo(
  ({
    title,
    value,
    icon,
    description,
  }: {
    title: string
    value: string | number
    icon: React.ReactNode
    description?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  ),
)

StatsCard.displayName = "StatsCard"

export default function AnalyticsPage() {
  const { user, profile } = useAuth() // Added profile to destructuring
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const permissions = useMemo(() => {
    const userRole = getUserRoleFromProfile(profile, user?.email)
    return getPermissions(userRole === "admin" ? "admin" : "viewer")
  }, [profile, user?.email])

  // Memoized fetch function
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/analytics")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setLastUpdated(new Date())
      } else {
        setError(result.error || "Failed to fetch analytics data")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching analytics:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized export functions
  const exportAnalyticsJson = useCallback(() => {
    if (!data) return

    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data])

  const exportAnalyticsCsv = useCallback(() => {
    if (!data) return

    const addDistributionToRows = (dist: { [key: string]: number }, category: string, total: number) => {
      const rows: Array<{
        category: string
        value: string
        count: number
        percentage: string
      }> = []
      Object.entries(dist).forEach(([key, count]) => {
        rows.push({
          category,
          value: key,
          count,
          percentage: ((count / total) * 100).toFixed(2),
        })
      })
      return rows
    }

    const csvRows = []
    csvRows.push(["Category", "Value", "Count", "Percentage"])

    // Add all distributions
    const total = data.totalResponses
    if (total > 0) {
      csvRows.push(
        ...addDistributionToRows(data.roleDistribution, "Role", total).map((row) => [
          row.category,
          row.value,
          row.count,
          row.percentage,
        ]),
      )
      csvRows.push(
        ...addDistributionToRows(data.seniorityDistribution, "Seniority", total).map((row) => [
          row.category,
          row.value,
          row.count,
          row.percentage,
        ]),
      )
      csvRows.push(
        ...addDistributionToRows(data.companyDistribution, "Company Type", total).map((row) => [
          row.category,
          row.value,
          row.count,
          row.percentage,
        ]),
      )
      csvRows.push(
        ...addDistributionToRows(data.industryDistribution, "Industry", total).map((row) => [
          row.category,
          row.value,
          row.count,
          row.percentage,
        ]),
      )
      csvRows.push(
        ...addDistributionToRows(data.toolsUsage, "Tools", total).map((row) => [
          row.category,
          row.value,
          row.count,
          row.percentage,
        ]),
      )
      csvRows.push(
        ...addDistributionToRows(data.learningMethods, "Learning Methods", total).map((row) => [
          row.category,
          row.value,
          row.count,
          row.percentage,
        ]),
      )
    }

    const csvContent = csvRows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data])

  // Load data on mount
  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Memoized loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Survey response analytics and insights
            {lastUpdated && <span className="ml-2 text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="text-xs sm:text-sm bg-transparent"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-transparent">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportAnalyticsJson}>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={exportAnalyticsCsv}>Export as CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Responses"
          value={data.totalResponses}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Roles"
          value={Object.keys(data.roleDistribution).length}
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Industries"
          value={Object.keys(data.industryDistribution).length}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Tools Used"
          value={Object.keys(data.toolsUsage).length}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <RankingChart
          data={data.roleDistribution}
          title="Role Distribution"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <RankingChart
          data={data.seniorityDistribution}
          title="Seniority Distribution"
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
        />
        <RankingChart
          data={data.companyDistribution}
          title="Company Type"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <RankingChart
          data={data.industryDistribution}
          title="Industry Distribution"
          icon={<PieChart className="h-4 w-4 text-muted-foreground" />}
        />
        <RankingChart
          data={data.toolsUsage}
          title="Most Used Tools"
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          maxItems={8}
        />
        <RankingChart
          data={data.learningMethods}
          title="Learning Methods"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          maxItems={8}
        />
      </div>
    </div>
  )
}
