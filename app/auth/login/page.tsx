"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { Shield, User, Lock, ExternalLink, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const { signInWithPassword, signInWithGoogle, user } = useAuth()
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

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    if (!supabaseConfigured) {
      setError("Authentication system not configured. Please contact support.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signInWithPassword(email, password)
      
      if (error) {
        setError(error.message || "Invalid email or password")
      } else {
        // Success - user will be redirected by useEffect
        console.log("Login successful")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", error)
    }

    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    if (!supabaseConfigured) {
      setError("Authentication system not configured. Please contact support.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message || "Google login failed")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Google login error:", error)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Product Community Survey
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Configuration Status */}
            {!supabaseConfigured && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Authentication system not configured. Demo mode may be limited.
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !supabaseConfigured}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading || !supabaseConfigured}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Demo Accounts Info */}
        <Card className="shadow-lg border-0 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Demo Accounts
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                For testing purposes, you can use these demo accounts:
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <p><strong>Viewer:</strong> viewer@demo.com / viewer123</p>
                <p><strong>Admin Demo:</strong> admin-demo@demo.com / demo123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ModeToggle />
        </div>
      </div>
    </div>
  )
}
