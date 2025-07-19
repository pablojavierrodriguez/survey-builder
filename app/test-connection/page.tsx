"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Database, Wifi, Shield } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
  details?: string
}

export default function TestConnection() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const updateResult = (name: string, status: TestResult["status"], message: string, details?: string) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      }
      return [...prev, { name, status, message, details }]
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Basic Connection
    updateResult("connection", "pending", "Testing connection...")
    try {
      const response = await fetch("https://qaauhwulohxeeacexrav.supabase.co/rest/v1/", {
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
        },
      })

      if (response.ok) {
        updateResult("connection", "success", "Connection successful", `Status: ${response.status}`)
      } else {
        updateResult("connection", "error", "Connection failed", `Status: ${response.status}`)
      }
    } catch (error) {
      updateResult("connection", "error", "Network error", error instanceof Error ? error.message : "Unknown error")
    }

    // Test 2: Table Exists
    updateResult("table", "pending", "Checking table existence...")
    try {
      const response = await fetch("https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data?limit=1", {
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
        },
      })

      if (response.ok) {
        const data = await response.json()
        updateResult(
          "table",
          "success",
          "Table exists and accessible",
          `Found table with ${Array.isArray(data) ? data.length : 0} records`,
        )
      } else {
        const errorText = await response.text()
        updateResult("table", "error", "Table access failed", `Status: ${response.status}, Error: ${errorText}`)
      }
    } catch (error) {
      updateResult("table", "error", "Table check failed", error instanceof Error ? error.message : "Unknown error")
    }

    // Test 3: Insert Permission
    updateResult("insert", "pending", "Testing insert permissions...")
    try {
      const testData = {
        role: "Test Role",
        seniority: "Test Seniority",
        company_size: "Test Company",
        industry: "Test Industry",
        product_type: "Test Product",
        customer_segment: "Test Segment",
        main_challenge: "This is a test insert to verify permissions",
        daily_tools: ["Test Tool"],
        learning_methods: ["Test Method"],
        content_preferences: ["Test Preference"],
        email: "test@example.com",
        created_at: new Date().toISOString(),
      }

      const response = await fetch("https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(testData),
      })

      if (response.ok) {
        updateResult("insert", "success", "Insert permissions working", `Status: ${response.status}`)
      } else {
        const errorText = await response.text()
        updateResult("insert", "error", "Insert failed", `Status: ${response.status}, Error: ${errorText}`)
      }
    } catch (error) {
      updateResult("insert", "error", "Insert test failed", error instanceof Error ? error.message : "Unknown error")
    }

    // Test 4: Schema Validation
    updateResult("schema", "pending", "Validating table schema...")
    try {
      const response = await fetch("https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data?limit=0", {
        method: "HEAD",
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
        },
      })

      const contentRange = response.headers.get("content-range")
      if (response.ok) {
        updateResult("schema", "success", "Schema accessible", `Content-Range: ${contentRange || "Available"}`)
      } else {
        updateResult("schema", "error", "Schema validation failed", `Status: ${response.status}`)
      }
    } catch (error) {
      updateResult("schema", "error", "Schema check failed", error instanceof Error ? error.message : "Unknown error")
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getTestIcon = (name: string) => {
    switch (name) {
      case "connection":
        return <Wifi className="w-5 h-5" />
      case "table":
        return <Database className="w-5 h-5" />
      case "insert":
        return <Shield className="w-5 h-5" />
      case "schema":
        return <Database className="w-5 h-5" />
      default:
        return <Database className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Database Connection Test</h1>
          <p className="text-lg text-gray-600">Verify your Supabase setup is working correctly</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Connection Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Supabase URL:</strong>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://qaauhwulohxeeacexrav.supabase.co</code>
              </div>
              <div>
                <strong>Table:</strong>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">pc_survey_data</code>
              </div>
              <div>
                <strong>API Key:</strong>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
              </div>
              <div>
                <strong>Role:</strong>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">anon</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.length === 0 && !isRunning && (
                <p className="text-gray-500 text-center py-8">Click "Run Tests" to start the connection test</p>
              )}

              {results.map((result) => (
                <div key={result.name} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getTestIcon(result.name)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium capitalize">{result.name} Test</h3>
                        {getStatusIcon(result.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded">{result.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={runTests}
                disabled={isRunning}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-2xl"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Tests"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {results.some((r) => r.status === "error") ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      {results
                        .filter((r) => r.status === "error")
                        .map((r) => (
                          <li key={r.name}>
                            <strong>{r.name}:</strong> {r.message}
                          </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-red-700">Please run the database schema scripts to fix these issues.</p>
                  </div>
                ) : results.every((r) => r.status === "success") ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">✅ All Tests Passed!</h4>
                    <p className="text-green-700">
                      Your database is properly configured. The survey should work correctly now.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Some Tests Still Running</h4>
                    <p className="text-yellow-700">Please wait for all tests to complete.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
