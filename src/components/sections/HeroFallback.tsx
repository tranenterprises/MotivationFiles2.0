'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';

// Static motivational quotes as fallback content
const FALLBACK_QUOTES = [
  {
    content: 'EVERY CHAMPION WAS ONCE A CONTENDER WHO REFUSED TO GIVE UP',
    category: 'motivation',
    id: 'fallback-001',
  },
  {
    content: 'THE ONLY IMPOSSIBLE JOURNEY IS THE ONE YOU NEVER BEGIN',
    category: 'wisdom',
    id: 'fallback-002',
  },
  {
    content:
      'SUCCESS IS NOT FINAL, FAILURE IS NOT FATAL: IT IS THE COURAGE TO CONTINUE THAT COUNTS',
    category: 'discipline',
    id: 'fallback-003',
  },
  {
    content: "DON'T WAIT FOR OPPORTUNITY. CREATE IT",
    category: 'grindset',
    id: 'fallback-004',
  },
  {
    content:
      'THE BEST TIME TO PLANT A TREE WAS 20 YEARS AGO. THE SECOND BEST TIME IS NOW',
    category: 'reflection',
    id: 'fallback-005',
  },
];

export default function HeroFallback() {
  // Select a random fallback quote
  const fallbackQuote =
    FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  const words = fallbackQuote.content.split(' ');
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
  });

  return (
    <main className="min-h-screen flex flex-col justify-center items-center section-spacing relative overflow-hidden critical-render">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black/80 to-black pointer-events-none gpu-accelerated" />

      {/* Category Badge */}
      <div className="relative z-10 mb-6 md:mb-8 scale-in-bounce stagger-1 will-change-transform">
        <div className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 bg-accent/20 border border-accent/30 rounded-full backdrop-blur-sm hover-glow gpu-accelerated">
          <div className="w-2 h-2 bg-accent rounded-full mr-2 md:mr-3 animate-pulse" />
          <span className="text-accent font-bold text-xs md:text-sm uppercase tracking-widest">
            {fallbackQuote.category}
          </span>
        </div>
      </div>

      {/* Main Quote Display */}
      <div className="relative z-10 container-full text-center mb-8 md:mb-12 fade-in stagger-2 layout-stable">
        {/* Date at top */}
        <div className="mb-6 md:mb-8 slide-up stagger-1">
          <span className="text-sm md:text-base font-bold uppercase tracking-widest text-accent hover:text-accent-light transition-colors">
            {formatDate(today, 'full')}
          </span>
        </div>

        <blockquote className="cinematic-text text-white mb-6 md:mb-8 px-4 md:px-8 gpu-accelerated">
          {words.map((word, index) => (
            <span
              key={index}
              className="inline-block mx-1 md:mx-2 text-gray-300 scale-100"
            >
              {word}
            </span>
          ))}
        </blockquote>

        {/* Quote ID */}
        <div className="body-small text-gray-500 slide-up stagger-3">
          <span className="hover:text-accent transition-colors">
            #{fallbackQuote.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* No Audio Message */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 slide-up stagger-4">
        <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl hover-lift hover-glow layout-transition">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 scale-in stagger-5">
              Today's Quote is Coming
            </h3>
            <p className="text-lg text-gray-400 fade-in stagger-5 mb-4">
              We're preparing today's daily motivation with full audio
              experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300"
              >
                Check Again
              </button>
              <Link
                href="/archive"
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300 inline-block text-center"
              >
                Browse Archive
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 mt-12 md:mt-16 text-center px-4 scale-in-bounce stagger-5">
        <p className="body-small text-gray-500 mb-4 fade-in">
          In the meantime, enjoy this inspirational quote
        </p>
        <a
          href="/archive"
          className="btn-secondary touch-target focus-ring group hover-lift"
        >
          View Archive
          <svg
            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </main>
  );
}
