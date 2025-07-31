"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
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
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const { user, profile, loading: authLoading, signInWithPassword, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard'

  // Check if Supabase is configured on component mount
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const client = await getSupabaseClient()
        setSupabaseConfigured(!!client)
      } catch (error) {
        console.error('Error checking Supabase configuration:', error)
        setSupabaseConfigured(false)
      }
    }
    checkSupabase()
  }, [])

  // Redirect if already authenticated - only redirect after successful login
  useEffect(() => {
    if (user && !authLoading && !isLoading) {
      // Only redirect if we just logged in, not on page load
      const hasJustLoggedIn = sessionStorage.getItem('justLoggedIn')
      if (hasJustLoggedIn) {
        sessionStorage.removeItem('justLoggedIn')
        router.push(redirectTo)
      }
    }
  }, [user, router, redirectTo, isLoading, authLoading])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log('🔧 [Login] Attempting login with:', { email, password: '***' })

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signInWithPassword(email, password)
      
      console.log('🔧 [Login] SignIn result:', { error: error?.message || 'No error' })
      
      if (error) {
        setError(error.message || "Invalid email or password")
        console.error('🔧 [Login] Login failed:', error)
      } else {
        // Success - user will be redirected by useEffect
        console.log("🔧 [Login] Login successful")
        sessionStorage.setItem('justLoggedIn', 'true')
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("🔧 [Login] Login error:", error)
    }

    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message || "Google login failed")
      } else {
        // Success - user will be redirected by useEffect
        console.log("Google login successful")
        sessionStorage.setItem('justLoggedIn', 'true')
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Google login error:", error)
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

            {/* Google Sign In - Only show if Supabase is configured */}
            {supabaseConfigured && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-slate-300 dark:border-slate-700"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}

            {/* Demo credentials for testing */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Demo Credentials</h4>
                <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <p><strong>Viewer Demo:</strong> viewer@demo.com / viewer123 (Read-only analytics)</p>
                  <p><strong>Admin Demo:</strong> admin-demo@demo.com / demo123 (Read-only admin panel)</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {supabaseConfigured ? 'Or sign up with Google OAuth above' : 'Google OAuth requires Supabase configuration'}
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
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
