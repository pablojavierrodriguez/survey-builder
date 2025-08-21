import { type NextRequest, NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"
import { getSafeEnvironmentConfig } from "@/lib/env.server"

export async function GET(request: NextRequest) {
  try {
    const envConfig = getSafeEnvironmentConfig()
    const hasEnvUrl = !!envConfig.supabase.url
    const hasEnvKey = !!envConfig.supabase.anonKey
    const hasServiceRole = !!envConfig.supabase.serviceRoleKey

    // Check if configuration is available
    const configured = await configManager.isConfigured()

    const envStatus = {
      hasEnvUrl,
      hasEnvKey,
      hasServiceRole,
      configured,
      canConnect: configured,
    }

    return NextResponse.json({
      success: true,
      ...envStatus,
      message: configured ? "Variables de entorno configuradas correctamente" : "Variables de entorno no encontradas",
      details: {
        priority: "Environment variables > Local file > Database",
        currentSource: configured ? "Environment variables" : "Not configured",
        wizardNeeded: !configured,
        debug: {
          envUrl: hasEnvUrl ? "✓" : "✗",
          envKey: hasEnvKey ? "✓" : "✗",
          serviceRole: hasServiceRole ? "✓" : "✗",
        },
      },
    })
  } catch (error) {
    console.error("Config check error:", error)
    return NextResponse.json(
      {
        success: false,
        configured: false,
        hasEnvUrl: false,
        hasEnvKey: false,
        hasServiceRole: false,
        canConnect: false,
        error: "Error checking configuration",
        message: "Error al verificar la configuración",
      },
      { status: 500 },
    )
  }
}
