"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SetupWizard } from "@/components/ui/setup-wizard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, Zap, Users, BarChart3 } from "lucide-react"

export default function SetupPage() {
  const router = useRouter()
  const [currentMode, setCurrentMode] = useState<'demo' | 'supabase' | 'unconfigured'>('unconfigured')

  useEffect(() => {
    // Check current configuration
    const appMode = localStorage.getItem('app_mode')
    const supabaseUrl = localStorage.getItem('supabase_url')
    const supabaseKey = localStorage.getItem('supabase_anon_key')

    if (appMode === 'demo') {
      setCurrentMode('demo')
    } else if (supabaseUrl && supabaseKey) {
      setCurrentMode('supabase')
    } else {
      setCurrentMode('unconfigured')
    }
  }, [])

  const handleSetupComplete = () => {
    setCurrentMode('supabase')
    router.push('/admin/dashboard')
  }

  const handleSkipSetup = () => {
    setCurrentMode('demo')
    router.push('/')
  }

  const switchToDemo = () => {
    localStorage.setItem('app_mode', 'demo')
    localStorage.removeItem('supabase_url')
    localStorage.removeItem('supabase_anon_key')
    setCurrentMode('demo')
  }

  const switchToSupabase = () => {
    localStorage.removeItem('app_mode')
    setCurrentMode('unconfigured')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            Product Survey Builder Setup
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Configure your application for optimal performance
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Mode: {currentMode === 'demo' ? 'Demo Mode' : currentMode === 'supabase' ? 'Supabase Mode' : 'Not Configured'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMode === 'demo' && 'Using localStorage for data storage'}
                  {currentMode === 'supabase' && 'Connected to Supabase cloud database'}
                  {currentMode === 'unconfigured' && 'No configuration detected'}
                </p>
              </div>
              <Badge variant={currentMode === 'supabase' ? 'default' : currentMode === 'demo' ? 'secondary' : 'destructive'}>
                {currentMode === 'supabase' && <CheckCircle className="w-3 h-3 mr-1" />}
                {currentMode === 'demo' && <Zap className="w-3 h-3 mr-1" />}
                {currentMode === 'unconfigured' && <XCircle className="w-3 h-3 mr-1" />}
                {currentMode.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Mode Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className={currentMode === 'demo' ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Demo Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Works immediately</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">No setup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Local data storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Data not persistent across devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">No real-time sync</span>
                </div>
              </div>
              {currentMode !== 'demo' && (
                <Button onClick={switchToDemo} className="w-full mt-4" variant="outline">
                  Switch to Demo Mode
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={currentMode === 'supabase' ? 'ring-2 ring-green-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                Supabase Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Cloud data storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Real-time sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">User authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Scalable and secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Requires setup</span>
                </div>
              </div>
              {currentMode !== 'supabase' && (
                <Button onClick={switchToSupabase} className="w-full mt-4">
                  Configure Supabase
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Setup Wizard */}
        {currentMode === 'unconfigured' && (
          <SetupWizard onComplete={handleSetupComplete} onSkip={handleSkipSetup} />
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                onClick={() => router.push('/')} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Test Survey Form
              </Button>
              <Button 
                onClick={() => router.push('/admin/analytics')} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </Button>
              <Button 
                onClick={() => window.open('https://supabase.com/docs', '_blank')} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Supabase Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}