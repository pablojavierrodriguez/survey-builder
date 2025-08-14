"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Database, FileText, Settings } from "lucide-react"
import { clearSupabaseCache } from "@/lib/supabase"

interface SetupResponse {
  success: boolean
  message: string
  savedTo?: string[]
  clearCache?: boolean
}

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [setupMethod, setSetupMethod] = useState<"claves" | "login">("claves")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [envVarsConfigured, setEnvVarsConfigured] = useState(false)
  const [checkingEnvVars, setCheckingEnvVars] = useState(true)

  useEffect(() => {
    checkEnvironmentVariables()
  }, [])

  const checkEnvironmentVariables = async () => {
    setCheckingEnvVars(true)
    try {
      const response = await fetch("/api/config/check")
      const data = await response.json()

      if (data.success && data.configured) {
        setEnvVarsConfigured(true)
        setSuccess("✅ Variables de entorno ya configuradas. La aplicación está lista para usar.")
        setStep(3) // Skip to completion step
      } else {
        setEnvVarsConfigured(false)
      }
    } catch (error) {
      console.error("Error checking environment variables:", error)
      setEnvVarsConfigured(false)
    } finally {
      setCheckingEnvVars(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const endpoint = setupMethod === "login" ? "/api/setup/test-connection-admin" : "/api/setup/test-connection"
      const body =
        setupMethod === "login"
          ? { adminEmail: formData.adminEmail, adminPassword: formData.adminPassword }
          : {
              supabaseUrl: formData.supabaseUrl,
              supabaseKey: formData.supabaseKey,
              serviceRoleKey: formData.serviceRoleKey,
            }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("✅ Conexión exitosa! Puedes continuar con la configuración.")
        setStep(2)
      } else {
        setError(`❌ Error de conexión: ${data.error}`)
      }
    } catch (error) {
      setError("❌ Error de conexión: No se pudo conectar al servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const endpoint = setupMethod === "login" ? "/api/setup/save-config-admin" : "/api/setup/save-config"
      const body =
        setupMethod === "login"
          ? {
              adminEmail: formData.adminEmail,
              adminPassword: formData.adminPassword,
              publicUrl: formData.publicUrl,
              appName: formData.appName,
            }
          : {
              supabaseUrl: formData.supabaseUrl,
              supabaseKey: formData.supabaseKey,
              serviceRoleKey: formData.serviceRoleKey,
              publicUrl: formData.publicUrl,
              appName: formData.appName,
            }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data: SetupResponse = await response.json()

      if (data.success) {
        setSuccess(`✅ ${data.message}`)

        // Show where config was saved
        if (data.savedTo && data.savedTo.length > 0) {
          const savedToText = data.savedTo
            .map((source) => {
              switch (source) {
                case "local":
                  return "archivo local"
                case "database":
                  return "base de datos"
                default:
                  return source
              }
            })
            .join(" y ")
          setSuccess((prev) => `${prev}\n📁 Configuración guardada en: ${savedToText}`)
        }

        // Clear cache if needed
        if (data.clearCache) {
          await clearSupabaseCache()
        }

        setStep(3)
      } else {
        setError(`❌ Error al guardar: ${(data as any).message || "Error desconocido"}`)
      }
    } catch (error) {
      setError("❌ Error al guardar configuración: No se pudo conectar al servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const canTestConnection = () => {
    if (setupMethod === "claves") {
      return formData.supabaseUrl && formData.supabaseKey && formData.serviceRoleKey
    } else {
      return formData.adminEmail && formData.adminPassword
    }
  }

  const canSaveConfiguration = () => {
    return step === 2 && (formData.publicUrl || formData.appName)
  }

  // Form data
  const [formData, setFormData] = useState({
    supabaseUrl: "",
    supabaseKey: "",
    serviceRoleKey: "",
    adminEmail: "",
    adminPassword: "",
    publicUrl: "",
    appName: "",
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">🚀 Configuración de Survey App</CardTitle>
          <CardDescription className="text-lg">
            {envVarsConfigured
              ? "Tu aplicación ya está configurada y lista para usar"
              : "Configura tu aplicación de encuestas paso a paso"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {checkingEnvVars && (
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Verificando configuración existente...</p>
            </div>
          )}

          {!checkingEnvVars && envVarsConfigured && step === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800">¡Aplicación Ya Configurada!</h3>
              <p className="text-gray-600">
                Las variables de entorno están configuradas correctamente. Tu aplicación está lista para usar.
              </p>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Variables detectadas:</strong> NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  SUPABASE_SERVICE_ROLE_KEY
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button onClick={() => (window.location.href = "/")} className="flex-1">
                  Ir al Survey
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/admin")} className="flex-1">
                  Panel de Admin
                </Button>
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEnvVarsConfigured(false)
                    setStep(1)
                    setSuccess(null)
                  }}
                  className="text-sm text-gray-500"
                >
                  ¿Necesitas reconfigurar? Haz clic aquí
                </Button>
              </div>
            </div>
          )}

          {!checkingEnvVars && !envVarsConfigured && (
            <>
              {/* Step Indicator */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className={`flex items-center space-x-2 ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >
                    1
                  </div>
                  <span className="hidden sm:inline">Conexión</span>
                </div>
                <div className={`flex items-center space-x-2 ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >
                    2
                  </div>
                  <span className="hidden sm:inline">Configuración</span>
                </div>
                <div className={`flex items-center space-x-2 ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >
                    3
                  </div>
                  <span className="hidden sm:inline">Completado</span>
                </div>
              </div>

              {/* Step 1: Connection */}
              {step === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Variables de entorno no detectadas.</strong> Necesitas configurar la conexión a Supabase
                      para que la aplicación funcione correctamente.
                    </AlertDescription>
                  </Alert>

                  <Tabs value={setupMethod} onValueChange={(value) => setSetupMethod(value as "claves" | "login")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="claves" title="Configuración manual con claves de API">
                        <Database className="w-4 h-4 mr-2" />
                        Con claves
                      </TabsTrigger>
                      <TabsTrigger value="login" title="Configuración automática con credenciales de admin">
                        <Settings className="w-4 h-4 mr-2" />
                        Con login
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="claves" className="space-y-4">
                      <div>
                        <Label htmlFor="supabaseUrl">URL de Supabase</Label>
                        <Input
                          id="supabaseUrl"
                          type="url"
                          placeholder="https://tu-proyecto.supabase.co"
                          value={formData.supabaseUrl}
                          onChange={(e) => handleInputChange("supabaseUrl", e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Encuentra esto en Supabase → Settings → API → Project URL
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="supabaseKey">Anon Key</Label>
                        <Input
                          id="supabaseKey"
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={formData.supabaseKey}
                          onChange={(e) => handleInputChange("supabaseKey", e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Encuentra esto en Supabase → Settings → API → anon public
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="serviceRoleKey">Service Role Key</Label>
                        <Input
                          id="serviceRoleKey"
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={formData.serviceRoleKey}
                          onChange={(e) => handleInputChange("serviceRoleKey", e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Encuentra esto en Supabase → Settings → API → service_role secret
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="login" className="space-y-4">
                      <div>
                        <Label htmlFor="adminEmail">Email de Administrador</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@tuempresa.com"
                          value={formData.adminEmail}
                          onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-1">Email del usuario administrador en Supabase</p>
                      </div>

                      <div>
                        <Label htmlFor="adminPassword">Contraseña de Administrador</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.adminPassword}
                          onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-1">Contraseña del usuario administrador</p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button onClick={testConnection} disabled={!canTestConnection() || isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Probando conexión...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Probar Conexión
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: Configuration */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Nombre de la Aplicación</Label>
                    <Input
                      id="appName"
                      placeholder="Mi App de Encuestas"
                      value={formData.appName}
                      onChange={(e) => handleInputChange("appName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="publicUrl">URL Pública</Label>
                    <Input
                      id="publicUrl"
                      type="url"
                      placeholder="https://tu-app.vercel.app"
                      value={formData.publicUrl}
                      onChange={(e) => handleInputChange("publicUrl", e.target.value)}
                    />
                    <p className="text-sm text-gray-600 mt-1">URL donde estará desplegada tu aplicación</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      ← Volver
                    </Button>
                    <Button
                      onClick={saveConfiguration}
                      disabled={!canSaveConfiguration() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Guardar Configuración
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-gray-800">¡Configuración Completada!</h3>
                  <p className="text-gray-600">
                    Tu aplicación está lista para usar. Puedes acceder al dashboard de administración.
                  </p>
                  <div className="flex space-x-2">
                    <Button onClick={() => (window.location.href = "/")} className="flex-1">
                      Ir al Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => (window.location.href = "/admin")} className="flex-1">
                      Panel de Admin
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
