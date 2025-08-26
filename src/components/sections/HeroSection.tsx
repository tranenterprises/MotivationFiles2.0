'use client'

import { useState, useRef } from 'react'
import { Quote } from '@/lib/types/types'
import AudioPlayer from '@/components/media/AudioPlayer'
import FallbackContent from '@/components/content/FallbackContent'
import HeroFallback from '@/components/sections/HeroFallback'
import { formatDate } from '@/lib/utils/date'

interface HeroSectionProps {
  quote: Quote | null
  hasError?: boolean
}

export default function HeroSection({ quote, hasError = false }: HeroSectionProps) {
  const [highlightedWords, setHighlightedWords] = useState<number[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  
  // Handle fallback cases
  if (hasError) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center section-spacing relative overflow-hidden critical-render">
        <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black/80 to-black pointer-events-none gpu-accelerated" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
          <FallbackContent type="loading-error" onRetry={() => {
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
          }} />
        </div>
      </main>
    )
  }

  if (!quote) {
    return <HeroFallback />
  }
  
  const words = quote.content.split(' ')
  
  const updateHighlightedWords = (currentTime: number) => {
    if (quote.audio_duration && currentTime > 0) {
      const progress = currentTime / quote.audio_duration
      const wordsToHighlight = Math.floor(progress * words.length)
      
      // Create a wave effect for highlighting
      const activeRange = 3
      const startIndex = Math.max(0, wordsToHighlight - activeRange)
      const endIndex = Math.min(words.length, wordsToHighlight + activeRange)
      
      const newHighlighted = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i)
      setHighlightedWords(newHighlighted)
    }
  }

  const handlePlay = () => {
    // Audio is playing - we can add additional logic here if needed
  }

  const handlePause = () => {
    // Audio is paused - we can add additional logic here if needed
  }

  const handleTimeUpdate = (currentTime: number) => {
    updateHighlightedWords(currentTime)
  }

  const handleEnded = () => {
    setHighlightedWords([])
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center section-spacing relative overflow-hidden critical-render">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black/80 to-black pointer-events-none gpu-accelerated" />
      
      {/* Category Badge */}
      <div className="relative z-10 mb-6 md:mb-8 scale-in-bounce stagger-1 will-change-transform">
        <div className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 bg-accent/20 border border-accent/30 rounded-full backdrop-blur-sm hover-glow gpu-accelerated">
          <div className="w-2 h-2 bg-accent rounded-full mr-2 md:mr-3 animate-pulse" />
          <span className="text-accent font-bold text-xs md:text-sm uppercase tracking-widest">
            {quote.category}
          </span>
        </div>
      </div>

      {/* Main Quote Display */}
      <div className="relative z-10 container-full text-center mb-8 md:mb-12 fade-in stagger-2 layout-stable">
        {/* Date at top */}
        <div className="mb-6 md:mb-8 slide-up stagger-1">
          <span className="text-sm md:text-base font-bold uppercase tracking-widest text-accent hover:text-accent-light transition-colors">
            {formatDate(quote.date_created, 'full')}
          </span>
        </div>
        
        <blockquote className="cinematic-text text-white mb-6 md:mb-8 px-4 md:px-8 gpu-accelerated">
          {words.map((word, index) => (
            <span
              key={index}
              className={`
                inline-block mx-1 md:mx-2 transition-all duration-500 ease-out will-change-transform
                ${highlightedWords.includes(index) 
                  ? 'text-white glow-text scale-105 font-bold gpu-accelerated' 
                  : 'text-gray-400 scale-100'
                }
              `}
            >
              {word}
            </span>
          ))}
        </blockquote>
        
        {/* Quote ID */}
        <div className="body-small text-gray-500 slide-up stagger-3">
          <span className="hover:text-accent transition-colors">#{quote.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* Audio Control Center */}
      {quote.audio_url && (
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 slide-up stagger-4">
          <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl hover-lift hover-glow layout-transition">
            <div className="text-center mb-4 md:mb-6">
              <h3 className="headline-text text-white mb-2 scale-in stagger-5">
                MOTIVATIONAL SPEECH
              </h3>
              <p className="body-small text-gray-400 fade-in stagger-5">
                Experience the full intensity with audio
              </p>
            </div>
            
            <div className="slide-up stagger-5">
              <AudioPlayer
                audioUrl={quote.audio_url}
                title={quote.category}
                duration={quote.audio_duration}
                size="large"
                preloadStrategy="metadata"
                className="w-full"
                audioRef={audioPlayerRef}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="relative z-10 mt-12 md:mt-16 text-center px-4 scale-in-bounce stagger-5">
        <p className="body-small text-gray-500 mb-4 fade-in">
          Want more motivation? Check out our archive
        </p>
        <a 
          href="/archive" 
          className="btn-secondary touch-target focus-ring group hover-lift"
        >
          View Archive
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </main>
  )
}