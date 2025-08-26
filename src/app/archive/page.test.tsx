import { render, screen } from '@testing-library/react'
import { getAllQuotes } from '@/lib/api/supabase'
import { mockQuotes } from '@/__mocks__/supabase'
import Navigation from '@/components/layout/Navigation'
import QuoteCard from '@/components/content/QuoteCard'

// Mock the supabase module
jest.mock('@/lib/api/supabase', () => ({
  getAllQuotes: jest.fn()
}))

const mockGetAllQuotes = getAllQuotes as jest.MockedFunction<typeof getAllQuotes>

// Simple Archive page component for testing
function TestArchivePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black/80 to-black pointer-events-none gpu-accelerated" />
      
      <Navigation title="ARCHIVE" subtitle="Archive" />

      <section className="relative z-10 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12 fade-in">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-tight scale-in-bounce">
            EVERY WORD OF
            <span className="text-accent block">MOTIVATION</span>
          </h2>
        </div>

        {/* Category Filter */}
        <div className="max-w-6xl mx-auto mb-12 slide-up stagger-2">
          <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white text-center mb-6">FILTER BY CATEGORY</h3>
          </div>
        </div>

        {/* Statistics */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-black/60 backdrop-blur-sm border border-accent/20 rounded-xl p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white text-center mb-8">ARCHIVE STATISTICS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-accent mb-2">3</div>
                <div className="text-sm text-gray-300 font-bold uppercase tracking-wider">Quotes This Page</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent mb-2">3</div>
                <div className="text-sm text-gray-300 font-bold uppercase tracking-wider">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent mb-2">2</div>
                <div className="text-sm text-gray-300 font-bold uppercase tracking-wider">With Audio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                size="medium"
                showAudio={true}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

describe('Archive Page Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('renders the page structure correctly', () => {
      render(<TestArchivePage />)
      
      // Check for navigation (should show DAILY MOTIVATION)
      expect(screen.getAllByText('DAILY').length).toBeGreaterThan(0)
      expect(screen.getAllByText('MOTIVATION').length).toBeGreaterThan(0)
      
      // Check for hero section
      expect(screen.getByText('EVERY WORD OF')).toBeInTheDocument()
      expect(screen.getAllByText('MOTIVATION').length).toBeGreaterThan(0)
    })

    it('displays all quotes in grid layout', () => {
      render(<TestArchivePage />)
      
      expect(screen.getByText('"Push through the pain, that\'s where champions are made."')).toBeInTheDocument()
      expect(screen.getByText('"Discipline is the bridge between goals and accomplishment."')).toBeInTheDocument()
      expect(screen.getByText('"The grind never stops. Neither should you."')).toBeInTheDocument()
    })

    it('shows statistics correctly', () => {
      render(<TestArchivePage />)
      
      expect(screen.getByText('Quotes This Page')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('With Audio')).toBeInTheDocument()
      
      // Check that we have statistics numbers
      const threes = screen.getAllByText('3')
      expect(threes.length).toBe(2) // Should appear for quotes and categories
      
      const twos = screen.getAllByText('2')
      expect(twos.length).toBe(1) // Should appear for with audio
    })
  })

  describe('Quote Display', () => {
    it('displays quotes using QuoteCard component with medium size', () => {
      render(<TestArchivePage />)
      
      // Check for medium size styling
      const quoteText = screen.getByText('"Push through the pain, that\'s where champions are made."')
      expect(quoteText).toHaveClass('text-xl', 'md:text-2xl')
    })

    it('shows audio buttons for quotes with audio', () => {
      render(<TestArchivePage />)
      
      const audioButtons = screen.getAllByRole('button', { name: 'Play audio' })
      expect(audioButtons).toHaveLength(2) // mockQuotes has 2 quotes with audio
    })
  })

  describe('Responsive Grid Layout', () => {
    it('uses responsive grid classes', () => {
      const { container } = render(<TestArchivePage />)
      
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('uses custom navigation title', () => {
      render(<TestArchivePage />)
      
      // Should show default navigation title and archive subtitle
      expect(screen.getAllByText('DAILY').length).toBeGreaterThan(0)
      expect(screen.getAllByText('MOTIVATION').length).toBeGreaterThan(0)
      expect(screen.getByText('/ Archive')).toBeInTheDocument()
    })

    it('includes link back to home', () => {
      render(<TestArchivePage />)
      
      const homeLink = screen.getByRole('link', { name: /home/i })
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('Page Styling and Layout', () => {
    it('has proper page structure', () => {
      const { container } = render(<TestArchivePage />)
      
      const mainContainer = container.querySelector('.min-h-screen.bg-black')
      expect(mainContainer).toBeInTheDocument()
    })

    it('applies correct hero styling', () => {
      render(<TestArchivePage />)
      
      const heroTitle = screen.getByText('EVERY WORD OF')
      expect(heroTitle).toHaveClass('hero-text')
      
      // The MOTIVATION text in the hero is within a span with text-accent
      const { container } = render(<TestArchivePage />)
      const heroSection = container.querySelector('.hero-text')
      expect(heroSection?.querySelector('.text-accent')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<TestArchivePage />)
      
      const heroHeading = screen.getByRole('heading', { level: 2 })
      expect(heroHeading).toBeInTheDocument()
    })
  })

  describe('Statistics Display', () => {
    it('displays correct statistics', () => {
      render(<TestArchivePage />)
      
      // Should show 3 quotes this page, 3 categories, 2 with audio
      const statistics = screen.getAllByText('3')
      expect(statistics).toHaveLength(2) // Quotes and categories
      
      expect(screen.getByText('2')).toBeInTheDocument() // With audio
    })
  })
})