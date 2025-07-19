"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Loader2, Database, Play, Copy } from "lucide-react"

interface QueryResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export default function DatabaseManager() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<QueryResult[]>([])
  const [customQuery, setCustomQuery] = useState("")

  const executeQuery = async (query: string, description: string) => {
    setIsExecuting(true)
    try {
      const response = await fetch("https://qaauhwulohxeeacexrav.supabase.co/rest/v1/rpc/execute_sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
        },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults((prev) => [...prev, { success: true, message: description, data }])
      } else {
        const errorText = await response.text()
        setResults((prev) => [...prev, { success: false, message: description, error: errorText }])
      }
    } catch (error) {
      setResults((prev) => [
        ...prev,
        { success: false, message: description, error: error instanceof Error ? error.message : "Unknown error" },
      ])
    }
    setIsExecuting(false)
  }

  const addMissingColumns = async () => {
    setResults([])

    const queries = [
      {
        query:
          "ALTER TABLE pc_survey_data ADD COLUMN IF NOT EXISTS other_role TEXT, ADD COLUMN IF NOT EXISTS seniority TEXT, ADD COLUMN IF NOT EXISTS company_size TEXT, ADD COLUMN IF NOT EXISTS industry TEXT, ADD COLUMN IF NOT EXISTS product_type TEXT, ADD COLUMN IF NOT EXISTS customer_segment TEXT;",
        description: "Adding missing demographic columns",
      },
      {
        query:
          "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pc_survey_data' ORDER BY ordinal_position;",
        description: "Verifying table structure",
      },
    ]

    for (const { query, description } of queries) {
      await executeQuery(query, description)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  const checkTableStructure = async () => {
    setResults([])
    await executeQuery(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'pc_survey_data' ORDER BY ordinal_position;",
      "Checking current table structure",
    )
  }

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return
    setResults([])
    await executeQuery(customQuery, "Custom query execution")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sqlCommands = {
    addColumns:
      "ALTER TABLE pc_survey_data ADD COLUMN IF NOT EXISTS other_role TEXT, ADD COLUMN IF NOT EXISTS seniority TEXT, ADD COLUMN IF NOT EXISTS company_size TEXT, ADD COLUMN IF NOT EXISTS industry TEXT, ADD COLUMN IF NOT EXISTS product_type TEXT, ADD COLUMN IF NOT EXISTS customer_segment TEXT;",
    checkStructure:
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pc_survey_data' ORDER BY ordinal_position;",
    testInsert:
      "INSERT INTO pc_survey_data (role, company_type, main_challenge, daily_tools, learning_methods, content_preferences) VALUES ('Test Role', 'Test Company', 'Test challenge', ARRAY['Test Tool'], ARRAY['Test Method'], ARRAY['Test Preference']);",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Database Manager</h1>
          <p className="text-lg text-gray-600">Manage your Supabase database directly from the browser</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-6 h-6" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={addMissingColumns}
                disabled={isExecuting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Columns...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Add Missing Columns
                  </>
                )}
              </Button>

              <Button
                onClick={checkTableStructure}
                disabled={isExecuting}
                variant="outline"
                className="w-full bg-transparent"
              >
                <Database className="w-4 h-4 mr-2" />
                Check Table Structure
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual SQL Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Missing Columns:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-xs overflow-hidden">
                    {sqlCommands.addColumns}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(sqlCommands.addColumns)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Check Structure:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-xs overflow-hidden">
                    {sqlCommands.checkStructure}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(sqlCommands.checkStructure)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Custom SQL Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="min-h-32 font-mono text-sm"
              />
              <Button
                onClick={executeCustomQuery}
                disabled={isExecuting || !customQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Query
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">{result.message}</span>
                    </div>

                    {result.data && (
                      <div className="mt-2">
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {result.error && (
                      <div className="mt-2">
                        <pre className="bg-red-100 p-3 rounded text-xs text-red-800 overflow-auto">{result.error}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Alternative: Manual Setup in Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>If the web interface doesn't work, you can manually run these commands in your Supabase SQL Editor:</p>

              <div className="space-y-3">
                <div>
                  <strong>1. Go to your Supabase Dashboard</strong>
                  <p className="text-gray-600">
                    Navigate to: https://supabase.com/dashboard/project/qaauhwulohxeeacexrav
                  </p>
                </div>

                <div>
                  <strong>2. Open SQL Editor</strong>
                  <p className="text-gray-600">Click on "SQL Editor" in the left sidebar</p>
                </div>

                <div>
                  <strong>3. Run this SQL command:</strong>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mt-2">{sqlCommands.addColumns}</pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sqlCommands.addColumns)}
                    className="mt-2"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy SQL Command
                  </Button>
                </div>

                <div>
                  <strong>4. Verify the structure:</strong>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mt-2">{sqlCommands.checkStructure}</pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sqlCommands.checkStructure)}
                    className="mt-2"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Verification Query
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
