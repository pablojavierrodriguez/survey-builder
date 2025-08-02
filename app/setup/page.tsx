"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    // Check if already configured
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/config/check')
      const data = await response.json()
      
      console.log('🔧 [Setup] Configuration check:', data)
      
      if (data.configured) {
        setSuccess("✅ Supabase ya está configurado correctamente")
        setStep(3)
      } else {
        console.log('🔧 [Setup] Configuration missing:', {
          hasEnvUrl: data.hasEnvUrl,
          hasEnvKey: data.hasEnvKey,
          canConnect: data.canConnect,
          error: data.error
        })
      }
    } catch (error) {
      console.error('Error checking configuration:', error)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess("✅ Conexión exitosa con Supabase")
        setStep(2)
      } else {
        setError(data.error || "Error al conectar con Supabase")
      }
    } catch (error) {
      setError("Error de red al probar la conexión")
    } finally {
      setIsLoading(false)
    }
  }

                const saveConfiguration = async () => {
                setIsLoading(true)
                setError("")
                
                try {
                  const response = await fetch('/api/setup/save-config', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      supabaseUrl,
                      supabaseKey
                    })
                  })

                  const data = await response.json()
                  
                  if (data.success) {
                    setSuccess("✅ Configuración guardada exitosamente")
                    setStep(3)
                  } else {
                    setError(data.error || "Error al guardar la configuración")
                  }
                } catch (error) {
                  setError("Error de red al guardar la configuración")
                } finally {
                  setIsLoading(false)
                }
              }

              const clearConfiguration = async () => {
                setIsLoading(true)
                setError("")
                
                try {
                  const response = await fetch('/api/setup/clear-config', {
                    method: 'POST'
                  })

                  const data = await response.json()
                  
                  if (data.success) {
                    setStep(1)
                    setSuccess("")
                    setError("")
                  } else {
                    setError(data.error || "Error al limpiar la configuración")
                  }
                } catch (error) {
                  setError("Error de red al limpiar la configuración")
                } finally {
                  setIsLoading(false)
                }
              }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Configuración Inicial</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Configura tu base de datos Supabase
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>

            {/* Step 1: Configuration */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supabase URL
                  </label>
                  <Input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supabase Anon Key
                  </label>
                  <Input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full"
                  />
                </div>

                <Button 
                  onClick={testConnection} 
                  disabled={isLoading || !supabaseUrl || !supabaseKey}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Probando conexión...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Probar Conexión
                    </>
                  )}
                </Button>
              </div>
            )}

                                    {/* Step 2: Save Configuration */}
                        {step === 2 && (
                          <div className="space-y-4">
                            <Alert>
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                Conexión exitosa. Ahora guardaremos la configuración.
                              </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>URL:</strong> {supabaseUrl}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>API Key:</strong> {supabaseKey.substring(0, 20)}...
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1"
                              >
                                ← Volver
                              </Button>
                              <Button 
                                onClick={saveConfiguration} 
                                disabled={isLoading}
                                className="flex-1"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                  </>
                                ) : (
                                  <>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Guardar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                                    {/* Step 3: Success */}
                        {step === 3 && (
                          <div className="space-y-4">
                            <Alert>
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                ¡Configuración completada! Ya puedes usar la aplicación.
                              </AlertDescription>
                            </Alert>

                            <div className="flex space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setStep(1)
                                  setSuccess("")
                                }}
                                className="flex-1"
                              >
                                Reconfigurar
                              </Button>
                              <Button 
                                onClick={() => window.location.href = '/'} 
                                className="flex-1"
                              >
                                Ir a la Aplicación
                              </Button>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={clearConfiguration}
                                disabled={isLoading}
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Limpiar Configuración
                              </Button>
                            </div>
                          </div>
                        )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Quick Setup */}
            {step === 1 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  ¿No tienes Supabase? Usa estas credenciales de prueba:
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSupabaseUrl("https://pzfujrbrsfcevektarjv.supabase.co")
                    setSupabaseKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZnVqcmJyc2ZjZXZla3Rhcmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzY5NTIsImV4cCI6MjA2OTMxMjk1Mn0.g5TLxNdpbCjisIX88hRwpAJglwT8xC3NibtS4InO5YY")
                  }}
                  className="w-full text-xs"
                >
                  Usar Credenciales de Prueba
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}