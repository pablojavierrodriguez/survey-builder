import { type NextRequest, NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"

export async function GET(request: NextRequest) {
  try {
    // Check if configuration is available
    const configured = await configManager.isConfigured()

    const envStatus = {
      hasEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
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
