'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { preloadCache, getCacheStats } from '@/lib/utils/cache';

interface CacheContextType {
  preload: () => Promise<void>;
  getStats: () => ReturnType<typeof getCacheStats>;
}

const CacheContext = createContext<CacheContextType | null>(null);

interface CacheProviderProps {
  children: ReactNode;
}

export function CacheProvider({ children }: CacheProviderProps) {
  useEffect(() => {
    // Preload cache on component mount (client-side only)
    if (typeof window !== 'undefined') {
      preloadCache().catch(error => {
        console.warn('Failed to preload cache:', error);
      });
    }
  }, []);

  const contextValue: CacheContextType = {
    preload: preloadCache,
    getStats: getCacheStats,
  };

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}

/**
 * Hook for prefetching data on hover or focus
 */
export function usePrefetch() {
  const prefetchArchivePage = async (page: number = 1, category?: string) => {
    try {
      const { getCachedAllQuotes, getCachedQuotesByCategory } = await import(
        '@/lib/utils/cache'
      );
      const quotesPerPage = 12;
      const offset = (page - 1) * quotesPerPage;

      if (category) {
        await getCachedQuotesByCategory(category);
      } else {
        await getCachedAllQuotes(quotesPerPage, offset);
      }
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  };

  const prefetchTodaysQuote = async () => {
    try {
      const { getCachedTodaysQuote } = await import('@/lib/utils/cache');
      await getCachedTodaysQuote();
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  };

  return {
    prefetchArchivePage,
    prefetchTodaysQuote,
  };
}
