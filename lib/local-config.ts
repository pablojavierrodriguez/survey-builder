import fs from 'fs'
import path from 'path'

interface LocalConfig {
  supabaseUrl: string
  supabaseKey: string
  timestamp: number
}

const CONFIG_FILE = path.join(process.cwd(), '.supabase-config.json')

// Save configuration locally for bootstrap
export function saveLocalConfig(supabaseUrl: string, supabaseKey: string): boolean {
  try {
    const config: LocalConfig = {
      supabaseUrl,
      supabaseKey,
      timestamp: Date.now()
    }
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log('🔧 [LocalConfig] Configuration saved locally')
    return true
  } catch (error) {
    console.error('🔧 [LocalConfig] Error saving config:', error)
    return false
  }
}

// Read configuration from local file
export function readLocalConfig(): LocalConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null
    }
    
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
    const config: LocalConfig = JSON.parse(configData)
    
    // Check if config is not too old (24 hours)
    const isExpired = Date.now() - config.timestamp > 24 * 60 * 60 * 1000
    if (isExpired) {
      console.log('🔧 [LocalConfig] Configuration expired, removing')
      removeLocalConfig()
      return null
    }
    
    console.log('🔧 [LocalConfig] Configuration loaded from local file')
    return config
  } catch (error) {
    console.error('🔧 [LocalConfig] Error reading config:', error)
    return null
  }
}

// Remove local configuration file
export function removeLocalConfig(): boolean {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE)
      console.log('🔧 [LocalConfig] Configuration file removed')
    }
    return true
  } catch (error) {
    console.error('🔧 [LocalConfig] Error removing config:', error)
    return false
  }
}

// Check if local configuration exists
export function hasLocalConfig(): boolean {
  return fs.existsSync(CONFIG_FILE)
}