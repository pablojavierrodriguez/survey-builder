"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AccessDeniedPage() {
  const router = useRouter()

  const goBack = () => {
    const authStr = localStorage.getItem("survey_auth")
    if (authStr) {
      try {
        const auth = JSON.parse(authStr)
        const defaultPath = auth.role === "admin" ? "/admin/dashboard" : "/admin/analytics"
        router.push(defaultPath)
      } catch (error) {
        router.push("/admin/analytics")
      }
    } else {
      router.push("/auth/login")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <p className="text-gray-600">You don't have permission to access this page</p>
        </CardHeader>

        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your current role doesn't allow access to this section. Please contact an administrator if you need
              additional permissions.
            </p>

            <Button
              onClick={goBack}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
