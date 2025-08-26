'use client'

import { useState } from 'react'
import { Quote } from '@/lib/types'
import LoadingSpinner from './LoadingSpinner'
import { formatQuoteDate, formatDuration } from '@/lib/date'

interface QuoteCardProps {
  quote: Quote
  showAudio?: boolean
  size?: 'small' | 'medium' | 'large'
  onAudioPlay?: () => void
  isLoading?: boolean
}

export default function QuoteCard({ 
  quote, 
  showAudio = true, 
  size = 'large',
  onAudioPlay,
  isLoading = false
}: QuoteCardProps) {
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  const sizeClasses = {
    small: {
      container: 'p-4',
      quote: 'text-lg md:text-xl',
      category: 'text-xs',
      date: 'text-xs',
      audioButton: 'p-2 w-6 h-6'
    },
    medium: {
      container: 'p-6',
      quote: 'text-xl md:text-2xl',
      category: 'text-sm',
      date: 'text-sm',
      audioButton: 'p-3 w-7 h-7'
    },
    large: {
      container: 'p-8',
      quote: 'text-2xl md:text-3xl lg:text-4xl',
      category: 'text-sm',
      date: 'text-sm',
      audioButton: 'p-4 w-8 h-8'
    }
  }

  const classes = sizeClasses[size]

  const handleAudioClick = async () => {
    if (onAudioPlay && !isAudioLoading) {
      setIsAudioLoading(true)
      try {
        await onAudioPlay()
      } finally {
        setIsAudioLoading(false)
      }
    }
  }

  return (
    <div className="fade-in">
      <div className={`bg-gray-800 border border-gray-600 rounded-lg ${classes.container} hover:border-accent transition-colors duration-300 group`}>
        <div className="mb-6">
          <p className={`uppercase tracking-wide text-accent font-semibold mb-2 ${classes.category}`}>
            {quote.category}
          </p>
          <p className={`text-gray-300 ${classes.date}`}>
            {formatQuoteDate(quote.date_created, size)}
          </p>
        </div>
        
        <blockquote className={`quote-text text-white leading-tight mb-8 ${classes.quote}`}>
          "{quote.content}"
        </blockquote>
        
        <div className="flex items-center justify-between">
          {showAudio && quote.audio_url && (
            <button
              onClick={handleAudioClick}
              disabled={isAudioLoading}
              className={`bg-gray-700 rounded-full hover:bg-accent transition-colors duration-300 cursor-pointer flex items-center justify-center group-hover:scale-105 transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${classes.audioButton}`}
              aria-label="Play audio"
            >
              {isAudioLoading ? (
                <LoadingSpinner size="small" className="text-white" />
              ) : (
                <svg className={`text-white fill-current ${classes.audioButton}`} viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          )}
          
          <div className={`text-gray-400 ml-auto ${classes.date}`}>
            #{quote.id.slice(-6).toUpperCase()}
          </div>
        </div>

        {quote.audio_duration && (
          <div className={`text-gray-500 mt-4 ${classes.date}`}>
            Duration: {formatDuration(quote.audio_duration)}
          </div>
        )}
      </div>
    </div>
  )
}