/**
 * Simple Caching Service - No over engineering
 */

interface CacheItem {
  data: any
  timestamp: number
  expiresAt: number
}

export class CacheManager {
  private cache: Map<string, CacheItem> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Set cache item
   */
  set(key: string, data: any, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    })
  }

  /**
   * Get cache item
   */
  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * Delete cache item
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    return item ? Date.now() <= item.expiresAt : false
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

export class QueryClient {
  private cacheManager: CacheManager

  constructor() {
    this.cacheManager = new CacheManager()
  }

  /**
   * Simple query with caching
   */
  async query<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: { staleTime?: number } = {}
  ): Promise<T> {
    // Check cache first
    const cached = this.cacheManager.get(key)
    if (cached) {
      return cached
    }

    // Execute query
    const result = await queryFn()
    
    // Cache result
    this.cacheManager.set(key, result, options.staleTime)
    
    return result
  }

  /**
   * Invalidate cache
   */
  invalidate(key: string): void {
    this.cacheManager.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cacheManager.clear()
  }
}

// Export instances
export const cacheManager = new CacheManager()
export const queryClient = new QueryClient()

export default { CacheManager, QueryClient, cacheManager, queryClient }