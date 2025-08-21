// Client-only environment accessor: only reads NEXT_PUBLIC_* and never logs server warnings

export interface EnvironmentConfig {
  supabase: {
    url: string | null
    anonKey: string | null
    serviceRoleKey: string | null
    isConfigured: boolean
  }
  app: {
    name: string
    url: string
    environment: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
  validation: {
    errors: string[]
    warnings: string[]
  }
}

function getPublicEnv(key: string): string | null {
  if (!key.startsWith('NEXT_PUBLIC_')) return null
  const value = process.env[key]
  return value && value.length > 0 ? value : null
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const supabaseUrl = getPublicEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const nodeEnv = getPublicEnv('NODE_ENV') || 'development'
  const appName = getPublicEnv('NEXT_PUBLIC_APP_NAME') || 'Product Survey App'
  const appUrl = getPublicEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
  const maintenanceMode = (getPublicEnv('NEXT_PUBLIC_MAINTENANCE_MODE') === 'true')
  const analyticsEnabled = (getPublicEnv('NEXT_PUBLIC_ANALYTICS_ENABLED') !== 'false')

  const isConfigured = !!(supabaseUrl && supabaseAnonKey)

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: null,
      isConfigured,
    },
    app: {
      name: appName,
      url: appUrl,
      environment: nodeEnv,
      maintenanceMode,
      analyticsEnabled,
    },
    validation: {
      errors: [],
      warnings: [],
    },
  }
}

export function getSafeEnvironmentConfig(): EnvironmentConfig {
  try {
    return getEnvironmentConfig()
  } catch {
    return {
      supabase: { url: null, anonKey: null, serviceRoleKey: null, isConfigured: false },
      app: { name: 'Product Survey App', url: 'http://localhost:3000', environment: 'development', maintenanceMode: false, analyticsEnabled: true },
      validation: { errors: [], warnings: [] },
    }
  }
}

