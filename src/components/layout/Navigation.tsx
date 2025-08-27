'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { usePrefetch } from '../providers/CacheProvider';

interface NavigationProps {
  title?: string;
  subtitle?: string;
}

export default function Navigation({
  title = 'MOTIVE FILES',
  subtitle,
}: NavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { prefetchArchivePage, prefetchTodaysQuote } = usePrefetch();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { href: '/', label: 'TODAY', prefetch: prefetchTodaysQuote },
    {
      href: '/archive',
      label: 'ARCHIVE',
      prefetch: () => prefetchArchivePage(1),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="relative border-b border-accent/20 bg-black/90 backdrop-blur-sm sticky top-0 z-50 overflow-hidden">
      {/* Background gradient overlay - matching hero section */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900/40 via-black/80 to-black pointer-events-none gpu-accelerated" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-3 group touch-target focus-ring"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                <div className="text-lg font-bold text-white group-hover:text-accent transition-all duration-500">
                  MOTIVE FILES
                </div>
              </div>
            </Link>
            {subtitle && (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-accent/60">•</span>
                <span className="body-small text-gray-400 font-bold uppercase tracking-wider">
                  {subtitle}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => item.prefetch()}
                onFocus={() => item.prefetch()}
                className={`
                  font-bold transition-all duration-500 flex items-center space-x-3 
                  px-6 py-3 rounded-lg border backdrop-blur-sm touch-target focus-ring
                  hover-lift hover-glow layout-transition
                  ${
                    isActive(item.href)
                      ? 'text-white bg-accent/20 border-accent/50 glow-text scale-105 gpu-accelerated'
                      : 'text-gray-300 bg-black/40 border-gray-700/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30'
                  }
                `}
              >
                <span className="body-small font-bold uppercase tracking-widest">
                  {item.label}
                </span>
                {isActive(item.href) && (
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-3 rounded-lg text-gray-300 hover:text-accent hover:bg-accent/10 border border-gray-700/50 hover:border-accent/30 transition-all duration-300 touch-target focus-ring hover-lift"
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transform transition-transform duration-500 ${
                isMobileMenuOpen ? 'rotate-180 scale-110' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-6 pb-4 border-t border-gray-700/50 slide-down">
            <nav className="flex flex-col space-y-3 pt-6">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={() => item.prefetch()}
                  onFocus={() => item.prefetch()}
                  className={`
                    font-bold transition-all duration-500 flex items-center space-x-4 
                    px-6 py-4 rounded-lg border backdrop-blur-sm touch-target focus-ring
                    hover-lift layout-transition scale-in-bounce
                    ${
                      isActive(item.href)
                        ? 'text-white bg-accent/20 border-accent/50 glow-text gpu-accelerated'
                        : 'text-gray-300 bg-black/40 border-gray-700/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30'
                    }
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="body-text font-bold uppercase tracking-widest flex-1">
                    {item.label}
                  </span>
                  {isActive(item.href) && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      <span className="body-small text-accent font-bold uppercase tracking-widest">
                        ACTIVE
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom accent glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </header>
  );
}
