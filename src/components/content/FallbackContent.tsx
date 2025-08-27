'use client';

import Link from 'next/link';
import { useState } from 'react';

interface FallbackContentProps {
  type:
    | 'no-today-quote'
    | 'empty-archive'
    | 'no-category-quotes'
    | 'loading-error';
  category?: string;
  showActions?: boolean;
  onRetry?: () => void;
}

// Static motivational quotes as fallback content when no quotes are available
const FALLBACK_QUOTES = [
  {
    content: 'Every champion was once a contender who refused to give up.',
    category: 'motivation',
    author: 'Rocky Balboa',
  },
  {
    content: 'The only impossible journey is the one you never begin.',
    category: 'wisdom',
    author: 'Tony Robbins',
  },
  {
    content:
      'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    category: 'discipline',
    author: 'Winston Churchill',
  },
  {
    content: "Don't wait for opportunity. Create it.",
    category: 'grindset',
    author: 'Unknown',
  },
  {
    content:
      'The best time to plant a tree was 20 years ago. The second best time is now.',
    category: 'reflection',
    author: 'Chinese Proverb',
  },
];

export default function FallbackContent({
  type,
  category,
  showActions = true,
  onRetry,
}: FallbackContentProps) {
  const [showInspiration, setShowInspiration] = useState(false);

  const getFallbackQuote = () => {
    if (category) {
      const categoryQuote = FALLBACK_QUOTES.find(q => q.category === category);
      if (categoryQuote) return categoryQuote;
    }
    // Return random quote if no category match
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  };

  const renderContent = () => {
    switch (type) {
      case 'no-today-quote':
        return (
          <div className="text-center fade-in">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Today's Quote is Coming
                </h2>
                <p className="text-lg text-gray-300 mb-4">
                  We're preparing today's daily motivation for you.
                </p>
                <p className="text-gray-400 mb-6">
                  Check back in a few minutes, or explore our archive of
                  previous quotes.
                </p>
              </div>

              {showActions && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/archive"
                      className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300 inline-block"
                    >
                      Browse Archive
                    </Link>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300"
                      >
                        Check Again
                      </button>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <button
                      onClick={() => setShowInspiration(!showInspiration)}
                      className="text-accent hover:text-accent-light font-medium transition-colors duration-300"
                    >
                      {showInspiration ? 'Hide' : 'Show'} Inspirational Quote
                    </button>

                    {showInspiration && (
                      <div className="mt-6 p-6 bg-gray-700 rounded-lg fade-in">
                        {(() => {
                          const quote = getFallbackQuote();
                          return (
                            <>
                              <blockquote className="text-xl text-white italic mb-4">
                                "{quote.content}"
                              </blockquote>
                              <cite className="text-gray-300 text-sm">
                                — {quote.author}
                              </cite>
                              <div className="mt-2 text-xs text-accent uppercase tracking-wide font-semibold">
                                {quote.category}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'empty-archive':
        return (
          <div className="text-center py-16">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Archive Building Soon
                </h2>
                <p className="text-gray-300 mb-6">
                  The archive is empty right now, but don't worry! Daily
                  motivational quotes will start appearing here once our content
                  generation begins.
                </p>
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    What to Expect:
                  </h3>
                  <ul className="text-gray-300 text-left space-y-2">
                    <li className="flex items-center">
                      <span className="text-accent mr-2">✓</span>
                      Daily motivational quotes across 5 categories
                    </li>
                    <li className="flex items-center">
                      <span className="text-accent mr-2">✓</span>
                      High-quality AI-generated voice narration
                    </li>
                    <li className="flex items-center">
                      <span className="text-accent mr-2">✓</span>
                      Searchable and filterable archive
                    </li>
                    <li className="flex items-center">
                      <span className="text-accent mr-2">✓</span>
                      Responsive design for all devices
                    </li>
                  </ul>
                </div>
              </div>

              {showActions && (
                <div className="space-y-4">
                  <Link
                    href="/"
                    className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300"
                  >
                    Back to Home
                  </Link>
                  {onRetry && (
                    <div>
                      <button
                        onClick={onRetry}
                        className="ml-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300"
                      >
                        Refresh Archive
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'no-category-quotes':
        return (
          <div className="text-center py-12">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-xl mx-auto">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No {category} Quotes Yet
                </h3>
                <p className="text-gray-300 mb-4">
                  We don't have any quotes in the "{category}" category yet, but
                  we're adding new content daily!
                </p>
              </div>

              {showActions && (
                <div className="space-y-3">
                  <Link
                    href="/archive"
                    className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-300 text-sm"
                  >
                    View All Categories
                  </Link>
                  {onRetry && (
                    <div>
                      <button
                        onClick={onRetry}
                        className="ml-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-300 text-sm"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'loading-error':
        return (
          <div className="text-center py-12">
            <div className="bg-gray-800 border border-red-500/50 rounded-lg p-6 max-w-xl mx-auto">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  Something Went Wrong
                </h3>
                <p className="text-gray-300 mb-4">
                  We're having trouble loading the content right now. Please try
                  again in a moment.
                </p>
              </div>

              {showActions && onRetry && (
                <div className="space-y-3">
                  <button
                    onClick={onRetry}
                    className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-300"
                  >
                    Try Again
                  </button>
                  <div>
                    <Link
                      href="/"
                      className="text-gray-400 hover:text-gray-300 underline text-sm"
                    >
                      Go to Homepage
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
}
