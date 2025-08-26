import { getTodaysQuote } from '@/lib/supabase'
import { Quote } from '@/lib/types'
import QuoteCard from '@/components/QuoteCard'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

async function TodaysQuote() {
  try {
    const quote: Quote | null = await getTodaysQuote()
    
    if (!quote) {
      return (
        <div className="text-center fade-in">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-4xl mx-auto">
            <p className="text-xl text-gray-300 mb-4">No quote available for today.</p>
            <p className="text-gray-400">Check back later or visit the archive for previous quotes.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto">
        <QuoteCard quote={quote} size="large" />
      </div>
    )
  } catch (error) {
    return (
      <div className="text-center fade-in">
        <div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-4xl mx-auto">
          <p className="text-xl text-red-400 mb-4">Error loading today's quote</p>
          <p className="text-gray-400">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="hero-text text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            FUEL YOUR
            <span className="text-accent block">GRIND</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Daily motivation delivered with the intensity you need to push through any obstacle.
          </p>
        </div>

        {/* Today's Quote */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
            TODAY'S <span className="text-accent">QUOTE</span>
          </h3>
          <TodaysQuote />
        </div>
      </section>

      <Footer />
    </div>
  )
}
