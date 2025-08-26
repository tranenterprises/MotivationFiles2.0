import Navigation from '@/components/layout/Navigation'

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient overlay - matching hero section */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black/80 to-black pointer-events-none gpu-accelerated" />
      
      <Navigation title="ARCHIVE" subtitle="Archive" />

      {/* Hero Section */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12 fade-in">
          <div className="animate-pulse space-y-6">
            <div className="h-16 md:h-20 bg-gray-700/50 rounded-lg w-3/4 mx-auto backdrop-blur-sm"></div>
            <div className="h-6 bg-gray-700/50 rounded-lg w-5/6 mx-auto backdrop-blur-sm"></div>
            <div className="w-32 h-1 bg-gray-700/50 rounded mx-auto"></div>
          </div>
        </div>

        {/* Category Filter Loading */}
        <div className="max-w-6xl mx-auto mb-12 slide-up stagger-2">
          <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-6 shadow-2xl animate-pulse">
            <div className="h-8 bg-gray-700/50 rounded-lg w-48 mx-auto mb-6"></div>
            <div className="flex flex-wrap gap-3 justify-center">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-12 bg-gray-700/50 rounded-lg w-32 backdrop-blur-sm"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Loading */}
        <div className="max-w-6xl mx-auto mb-12 slide-up stagger-3">
          <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-8 shadow-2xl animate-pulse">
            <div className="h-8 bg-gray-700/50 rounded-lg w-56 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-12 bg-gray-700/50 rounded-lg w-20 mx-auto"></div>
                  <div className="h-4 bg-gray-700/50 rounded-lg w-32 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quote Grid Loading */}
        <div className="max-w-6xl mx-auto slide-up stagger-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-6 shadow-2xl animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-700/50 rounded w-20"></div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-700/50 rounded w-full"></div>
                    <div className="h-6 bg-gray-700/50 rounded w-4/5"></div>
                    <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-4 bg-gray-700/50 rounded w-24"></div>
                    <div className="h-8 bg-gray-700/50 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Loading */}
        <div className="flex justify-center items-center space-x-6 py-12 slide-up stagger-5">
          <div className="animate-pulse flex space-x-6">
            <div className="h-12 bg-gray-700/50 rounded-lg w-32 backdrop-blur-sm"></div>
            <div className="h-12 bg-gray-700/50 rounded-lg w-24 backdrop-blur-sm"></div>
            <div className="h-12 bg-gray-700/50 rounded-lg w-32 backdrop-blur-sm"></div>
          </div>
        </div>
      </section>

    </div>
  )
}