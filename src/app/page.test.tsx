import { render, screen } from '@testing-library/react'
import { getTodaysQuote } from '@/lib/supabase'
import { mockQuotes } from '@/__mocks__/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import QuoteCard from '@/components/QuoteCard'

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  getTodaysQuote: jest.fn()
}))

const mockGetTodaysQuote = getTodaysQuote as jest.MockedFunction<typeof getTodaysQuote>

// Simple Home page component for testing
function TestHomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="hero-text text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            FUEL YOUR
            <span className="text-accent block">GRIND</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Daily motivation delivered with the intensity you need to push through any obstacle.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
            TODAY'S <span className="text-accent">QUOTE</span>
          </h3>
          <div className="max-w-4xl mx-auto">
            <QuoteCard quote={mockQuotes[0]} size="large" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

describe('Home Page Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Page Layout and Structure', () => {
    it('renders the page structure correctly', () => {
      render(<TestHomePage />)
      
      // Check for navigation
      expect(screen.getByText('DAILY')).toBeInTheDocument()
      expect(screen.getByText('MOTIVATION')).toBeInTheDocument()
      
      // Check for hero section
      expect(screen.getByText('FUEL YOUR')).toBeInTheDocument()
      expect(screen.getByText('GRIND')).toBeInTheDocument()
      
      // Check for today's quote section
      expect(screen.getByText('TODAY\'S')).toBeInTheDocument()
      expect(screen.getByText('QUOTE')).toBeInTheDocument()
    })

    it('displays quote using QuoteCard component', () => {
      render(<TestHomePage />)
      
      expect(screen.getByText('"Push through the pain, that\'s where champions are made."')).toBeInTheDocument()
      expect(screen.getByText('MOTIVATION')).toBeInTheDocument()
      expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument()
    })

    it('shows audio button when quote has audio', () => {
      render(<TestHomePage />)
      
      expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument()
    })

    it('displays quote metadata correctly', () => {
      render(<TestHomePage />)
      
      expect(screen.getByText('#000001')).toBeInTheDocument()
      expect(screen.getByText('Duration: 0:45')).toBeInTheDocument()
    })
  })

  describe('Page Layout and Styling', () => {
    it('has proper page structure', () => {
      const { container } = render(<TestHomePage />)
      
      // Check for main container
      const mainContainer = container.querySelector('.min-h-screen.bg-black')
      expect(mainContainer).toBeInTheDocument()
      
      // Check for hero section
      const heroSection = container.querySelector('section')
      expect(heroSection).toBeInTheDocument()
    })

    it('applies correct styling classes to hero section', () => {
      render(<TestHomePage />)
      
      const heroTitle = screen.getByText('FUEL YOUR')
      expect(heroTitle).toHaveClass('hero-text')
      
      const grindText = screen.getByText('GRIND')
      expect(grindText).toHaveClass('text-accent')
    })

    it('has responsive design classes', () => {
      render(<TestHomePage />)
      
      const heroTitle = screen.getByText('FUEL YOUR')
      expect(heroTitle).toHaveClass('text-4xl', 'md:text-6xl', 'lg:text-7xl')
    })
  })

  describe('Navigation Integration', () => {
    it('includes navigation component', () => {
      render(<TestHomePage />)
      
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /archive/i })).toBeInTheDocument()
    })

    it('navigation links have correct hrefs', () => {
      render(<TestHomePage />)
      
      const archiveLink = screen.getByRole('link', { name: /archive/i })
      expect(archiveLink).toHaveAttribute('href', '/archive')
    })
  })

  describe('Footer Integration', () => {
    it('includes footer component', () => {
      render(<TestHomePage />)
      
      expect(screen.getByText('© 2024 Daily Motivation Voice App. Powered by determination.')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<TestHomePage />)
      
      // Main hero heading
      const heroHeading = screen.getByRole('heading', { level: 2 })
      expect(heroHeading).toBeInTheDocument()
      
      // Section heading
      const sectionHeading = screen.getByRole('heading', { level: 3 })
      expect(sectionHeading).toBeInTheDocument()
    })

    it('uses semantic blockquote for quotes', () => {
      render(<TestHomePage />)
      
      const blockquote = screen.getByRole('blockquote')
      expect(blockquote).toBeInTheDocument()
    })

    it('audio button has proper accessibility attributes', () => {
      render(<TestHomePage />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      expect(audioButton).toHaveAttribute('aria-label', 'Play audio')
    })
  })

  describe('Content Quality', () => {
    it('displays motivational messaging', () => {
      render(<TestHomePage />)
      
      expect(screen.getByText(/Daily motivation delivered with the intensity/)).toBeInTheDocument()
      expect(screen.getByText(/push through any obstacle/)).toBeInTheDocument()
    })

    it('maintains brand consistency', () => {
      render(<TestHomePage />)
      
      // Check for consistent "DAILY MOTIVATION" branding
      const brandElements = screen.getAllByText(/DAILY|MOTIVATION/)
      expect(brandElements.length).toBeGreaterThan(1)
    })
  })

  describe('Quote Card Integration', () => {
    it('uses QuoteCard component for displaying quote', () => {
      render(<TestHomePage />)
      
      // Check for QuoteCard specific elements
      expect(screen.getByText('"Push through the pain, that\'s where champions are made."')).toBeInTheDocument()
      expect(screen.getByText('MOTIVATION')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument()
    })

    it('passes correct props to QuoteCard', () => {
      render(<TestHomePage />)
      
      // Large size should be used (check for large text classes)
      const quoteText = screen.getByText('"Push through the pain, that\'s where champions are made."')
      expect(quoteText).toHaveClass('text-2xl', 'md:text-3xl', 'lg:text-4xl')
    })
  })
})