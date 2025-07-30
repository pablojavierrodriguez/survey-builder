'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = await getSupabaseClient()
        if (!supabase) {
          console.error('Supabase client not initialized')
          router.push('/login?error=supabase_not_initialized')
          return
        }
        
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_callback_error')
          return
        }

        if (data.session) {
          console.log('Auth callback successful, redirecting to dashboard')
          router.push('/admin/dashboard')
        } else {
          console.log('No session found, redirecting to login')
          router.push('/login')
        }
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
