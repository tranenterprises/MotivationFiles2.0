import Link from 'next/link';
import {
  getCachedAllQuotes,
  getCachedQuotesByCategory,
} from '@/lib/utils/cache';
import { Quote } from '@/lib/types/types';
import QuoteCard from '@/components/content/QuoteCard';
import Navigation from '@/components/layout/Navigation';
import FallbackContent from '@/components/content/FallbackContent';

interface ArchivePageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
}

async function QuoteArchive({
  page = 1,
  category,
}: {
  page: number;
  category: string | undefined;
}) {
  try {
    const quotesPerPage = 12;
    const offset = (page - 1) * quotesPerPage;

    let quotes: Quote[] = [];
    let hasNextPage = false;

    if (category) {
      // Use cached category-specific quotes
      const categoryQuotes = await getCachedQuotesByCategory(category);
      // Apply pagination to category results
      quotes = categoryQuotes.slice(offset, offset + quotesPerPage);
      hasNextPage = offset + quotesPerPage < categoryQuotes.length;
    } else {
      quotes = await getCachedAllQuotes(quotesPerPage, offset);
      hasNextPage = quotes.length === quotesPerPage;
    }

    if (quotes.length === 0 && page === 1) {
      if (category) {
        return (
          <FallbackContent type="no-category-quotes" category={category} />
        );
      }
      return <FallbackContent type="empty-archive" />;
    }

    return (
      <div className="space-y-12">
        {/* Stats */}
        <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-8 shadow-2xl hover-lift hover-glow layout-transition fade-in">
          <h3 className="text-lg font-bold text-white text-center mb-8 scale-in">
            ARCHIVE STATISTICS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="slide-up stagger-1">
              <div className="text-2xl font-bold text-accent mb-2">
                {quotes.length}
              </div>
              <div className="body-small text-gray-300 font-bold uppercase tracking-wider">
                Quotes This Page
              </div>
            </div>
            <div className="slide-up stagger-2">
              <div className="text-2xl font-bold text-accent mb-2">
                {new Set(quotes.map(q => q.category)).size}
              </div>
              <div className="body-small text-gray-300 font-bold uppercase tracking-wider">
                Categories
              </div>
            </div>
            <div className="slide-up stagger-3">
              <div className="text-2xl font-bold text-accent mb-2">
                {quotes.filter(q => q.audio_url).length}
              </div>
              <div className="body-small text-gray-300 font-bold uppercase tracking-wider">
                With Audio
              </div>
            </div>
          </div>
        </div>

        {/* Quote Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in stagger-2">
          {quotes.map((quote, index) => (
            <div
              key={quote.id}
              className="scale-in-bounce"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <QuoteCard quote={quote} size="medium" showAudio={true} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {(page > 1 || hasNextPage) && (
          <div className="flex justify-center items-center space-x-6 py-12 slide-up stagger-4">
            {page > 1 && (
              <Link
                href={`/archive?page=${page - 1}${category ? `&category=${category}` : ''}`}
                className="px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all duration-500 border backdrop-blur-sm touch-target focus-ring hover-lift layout-transition text-gray-300 bg-black/40 border-gray-700/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30"
              >
                ← PREVIOUS
              </Link>
            )}

            <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-lg px-6 py-4">
              <span className="text-sm text-accent font-bold uppercase tracking-wider">
                PAGE {page}
              </span>
            </div>

            {hasNextPage && (
              <Link
                href={`/archive?page=${page + 1}${category ? `&category=${category}` : ''}`}
                className="px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all duration-500 border backdrop-blur-sm touch-target focus-ring hover-lift layout-transition text-gray-300 bg-black/40 border-gray-700/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30"
              >
                NEXT →
              </Link>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <FallbackContent
        type="loading-error"
        onRetry={() => window.location.reload()}
      />
    );
  }
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const category = params.category;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient overlay - matching hero section */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black/80 to-black pointer-events-none gpu-accelerated" />

      <Navigation title="ARCHIVE" subtitle="Archive" />

      {/* Hero Section */}
      <section className="relative z-10 py-12 px-4 critical-render">
        <div className="max-w-6xl mx-auto text-center mb-12 fade-in">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-tight scale-in-bounce">
            EVERY WORD OF
            <span className="text-accent block">MOTIVATION</span>
          </h2>
          <p className="text-base md:text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed slide-up stagger-1">
            Browse through our complete collection of daily motivation quotes,
            organized chronologically with the latest inspiration first.
          </p>

          {/* Accent line */}
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mt-8 fade-in stagger-2" />
        </div>

        {/* Category Filter */}
        <div className="max-w-6xl mx-auto mb-12 slide-up stagger-2">
          <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-6 shadow-2xl hover-lift hover-glow layout-transition">
            <h3 className="text-lg font-bold text-white text-center mb-6 scale-in stagger-3">
              FILTER BY CATEGORY
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/archive"
                className={`px-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all duration-500 border backdrop-blur-sm touch-target focus-ring hover-lift layout-transition ${
                  !category
                    ? 'text-white bg-accent/20 border-accent/50 scale-105'
                    : 'text-gray-300 bg-black/40 border-gray-700/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30'
                }`}
              >
                All Categories
              </Link>
              {[
                'motivation',
                'wisdom',
                'grindset',
                'reflection',
                'discipline',
              ].map((cat, index) => (
                <Link
                  key={cat}
                  href={`/archive?category=${cat}`}
                  className={`px-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all duration-500 border backdrop-blur-sm touch-target focus-ring hover-lift layout-transition scale-in-bounce ${
                    category === cat
                      ? 'text-white bg-accent/20 border-accent/50 scale-105'
                      : 'text-gray-300 bg-black/40 border-gray-700/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30'
                  }`}
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quote Archive */}
        <div className="max-w-6xl mx-auto slide-up stagger-3">
          <QuoteArchive page={page} category={category} />
        </div>
      </section>
    </div>
  );
}
