import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation title="QUOTE ARCHIVE" subtitle="Archive" />

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded w-2/3 mx-auto mb-4"></div>
            <div className="h-5 bg-gray-700 rounded w-3/4 mx-auto"></div>
          </div>
        </div>

        {/* Category Filter Loading */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="flex flex-wrap gap-2 justify-center animate-pulse">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded-lg w-24"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Loading */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-gray-700 rounded w-16 mx-auto"></div>
                  <div className="h-4 bg-gray-700 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quote Grid Loading */}
        <div className="max-w-6xl mx-auto">
          <LoadingSkeleton variant="quote-grid" />
        </div>
      </section>

      <Footer />
    </div>
  )
}