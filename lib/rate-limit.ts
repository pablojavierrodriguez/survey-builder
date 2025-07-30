// Simple in-memory rate limiting
// In production, use Redis or similar for distributed rate limiting

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private getKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }

  async check(ip: string, endpoint: string, limit: number, windowMs: number): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const key = this.getKey(ip, endpoint)
    const now = Date.now()
    
    const entry = this.limits.get(key)
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      }
    }
    
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }
    
    // Increment count
    entry.count++
    this.limits.set(key, entry)
    
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.limits.clear()
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

// Rate limit configurations
export const RATE_LIMITS = {
  // Survey submission: 5 requests per hour
  SURVEY_SUBMISSION: { limit: 5, windowMs: 60 * 60 * 1000 },
  
  // Login attempts: 10 requests per 15 minutes
  LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 },
  
  // API endpoints: 100 requests per minute
  API: { limit: 100, windowMs: 60 * 1000 },
  
  // Admin endpoints: 50 requests per minute
  ADMIN: { limit: 50, windowMs: 60 * 1000 },
}

// Rate limiting middleware
export async function rateLimit(
  ip: string,
  endpoint: string,
  type: keyof typeof RATE_LIMITS
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}> {
  try {
    const config = RATE_LIMITS[type]
    const result = await rateLimiter.check(ip, endpoint, config.limit, config.windowMs)
    
    if (!result.allowed) {
      return {
        ...result,
        error: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000 / 60)} minutes.`
      }
    }
    
    return result
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Allow request if rate limiting fails
    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60000
    }
  }
}

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  // Fallback for development
  return '127.0.0.1'
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  rateLimiter.destroy()
})

process.on('SIGINT', () => {
  rateLimiter.destroy()
})