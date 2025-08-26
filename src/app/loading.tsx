import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import Navigation from '@/components/layout/Navigation'

export default function Loading() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-700 rounded w-3/4 mx-auto mb-6"></div>
            <div className="h-6 bg-gray-700 rounded w-2/3 mx-auto"></div>
          </div>
        </div>

        {/* Today's Quote Loading */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-700 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <LoadingSkeleton variant="quote-card" size="large" />
          </div>
        </div>
      </section>

    </div>
  )
}