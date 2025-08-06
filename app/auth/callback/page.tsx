'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'


export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Simplified - let AuthProvider handle the session
        console.log('Auth callback, redirecting to dashboard')
        router.push('/admin/dashboard')
      } catch (error) {
        console.error('Auth callback exception:', error)
        router.push('/login?error=auth_callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
