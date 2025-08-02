// Simple in-memory cache manager for performance optimization

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  keys: string[]
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0
  }

  // Default TTL: 5 minutes
  public readonly defaultTTL = 5 * 60 * 1000

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    this.cache.set(key, entry)

    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanup()
    }
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Generate cache key for API requests
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${prefix}:${sortedParams}`
  }
}

// Export singleton instance
export const cacheManager = new CacheManager()

// Cache keys constants
export const CACHE_KEYS = {
  ANALYTICS: 'analytics',
  DATABASE: 'database',
  SETTINGS: 'settings',
  QUICK_STATS: 'quick_stats'
} as const

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  ANALYTICS: 2 * 60 * 1000,      // 2 minutes
  DATABASE: 1 * 60 * 1000,       // 1 minute
  SETTINGS: 10 * 60 * 1000,      // 10 minutes
  QUICK_STATS: 30 * 1000         // 30 seconds
} as const

// Helper function to get cached data or fetch and cache
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = cacheManager.defaultTTL
): Promise<T> {
  // Try to get from cache first
  const cached = cacheManager.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Cache the result
  cacheManager.set(key, data, ttl)
  
  return data
}

// Helper function to invalidate cache by prefix
export function invalidateCacheByPrefix(prefix: string): void {
  const stats = cacheManager.getStats()
  for (const key of stats.keys) {
    if (key.startsWith(prefix)) {
      cacheManager.delete(key)
    }
  }
}