import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)

    // Check if profile exists
    const { data: singleProfile, error: singleError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get all profiles for this user
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      userId,
      profiles: {
        all: allProfiles,
        single: singleProfile,
        error: allError?.message || null
      },
      singleProfile: {
        data: singleProfile,
        error: singleError?.message || null
      },
      debug: {
        hasMultipleProfiles: allProfiles && allProfiles.length > 1,
        hasNoProfiles: !allProfiles || allProfiles.length === 0,
        totalProfiles: allProfiles?.length || 0
      }
    })

  } catch (error) {
    logger.error('Debug profile error:', error as Error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const { userId, email, role = 'admin' } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({
        error: 'User ID and email are required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Delete any existing profiles for this user
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting existing profiles:', deleteError)
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email: email,
        role: role
      }])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create profile',
        details: insertError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Create profile error:', error as Error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}