import { readFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'

interface TempConfig {
  supabaseUrl: string
  supabaseKey: string
  timestamp: number
  expiresAt: number
}

export function readTempConfig(): TempConfig | null {
  try {
    const tempFilePath = join(process.cwd(), '.temp-supabase-config.json')
    
    if (!existsSync(tempFilePath)) {
      return null
    }
    
    const fileContent = readFileSync(tempFilePath, 'utf-8')
    const config: TempConfig = JSON.parse(fileContent)
    
    // Check if config has expired
    if (Date.now() > config.expiresAt) {
      console.log('🔧 [TempConfig] Config expired, removing file')
      deleteTempConfig()
      return null
    }
    
    return config
  } catch (error) {
    console.error('🔧 [TempConfig] Error reading temp config:', error)
    return null
  }
}

export function deleteTempConfig(): void {
  try {
    const tempFilePath = join(process.cwd(), '.temp-supabase-config.json')
    
    if (existsSync(tempFilePath)) {
      unlinkSync(tempFilePath)
      console.log('🔧 [TempConfig] Temporary config file deleted')
    }
  } catch (error) {
    console.error('🔧 [TempConfig] Error deleting temp config:', error)
  }
}