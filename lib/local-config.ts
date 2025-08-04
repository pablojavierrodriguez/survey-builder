// Server-side only configuration system
// This file should only be imported in server-side code

interface LocalConfig {
  supabaseUrl: string
  supabaseKey: string
  timestamp: number
}

// Server-side functions (only available in Node.js environment)
export function saveLocalConfig(supabaseUrl: string, supabaseKey: string): boolean {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.warn('🔧 [LocalConfig] saveLocalConfig called on client side')
    return false
  }

  try {
    const fs = require('fs')
    const path = require('path')
    const CONFIG_FILE = path.join(process.cwd(), '.supabase-config.json')
    
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

// Read configuration from local file (server-side only)
export function readLocalConfig(): LocalConfig | null {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.warn('🔧 [LocalConfig] readLocalConfig called on client side')
    return null
  }

  try {
    const fs = require('fs')
    const path = require('path')
    const CONFIG_FILE = path.join(process.cwd(), '.supabase-config.json')
    
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

// Remove local configuration file (server-side only)
export function removeLocalConfig(): boolean {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.warn('🔧 [LocalConfig] removeLocalConfig called on client side')
    return false
  }

  try {
    const fs = require('fs')
    const path = require('path')
    const CONFIG_FILE = path.join(process.cwd(), '.supabase-config.json')
    
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

// Check if local configuration exists (server-side only)
export function hasLocalConfig(): boolean {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return false
  }

  try {
    const fs = require('fs')
    const path = require('path')
    const CONFIG_FILE = path.join(process.cwd(), '.supabase-config.json')
    return fs.existsSync(CONFIG_FILE)
  } catch (error) {
    return false
  }
}