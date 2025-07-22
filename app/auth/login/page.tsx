"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { Shield, User, Lock, ExternalLink, AlertTriangle, Loader2 } from "lucide-react"
import { validateAndSanitize, loginSchema } from "@/lib/validation"

function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setValidationErrors([])

    try {
      // Client-side validation
      const validation = validateAndSanitize(loginSchema, {
        username: username.trim(),
        password: password
      })

      if (!validation.success) {
        setValidationErrors(validation.errors)
        setIsLoading(false)
        return
      }

      // Call secure login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
        credentials: 'include' // Include cookies
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Too many login attempts. Please try again in ${Math.ceil((result.retryAfter || 900) / 60)} minutes.`)
        } else if (response.status === 401) {
          setError("Invalid username or password")
        } else if (response.status === 400) {
          setError("Invalid input data")
          if (result.details) {
            setValidationErrors(result.details)
          }
        } else {
          setError(result.error || "Login failed. Please try again.")
        }
        setIsLoading(false)
        return
      }

      // Success - redirect based on user role
      const user = result.user
      if (user.role === 'admin') {
        router.push(redirectTo)
      } else {
        router.push('/admin/analytics')
      }

    } catch (error) {
      console.error('Login error:', error)
      setError("Network error. Please check your connection and try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">Admin Access</CardTitle>
          <CardDescription className="dark:text-slate-400 text-slate-600">
            Access the Product Community Survey administration panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700 border-slate-300"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                  minLength={3}
                  maxLength={50}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700 border-slate-300"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  minLength={8}
                  maxLength={128}
                />
              </div>
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="dark:text-red-400">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* General Error */}
            {error && (
              <Alert variant="destructive" className="dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="dark:text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo credentials for testing - remove in production */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Demo Credentials</h4>
              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>Viewer:</strong> viewer / viewer123</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Security Notice</h4>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Secure JWT authentication enabled</p>
                <p>• Rate limiting active (5 attempts per 15 minutes)</p>
                <p>• All data transmission encrypted</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="text-center">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Contact Administrator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Need access or having issues? Contact the system administrator:
              </p>
              <a
                href="https://www.linkedin.com/in/pablojavierrodriguez"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Pablo Javier Rodriguez
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 p-4">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
