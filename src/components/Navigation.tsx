'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { usePrefetch } from './CacheProvider'

interface NavigationProps {
  title?: string
  subtitle?: string
}

export default function Navigation({ title = "DAILY MOTIVATION", subtitle }: NavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { prefetchArchivePage, prefetchTodaysQuote } = usePrefetch()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠', prefetch: prefetchTodaysQuote },
    { href: '/archive', label: 'Archive', icon: '📚', prefetch: () => prefetchArchivePage(1) },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="text-2xl font-bold text-white group-hover:text-accent transition-colors duration-300">
                <span className="text-accent">DAILY</span> MOTIVATION
              </div>
            </Link>
            {subtitle && (
              <span className="hidden sm:block text-gray-400 text-sm font-medium">
                / {subtitle}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => item.prefetch()}
                onFocus={() => item.prefetch()}
                className={`font-medium transition-all duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive(item.href)
                    ? 'text-accent bg-gray-800 border border-accent/30'
                    : 'text-gray-300 hover:text-accent hover:bg-gray-800/50'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-accent hover:bg-gray-800 transition-colors duration-300"
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transform transition-transform duration-300 ${
                isMobileMenuOpen ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-2 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={() => item.prefetch()}
                  onFocus={() => item.prefetch()}
                  className={`font-medium transition-all duration-300 flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isActive(item.href)
                      ? 'text-accent bg-gray-800 border border-accent/30'
                      : 'text-gray-300 hover:text-accent hover:bg-gray-800/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <span className="ml-auto text-xs text-accent">●</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}