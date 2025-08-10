import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, Settings, Loader2, ExternalLink } from "lucide-react"

interface SetupWizardProps {
  onComplete?: () => void
  onSkip?: () => void
}

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({
    supabaseUrl: '',
    anonKey: '',
    tableName: 'pc_survey_data'
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`
        }
      })

      if (response.ok) {
        setTestResult('success')
        // Save configuration
        localStorage.setItem('supabase_url', config.supabaseUrl)
        localStorage.setItem('supabase_anon_key', config.anonKey)
        localStorage.setItem('app_settings', JSON.stringify({
          database: {
            url: config.supabaseUrl,
            apiKey: config.anonKey,
            tableName: config.tableName
          }
        }))
      } else {
        setTestResult('error')
      }
    } catch (error) {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const completeSetup = () => {
    if (onComplete) onComplete()
  }

  const skipSetup = () => {
    // Set demo mode flag
    localStorage.setItem('app_mode', 'demo')
    if (onSkip) onSkip()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Supabase Setup Wizard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Optional Setup:</strong> Configure Supabase for cloud data storage, 
                  or skip to use local storage mode for testing.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Supabase Project URL</label>
                  <Input
                    value={config.supabaseUrl}
                    onChange={(e) => setConfig({...config, supabaseUrl: e.target.value})}
                    placeholder="https://your-project.supabase.co"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Supabase Anon Key</label>
                  <Input
                    value={config.anonKey}
                    onChange={(e) => setConfig({...config, anonKey: e.target.value})}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    type="password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Table Name</label>
                  <Input
                    value={config.tableName}
                    onChange={(e) => setConfig({...config, tableName: e.target.value})}
                    placeholder="pc_survey_data"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={testConnection} 
                  disabled={!config.supabaseUrl || !config.anonKey || testing}
                  className="flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button variant="outline" onClick={skipSetup}>
                  Skip (Use Demo Mode)
                </Button>
              </div>

              {testResult === 'success' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    ✅ Connection successful! You can now use Supabase for data storage.
                    <Button onClick={completeSetup} className="ml-2" size="sm">
                      Complete Setup
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {testResult === 'error' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ Connection failed. Check your credentials or continue with demo mode.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">How to get Supabase credentials:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Create a free account at <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline">supabase.com</a></li>
              <li>Create a new project</li>
              <li>Go to Settings → API</li>
              <li>Copy your Project URL and anon/public key</li>
              <li>Run the migration SQL script in your SQL Editor</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}