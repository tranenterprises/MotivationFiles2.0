import { getCachedTodaysQuote } from '@/lib/utils/cache'
import { Quote } from '@/lib/types/types'
import QuoteCard from '@/components/content/QuoteCard'
import AudioPlayer from '@/components/media/AudioPlayer'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import FallbackContent from '@/components/content/FallbackContent'
import { formatDate } from '@/lib/utils/date'

async function TodaysQuote() {
  try {
    const quote: Quote | null = await getCachedTodaysQuote()
    
    if (!quote) {
      return <FallbackContent type="no-today-quote" />
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <QuoteCard quote={quote} size="large" showAudio={false} />
        
        {/* Dedicated Audio Player */}
        {quote.audio_url && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              <h4 className="text-white font-semibold text-lg">Audio Playback</h4>
            </div>
            <AudioPlayer
              audioUrl={quote.audio_url}
              title={`${quote.category} - ${formatDate(quote.date_created, 'title')}`}
              duration={quote.audio_duration}
              size="large"
              preloadStrategy="metadata"
              className="w-full"
            />
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error fetching today\'s quote:', error)
    return <FallbackContent type="loading-error" onRetry={() => window.location.reload()} />
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
