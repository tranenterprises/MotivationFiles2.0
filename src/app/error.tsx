'use client'

import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-800 border border-red-500 rounded-lg p-8">
            {/* Error Icon */}
            <div className="mb-6">
              <svg className="w-20 h-20 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              
              <h1 className="hero-text text-4xl md:text-6xl text-white mb-4">
                GRIND
                <span className="text-red-500 block">INTERRUPTED</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8">
                Something broke the flow, but champions adapt and overcome.
              </p>
            </div>

            {/* Error Details */}
            {error.message && (
              <details className="mb-8 text-left">
                <summary className="text-gray-400 cursor-pointer hover:text-gray-300 mb-4 text-center">
                  Technical Details (Click to expand)
                </summary>
                <div className="bg-gray-900 border border-gray-600 rounded p-4 text-sm text-gray-400 font-mono">
                  <div className="mb-2"><strong>Error:</strong> {error.message}</div>
                  {error.digest && (
                    <div><strong>Digest:</strong> {error.digest}</div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="bg-accent hover:bg-accent-dark text-white font-bold px-8 py-4 rounded-lg transition-colors duration-300 text-lg"
              >
                TRY AGAIN
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-8 py-4 rounded-lg transition-colors duration-300 text-lg"
              >
                GO HOME
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-500 text-white font-medium px-6 py-4 rounded-lg transition-colors duration-300"
              >
                REFRESH PAGE
              </button>
            </div>

            {/* Motivational Message */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-400 italic">
                "Obstacles don't have to stop you. If you run into a wall, don't turn around and give up. 
                Figure out how to climb it, go through it, or work around it."
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}