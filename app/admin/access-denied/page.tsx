"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle } from "lucide-react"

export default function AccessDeniedPage() {
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is authenticated, redirect to appropriate page
    if (user) {
      router.push("/admin/dashboard")
    } else {
      setLoading(false)
    }
  }, [user, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
            Access Denied
          </CardTitle>
          <p className="text-red-700 dark:text-red-300 mt-2">
            You don't have permission to access this page
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Insufficient Permissions
              </span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              Your current role doesn't have access to this section. Please contact an administrator if you believe this is an error.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
