import { NextRequest, NextResponse } from 'next/server'
import { getSafeClientConfig } from '@/lib/config-manager'

export async function GET(request: NextRequest) {
  try {
    const config = await getSafeClientConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching app config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch app configuration' },
      { status: 500 }
    )
  }
}