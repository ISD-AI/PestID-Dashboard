type CacheItem<T> = {
  data: T
  timestamp: number
}

class Cache<T> {
  private cache: Map<string, CacheItem<T>>
  private ttl: number // Time to live in milliseconds

  constructor(ttlMinutes: number = 5) {
    this.cache = new Map()
    this.ttl = ttlMinutes * 60 * 1000
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }
}

// Create a singleton instance for species details cache
export const speciesCache = new Cache(5) // Cache for 5 minutes
