"use client"

import type React from "react"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithPassword } from "@/lib/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { Shield, User, Lock, ExternalLink, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/admin/dashboard"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("🔧 [Login] Attempting login with:", { email, password: "***" })

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      const result = await signInWithPassword(email, password)

      console.log("🔧 [Login] SignIn result:", { error: result?.error || "No error" })

      if (result?.error) {
        setError(result.error)
        console.error("🔧 [Login] Login failed:", result.error)
      } else {
        // Login successful, redirecting to:
        console.log("🔧 [Login] Login successful, redirecting to:", redirectTo)
        router.push(redirectTo)
        router.refresh() // Refresh to update server components
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("🔧 [Login] Login error:", error)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 p-4 sm:p-6">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

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
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700 border-slate-300"
                    placeholder="Enter email"
                    required
                    autoComplete="email"
                    disabled={isLoading}
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700 border-slate-300"
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

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

            {/* Sign Up Option */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Don't have an account?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => router.push("/auth/signup")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
              </div>
            </div>

            {/* Demo credentials for testing */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Demo Credentials</h4>
                <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <p>
                    <strong>Viewer Demo:</strong> viewer@demo.com / viewer123 (Read-only analytics)
                  </p>
                  <p>
                    <strong>Admin Demo:</strong> admin-demo@demo.com / demo123 (Read-only admin panel)
                  </p>
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
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
