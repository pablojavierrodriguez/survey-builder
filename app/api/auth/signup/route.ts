import { NextRequest, NextResponse } from 'next/server'
import { configManager } from '@/lib/config-manager'

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'System not configured' },
        { status: 503 }
      )
    }

    // Parse request body
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}