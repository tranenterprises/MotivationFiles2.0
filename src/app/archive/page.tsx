import Link from 'next/link'
import { getCachedAllQuotes, getCachedQuotesByCategory } from '@/lib/cache'
import { Quote } from '@/lib/types'
import QuoteCard from '@/components/QuoteCard'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import FallbackContent from '@/components/FallbackContent'

interface ArchivePageProps {
  searchParams: {
    page?: string
    category?: string
  }
}

async function QuoteArchive({ page = 1, category }: { page: number, category?: string }) {
  try {
    const quotesPerPage = 12
    const offset = (page - 1) * quotesPerPage
    
    let quotes: Quote[] = []
    let hasNextPage = false
    
    if (category) {
      // Use cached category-specific quotes
      const categoryQuotes = await getCachedQuotesByCategory(category)
      // Apply pagination to category results
      quotes = categoryQuotes.slice(offset, offset + quotesPerPage)
      hasNextPage = offset + quotesPerPage < categoryQuotes.length
    } else {
      quotes = await getCachedAllQuotes(quotesPerPage, offset)
      hasNextPage = quotes.length === quotesPerPage
    }

    if (quotes.length === 0 && page === 1) {
      if (category) {
        return <FallbackContent type="no-category-quotes" category={category} />
      }
      return <FallbackContent type="empty-archive" />
    }


    return (
      <div className="space-y-8">
        {/* Stats */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">{quotes.length}</div>
              <div className="text-sm text-gray-300">Quotes This Page</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {new Set(quotes.map(q => q.category)).size}
              </div>
              <div className="text-sm text-gray-300">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {quotes.filter(q => q.audio_url).length}
              </div>
              <div className="text-sm text-gray-300">With Audio</div>
            </div>
          </div>
        </div>

        {/* Quote Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              size="medium"
              showAudio={true}
            />
          ))}
        </div>

        {/* Pagination */}
        {(page > 1 || hasNextPage) && (
          <div className="flex justify-center items-center space-x-4 py-8">
            {page > 1 && (
              <Link
                href={`/archive?page=${page - 1}${category ? `&category=${category}` : ''}`}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-accent transition-colors duration-300"
              >
                ← Previous
              </Link>
            )}
            
            <span className="text-gray-300 font-medium">
              Page {page}
            </span>
            
            {hasNextPage && (
              <Link
                href={`/archive?page=${page + 1}${category ? `&category=${category}` : ''}`}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-accent transition-colors duration-300"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <FallbackContent 
        type="loading-error" 
        onRetry={() => window.location.reload()} 
      />
    )
  }
}

export default function ArchivePage({ searchParams }: ArchivePageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const category = searchParams.category

  return (
    <div className="min-h-screen bg-black">
      <Navigation title="QUOTE ARCHIVE" subtitle="Archive" />

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="hero-text text-3xl md:text-5xl text-white mb-4 leading-tight">
            EVERY WORD OF
            <span className="text-accent block">MOTIVATION</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Browse through our complete collection of daily motivation quotes, 
            organized chronologically with the latest inspiration first.
          </p>
        </div>

        {/* Category Filter */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/archive"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                  !category 
                    ? 'bg-accent text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Categories
              </Link>
              {['motivation', 'wisdom', 'grindset', 'reflection', 'discipline'].map((cat) => (
                <Link
                  key={cat}
                  href={`/archive?category=${cat}`}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 capitalize ${
                    category === cat 
                      ? 'bg-accent text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quote Archive */}
        <div className="max-w-6xl mx-auto">
          <QuoteArchive page={page} category={category} />
        </div>
      </section>

      <Footer />
    </div>
  )
}