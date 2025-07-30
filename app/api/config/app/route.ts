import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Only expose non-sensitive configuration to the client
    const config = {
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Product Community Survey',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000',
      enableExport: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
      enableEmailNotifications: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
    }

    return NextResponse.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching app config:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch configuration',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}