/**
 * Client-side caching utilities for better performance
 */

import { Quote } from '../types/types'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

// In-memory cache for session data
const memoryCache = new Map<string, CacheEntry<any>>()

// Default cache TTL values
export const CACHE_TTL = {
  TODAY_QUOTE: 5 * 60 * 1000, // 5 minutes - today's quote can change during testing
  ARCHIVE_PAGE: 10 * 60 * 1000, // 10 minutes - archive data is relatively stable
  QUOTE_COUNT: 15 * 60 * 1000, // 15 minutes - count changes less frequently
  AUDIO_METADATA: 60 * 60 * 1000, // 1 hour - audio metadata rarely changes
} as const

/**
 * Get data from cache
 * @param key Cache key
 * @param options Caching options
 * @returns Cached data or null if not found/expired
 */
export function getCachedData<T>(key: string, options: CacheOptions = {}): T | null {
  const { storage = 'memory' } = options

  try {
    let cacheEntry: CacheEntry<T> | null = null

    if (storage === 'memory') {
      cacheEntry = memoryCache.get(key) || null
    } else if (typeof window !== 'undefined') {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      const cached = storageObj.getItem(key)
      if (cached) {
        cacheEntry = JSON.parse(cached)
      }
    }

    if (!cacheEntry) {
      return null
    }

    // Check if cache entry is expired
    if (Date.now() > cacheEntry.timestamp + cacheEntry.ttl) {
      // Remove expired entry
      removeCachedData(key, { storage })
      return null
    }

    return cacheEntry.data
  } catch (error) {
    console.warn(`Cache get error for key "${key}":`, error)
    return null
  }
}

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param options Caching options
 */
export function setCachedData<T>(key: string, data: T, options: CacheOptions = {}): void {
  const { ttl = CACHE_TTL.ARCHIVE_PAGE, storage = 'memory' } = options

  try {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    if (storage === 'memory') {
      memoryCache.set(key, cacheEntry)
    } else if (typeof window !== 'undefined') {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      storageObj.setItem(key, JSON.stringify(cacheEntry))
    }
  } catch (error) {
    console.warn(`Cache set error for key "${key}":`, error)
  }
}

/**
 * Remove data from cache
 * @param key Cache key
 * @param options Caching options
 */
export function removeCachedData(key: string, options: CacheOptions = {}): void {
  const { storage = 'memory' } = options

  try {
    if (storage === 'memory') {
      memoryCache.delete(key)
    } else if (typeof window !== 'undefined') {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      storageObj.removeItem(key)
    }
  } catch (error) {
    console.warn(`Cache remove error for key "${key}":`, error)
  }
}

/**
 * Clear all cache entries
 * @param options Caching options
 */
export function clearCache(options: CacheOptions = {}): void {
  const { storage = 'memory' } = options

  try {
    if (storage === 'memory') {
      memoryCache.clear()
    } else if (typeof window !== 'undefined') {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      // Clear only cache entries (keys that start with cache prefix)
      const keys = Object.keys(storageObj).filter(key => key.startsWith('cache:'))
      keys.forEach(key => storageObj.removeItem(key))
    }
  } catch (error) {
    console.warn('Cache clear error:', error)
  }
}

/**
 * Generate cache key for quotes with pagination
 */
export function generateArchiveCacheKey(page: number = 1, category?: string, limit: number = 12): string {
  const categoryPart = category ? `_cat-${category}` : ''
  return `cache:archive_p${page}_l${limit}${categoryPart}`
}

/**
 * Generate cache key for today's quote
 */
export function generateTodayQuoteCacheKey(): string {
  const today = new Date().toISOString().split('T')[0]
  return `cache:today_quote_${today}`
}

/**
 * Generate cache key for quote count
 */
export function generateQuoteCountCacheKey(): string {
  return 'cache:quote_count'
}

/**
 * Wrapper function for caching API calls
 * @param cacheKey Cache key
 * @param apiCall Function that returns a promise with the data
 * @param options Caching options
 * @returns Promise with cached or fresh data
 */
export async function withCache<T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = getCachedData<T>(cacheKey, options)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const freshData = await apiCall()
  
  // Cache the fresh data
  setCachedData(cacheKey, freshData, options)
  
  return freshData
}

/**
 * Cached version of getTodaysQuote
 */
export async function getCachedTodaysQuote(): Promise<Quote | null> {
  const { getTodaysQuote } = await import('../api/supabase')
  
  return withCache(
    generateTodayQuoteCacheKey(),
    getTodaysQuote,
    { 
      ttl: CACHE_TTL.TODAY_QUOTE,
      storage: 'sessionStorage' // Use sessionStorage for today's quote
    }
  )
}

/**
 * Cached version of getAllQuotes with pagination
 */
export async function getCachedAllQuotes(limit?: number, offset?: number): Promise<Quote[]> {
  const { getAllQuotes } = await import('../api/supabase')
  
  const page = offset ? Math.floor(offset / (limit || 12)) + 1 : 1
  const cacheKey = generateArchiveCacheKey(page, undefined, limit)
  
  return withCache(
    cacheKey,
    () => getAllQuotes(limit, offset),
    { 
      ttl: CACHE_TTL.ARCHIVE_PAGE,
      storage: 'localStorage' // Use localStorage for archive pages (persist across sessions)
    }
  )
}

/**
 * Cached version of getQuotesByCategory
 */
export async function getCachedQuotesByCategory(category: string): Promise<Quote[]> {
  const { getQuotesByCategory } = await import('../api/supabase')
  
  return withCache(
    `cache:category_${category}`,
    () => getQuotesByCategory(category),
    { 
      ttl: CACHE_TTL.ARCHIVE_PAGE,
      storage: 'localStorage'
    }
  )
}

/**
 * Cached version of getQuoteCount
 */
export async function getCachedQuoteCount(): Promise<number> {
  const { getQuoteCount } = await import('../api/supabase')
  
  return withCache(
    generateQuoteCountCacheKey(),
    getQuoteCount,
    { 
      ttl: CACHE_TTL.QUOTE_COUNT,
      storage: 'localStorage'
    }
  )
}

/**
 * Invalidate cache for specific patterns (useful after creating new content)
 */
export function invalidateCache(patterns: string[]): void {
  patterns.forEach(pattern => {
    // Clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key)
      }
    }

    // Clear browser storage cache
    if (typeof window !== 'undefined') {
      [localStorage, sessionStorage].forEach(storage => {
        const keys = Object.keys(storage).filter(key => 
          key.startsWith('cache:') && key.includes(pattern)
        )
        keys.forEach(key => storage.removeItem(key))
      })
    }
  })
}

/**
 * Preload data into cache
 */
export async function preloadCache(): Promise<void> {
  try {
    // Preload today's quote
    await getCachedTodaysQuote()
    
    // Preload first page of archive
    await getCachedAllQuotes(12, 0)
    
    // Preload quote count
    await getCachedQuoteCount()
  } catch (error) {
    console.warn('Cache preload failed:', error)
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  memoryEntries: number
  localStorageEntries: number
  sessionStorageEntries: number
} {
  const memoryEntries = memoryCache.size
  
  let localStorageEntries = 0
  let sessionStorageEntries = 0
  
  if (typeof window !== 'undefined') {
    localStorageEntries = Object.keys(localStorage).filter(key => 
      key.startsWith('cache:')
    ).length
    
    sessionStorageEntries = Object.keys(sessionStorage).filter(key => 
      key.startsWith('cache:')
    ).length
  }
  
  return {
    memoryEntries,
    localStorageEntries,
    sessionStorageEntries
  }
}