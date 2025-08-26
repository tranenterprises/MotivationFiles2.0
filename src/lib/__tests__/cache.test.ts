/**
 * @jest-environment jsdom
 */

import {
  getCachedData,
  setCachedData,
  removeCachedData,
  clearCache,
  generateArchiveCacheKey,
  generateTodayQuoteCacheKey,
  generateQuoteCountCacheKey,
  withCache,
  getCachedTodaysQuote,
  getCachedAllQuotes,
  getCachedQuotesByCategory,
  getCachedQuoteCount,
  invalidateCache,
  preloadCache,
  getCacheStats,
  CACHE_TTL
} from '../utils/cache'

import type { Quote } from '../types/types'

// Mock the supabase module
jest.mock('../api/supabase', () => ({
  getTodaysQuote: jest.fn(),
  getAllQuotes: jest.fn(),
  getQuotesByCategory: jest.fn(),
  getQuoteCount: jest.fn()
}))

describe('Cache Utilities', () => {
  const mockQuote: Quote = {
    id: 'test-quote-1',
    content: 'Test quote content',
    category: 'motivation',
    audio_url: 'https://example.com/audio.mp3',
    audio_duration: 30,
    date_created: '2024-01-15',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }

  // Mock Date.now for consistent testing
  const mockNow = 1642248000000 // Fixed timestamp

  beforeEach(() => {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear memory cache by calling clearCache
    clearCache({ storage: 'memory' })
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    clearCache({ storage: 'memory' })
  })

  describe('Basic Cache Operations', () => {
    describe('Memory Cache', () => {
      it('should store and retrieve data from memory cache', () => {
        const testData = { test: 'data' }
        setCachedData('test-key', testData, { storage: 'memory', ttl: 10000 })
        
        const retrieved = getCachedData('test-key', { storage: 'memory' })
        expect(retrieved).toEqual(testData)
      })

      it('should return null for non-existent keys', () => {
        const result = getCachedData('non-existent', { storage: 'memory' })
        expect(result).toBeNull()
      })

      it('should handle TTL expiration', () => {
        const originalDateNow = Date.now
        Date.now = jest.fn(() => mockNow)
        
        const testData = { test: 'data' }
        setCachedData('test-key', testData, { storage: 'memory', ttl: 100 })
        
        // Mock time passing
        Date.now = jest.fn(() => mockNow + 200)
        
        const result = getCachedData('test-key', { storage: 'memory' })
        expect(result).toBeNull()
        
        Date.now = originalDateNow
      })

      it('should remove cached data', () => {
        setCachedData('test-key', { test: 'data' }, { storage: 'memory' })
        removeCachedData('test-key', { storage: 'memory' })
        
        const result = getCachedData('test-key', { storage: 'memory' })
        expect(result).toBeNull()
      })
    })

    describe('localStorage Cache', () => {
      it('should store and retrieve data from localStorage', () => {
        const testData = { test: 'localStorage data' }
        setCachedData('test-key', testData, { storage: 'localStorage', ttl: 10000 })
        
        const retrieved = getCachedData('test-key', { storage: 'localStorage' })
        expect(retrieved).toEqual(testData)
      })

      it('should handle localStorage TTL expiration', () => {
        const originalDateNow = Date.now
        Date.now = jest.fn(() => mockNow)
        
        const testData = { test: 'data' }
        setCachedData('test-key', testData, { storage: 'localStorage', ttl: 100 })
        
        Date.now = jest.fn(() => mockNow + 200)
        
        const result = getCachedData('test-key', { storage: 'localStorage' })
        expect(result).toBeNull()
        
        Date.now = originalDateNow
      })

      it('should remove data from localStorage', () => {
        setCachedData('test-key', { test: 'data' }, { storage: 'localStorage' })
        removeCachedData('test-key', { storage: 'localStorage' })
        
        const result = getCachedData('test-key', { storage: 'localStorage' })
        expect(result).toBeNull()
      })
    })

    describe('sessionStorage Cache', () => {
      it('should store and retrieve data from sessionStorage', () => {
        const testData = { test: 'sessionStorage data' }
        setCachedData('test-key', testData, { storage: 'sessionStorage', ttl: 10000 })
        
        const retrieved = getCachedData('test-key', { storage: 'sessionStorage' })
        expect(retrieved).toEqual(testData)
      })

      it('should handle sessionStorage errors gracefully', () => {
        // Mock storage quota exceeded
        const originalSetItem = sessionStorage.setItem
        sessionStorage.setItem = jest.fn(() => {
          throw new Error('QuotaExceededError')
        })

        // Should not throw when storage fails
        expect(() => {
          setCachedData('test-key', { test: 'data' }, { storage: 'sessionStorage' })
        }).not.toThrow()

        sessionStorage.setItem = originalSetItem
      })
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate archive cache keys correctly', () => {
      expect(generateArchiveCacheKey(1)).toBe('cache:archive_p1_l12')
      expect(generateArchiveCacheKey(2, 'motivation')).toBe('cache:archive_p2_l12_cat-motivation')
      expect(generateArchiveCacheKey(3, undefined, 20)).toBe('cache:archive_p3_l20')
    })

    it('should generate today quote cache key', () => {
      const key = generateTodayQuoteCacheKey()
      expect(key).toMatch(/^cache:today_quote_\d{4}-\d{2}-\d{2}$/)
    })

    it('should generate quote count cache key', () => {
      expect(generateQuoteCountCacheKey()).toBe('cache:quote_count')
    })
  })

  describe('withCache Wrapper', () => {
    it('should return cached data if available', async () => {
      const testData = { test: 'cached' }
      setCachedData('test-key', testData, { storage: 'memory' })

      const apiCall = jest.fn().mockResolvedValue({ test: 'fresh' })
      const result = await withCache('test-key', apiCall, { storage: 'memory' })

      expect(result).toEqual(testData)
      expect(apiCall).not.toHaveBeenCalled()
    })

    it('should call API and cache result if not cached', async () => {
      const freshData = { test: 'fresh' }
      const apiCall = jest.fn().mockResolvedValue(freshData)
      
      const result = await withCache('test-key', apiCall, { storage: 'memory' })

      expect(result).toEqual(freshData)
      expect(apiCall).toHaveBeenCalledTimes(1)
      
      // Verify it was cached
      const cached = getCachedData('test-key', { storage: 'memory' })
      expect(cached).toEqual(freshData)
    })

    it('should handle API errors', async () => {
      const apiCall = jest.fn().mockRejectedValue(new Error('API Error'))
      
      await expect(withCache('test-key', apiCall, { storage: 'memory' }))
        .rejects.toThrow('API Error')
    })
  })

  describe('Cached API Functions', () => {
    beforeEach(() => {
      // Clear any previous mocks that might interfere
      jest.clearAllMocks()
    })

    describe('getCachedTodaysQuote', () => {
      it('should cache today\'s quote in sessionStorage', async () => {
        jest.clearAllMocks()
        clearCache({ storage: 'sessionStorage' })
        
        const { getTodaysQuote } = await import('./supabase')
        ;(getTodaysQuote as jest.Mock).mockResolvedValue(mockQuote)

        const result = await getCachedTodaysQuote()

        expect(result).toEqual(mockQuote)
        expect(getTodaysQuote).toHaveBeenCalledTimes(1)

        // Should return cached result on second call
        const result2 = await getCachedTodaysQuote()
        expect(result2).toEqual(mockQuote)
        expect(getTodaysQuote).toHaveBeenCalledTimes(1)
      })

      it('should handle null response', async () => {
        jest.clearAllMocks()
        clearCache({ storage: 'sessionStorage' })
        
        const { getTodaysQuote } = await import('./supabase')
        ;(getTodaysQuote as jest.Mock).mockResolvedValue(null)

        const result = await getCachedTodaysQuote()
        expect(result).toBeNull()
      })
    })

    describe('getCachedAllQuotes', () => {
      it('should cache quotes with pagination in localStorage', async () => {
        jest.clearAllMocks()
        clearCache({ storage: 'localStorage' })
        
        const mockQuotes = [mockQuote]
        const { getAllQuotes } = await import('./supabase')
        ;(getAllQuotes as jest.Mock).mockResolvedValue(mockQuotes)

        const result = await getCachedAllQuotes(12, 0)

        expect(result).toEqual(mockQuotes)
        expect(getAllQuotes).toHaveBeenCalledWith(12, 0)

        // Should return cached result
        const result2 = await getCachedAllQuotes(12, 0)
        expect(result2).toEqual(mockQuotes)
        expect(getAllQuotes).toHaveBeenCalledTimes(1)
      })

      it('should handle different pagination parameters', async () => {
        const mockQuotes = [mockQuote]
        const { getAllQuotes } = await import('./supabase')
        ;(getAllQuotes as jest.Mock).mockResolvedValue(mockQuotes)

        await getCachedAllQuotes(20, 20) // Page 2, limit 20
        expect(getAllQuotes).toHaveBeenCalledWith(20, 20)
      })
    })

    describe('getCachedQuotesByCategory', () => {
      it('should cache category quotes', async () => {
        jest.clearAllMocks()
        clearCache({ storage: 'localStorage' })
        
        const mockQuotes = [mockQuote]
        const { getQuotesByCategory } = await import('./supabase')
        ;(getQuotesByCategory as jest.Mock).mockResolvedValue(mockQuotes)

        const result = await getCachedQuotesByCategory('motivation')

        expect(result).toEqual(mockQuotes)
        expect(getQuotesByCategory).toHaveBeenCalledWith('motivation')

        // Should return cached result
        const result2 = await getCachedQuotesByCategory('motivation')
        expect(result2).toEqual(mockQuotes)
        expect(getQuotesByCategory).toHaveBeenCalledTimes(1)
      })
    })

    describe('getCachedQuoteCount', () => {
      it('should cache quote count', async () => {
        jest.clearAllMocks()
        clearCache({ storage: 'localStorage' })
        
        const { getQuoteCount } = await import('./supabase')
        ;(getQuoteCount as jest.Mock).mockResolvedValue(42)

        const result = await getCachedQuoteCount()

        expect(result).toBe(42)
        expect(getQuoteCount).toHaveBeenCalledTimes(1)

        // Should return cached result
        const result2 = await getCachedQuoteCount()
        expect(result2).toBe(42)
        expect(getQuoteCount).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Cache Management', () => {
    describe('clearCache', () => {
      it('should clear memory cache', () => {
        setCachedData('test1', { data: 1 }, { storage: 'memory' })
        setCachedData('test2', { data: 2 }, { storage: 'memory' })

        clearCache({ storage: 'memory' })

        expect(getCachedData('test1', { storage: 'memory' })).toBeNull()
        expect(getCachedData('test2', { storage: 'memory' })).toBeNull()
      })

      it('should clear localStorage cache entries only', () => {
        localStorage.setItem('cache:test1', 'cached-data')
        localStorage.setItem('other:test2', 'non-cached-data')

        clearCache({ storage: 'localStorage' })

        expect(localStorage.getItem('cache:test1')).toBeNull()
        expect(localStorage.getItem('other:test2')).toBe('non-cached-data')
      })
    })

    describe('invalidateCache', () => {
      it('should invalidate cache entries matching patterns', () => {
        setCachedData('cache:today_quote_2024-01-15', mockQuote, { storage: 'memory' })
        setCachedData('cache:archive_p1_l12', [mockQuote], { storage: 'memory' })
        setCachedData('cache:other_data', { other: true }, { storage: 'memory' })

        invalidateCache(['today_quote', 'archive'])

        expect(getCachedData('cache:today_quote_2024-01-15', { storage: 'memory' })).toBeNull()
        expect(getCachedData('cache:archive_p1_l12', { storage: 'memory' })).toBeNull()
        expect(getCachedData('cache:other_data', { storage: 'memory' })).toEqual({ other: true })
      })

      it('should handle localStorage invalidation', () => {
        localStorage.setItem('cache:today_quote_2024-01-15', JSON.stringify({
          data: mockQuote,
          timestamp: Date.now(),
          ttl: 300000
        }))

        invalidateCache(['today_quote'])

        expect(localStorage.getItem('cache:today_quote_2024-01-15')).toBeNull()
      })
    })

    describe('getCacheStats', () => {
      it('should return correct cache statistics', () => {
        // Clear all caches first to ensure clean state
        clearCache({ storage: 'memory' })
        clearCache({ storage: 'localStorage' })
        clearCache({ storage: 'sessionStorage' })

        setCachedData('cache:test1', { data: 1 }, { storage: 'memory' })
        setCachedData('cache:test2', { data: 2 }, { storage: 'localStorage' })
        setCachedData('cache:test3', { data: 3 }, { storage: 'sessionStorage' })

        const stats = getCacheStats()

        expect(stats.memoryEntries).toBeGreaterThanOrEqual(1)
        expect(stats.localStorageEntries).toBeGreaterThanOrEqual(1)
        expect(stats.sessionStorageEntries).toBeGreaterThanOrEqual(1)
      })

      it('should handle empty caches', () => {
        const stats = getCacheStats()

        expect(stats.memoryEntries).toBe(0)
        expect(stats.localStorageEntries).toBe(0)
        expect(stats.sessionStorageEntries).toBe(0)
      })
    })
  })

  describe('preloadCache', () => {
    it('should preload essential cache data', async () => {
      const { getTodaysQuote, getAllQuotes, getQuoteCount } = await import('./supabase')
      
      ;(getTodaysQuote as jest.Mock).mockResolvedValue(mockQuote)
      ;(getAllQuotes as jest.Mock).mockResolvedValue([mockQuote])
      ;(getQuoteCount as jest.Mock).mockResolvedValue(42)

      await preloadCache()

      expect(getTodaysQuote).toHaveBeenCalled()
      expect(getAllQuotes).toHaveBeenCalledWith(12, 0)
      expect(getQuoteCount).toHaveBeenCalled()
    })

    it('should handle preload errors gracefully', async () => {
      const { getTodaysQuote } = await import('./supabase')
      ;(getTodaysQuote as jest.Mock).mockRejectedValue(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      await expect(preloadCache()).resolves.not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Cache preload failed:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('TTL Constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.TODAY_QUOTE).toBe(5 * 60 * 1000) // 5 minutes
      expect(CACHE_TTL.ARCHIVE_PAGE).toBe(10 * 60 * 1000) // 10 minutes
      expect(CACHE_TTL.QUOTE_COUNT).toBe(15 * 60 * 1000) // 15 minutes
      expect(CACHE_TTL.AUDIO_METADATA).toBe(60 * 60 * 1000) // 1 hour
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle storage quota exceeded errors', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw when storage quota is exceeded
      expect(() => {
        setCachedData('test', { large: 'data' }, { storage: 'localStorage' })
      }).not.toThrow()

      localStorage.setItem = originalSetItem
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('cache:test', 'invalid-json')

      const result = getCachedData('test', { storage: 'localStorage' })
      expect(result).toBeNull()
    })

    it('should handle missing storage in browser environment', () => {
      // Temporarily disable localStorage
      const originalLocalStorage = localStorage
      delete (window as any).localStorage

      expect(() => {
        setCachedData('test', { data: 'test' }, { storage: 'localStorage' })
      }).not.toThrow()

      // Restore localStorage
      ;(window as any).localStorage = originalLocalStorage
    })

    it('should handle server-side rendering (no window)', () => {
      const originalWindow = global.window
      delete (global as any).window

      expect(() => {
        setCachedData('test', { data: 'test' }, { storage: 'localStorage' })
        getCachedData('test', { storage: 'localStorage' })
      }).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('Performance and Stress Tests', () => {
    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `quote-${i}`,
        content: `Quote content ${i}`.repeat(10)
      }))

      setCachedData('large-dataset', largeData, { storage: 'memory' })
      const retrieved = getCachedData('large-dataset', { storage: 'memory' })

      expect(retrieved).toEqual(largeData)
    })

    it('should handle many cache entries', () => {
      for (let i = 0; i < 100; i++) {
        setCachedData(`test-${i}`, { data: i }, { storage: 'memory' })
      }

      for (let i = 0; i < 100; i++) {
        const result = getCachedData(`test-${i}`, { storage: 'memory' })
        expect(result).toEqual({ data: i })
      }
    })
  })
})