import { render, screen, fireEvent } from '@testing-library/react'
import HeroFallback from '../HeroFallback'
import { formatDate } from '@/lib/utils/date'

// Mock the date utility
jest.mock('@/lib/utils/date', () => ({
  formatDate: jest.fn()
}))

const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn()
  },
  writable: true
})

describe('HeroFallback Component', () => {
  beforeEach(() => {
    mockFormatDate.mockReturnValue('MONDAY, JANUARY 15, 2024')
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders fallback quote content', () => {
      render(<HeroFallback />)
      
      // Should render one of the fallback quotes
      const quoteElements = [
        screen.queryByText(/EVERY CHAMPION WAS ONCE A CONTENDER/i),
        screen.queryByText(/THE ONLY IMPOSSIBLE JOURNEY/i),
        screen.queryByText(/SUCCESS IS NOT FINAL/i),
        screen.queryByText(/DON'T WAIT FOR OPPORTUNITY/i),
        screen.queryByText(/THE BEST TIME TO PLANT A TREE/i)
      ]
      
      const visibleQuote = quoteElements.find(element => element !== null)
      expect(visibleQuote).toBeInTheDocument()
    })

    it('renders category badge', () => {
      render(<HeroFallback />)
      
      // Should render one of the categories
      const categoryElements = [
        screen.queryByText('motivation'),
        screen.queryByText('wisdom'),
        screen.queryByText('discipline'),
        screen.queryByText('grindset'),
        screen.queryByText('reflection')
      ]
      
      const visibleCategory = categoryElements.find(element => element !== null)
      expect(visibleCategory).toBeInTheDocument()
    })

    it('renders formatted date', () => {
      render(<HeroFallback />)
      
      expect(mockFormatDate).toHaveBeenCalledWith(expect.any(String), 'full')
      expect(screen.getByText('MONDAY, JANUARY 15, 2024')).toBeInTheDocument()
    })

    it('renders fallback quote ID', () => {
      render(<HeroFallback />)
      
      // Should render a fallback ID (last 6 characters uppercase)
      const idElements = [
        screen.queryByText('#K-001'),
        screen.queryByText('#K-002'),
        screen.queryByText('#K-003'),
        screen.queryByText('#K-004'),
        screen.queryByText('#K-005')
      ]
      
      const visibleId = idElements.find(element => element !== null)
      expect(visibleId).toBeInTheDocument()
    })
  })

  describe('Status Message', () => {
    it('renders coming soon message', () => {
      render(<HeroFallback />)
      
      expect(screen.getByText("Today's Quote is Coming")).toBeInTheDocument()
      expect(screen.getByText("We're preparing today's daily motivation with full audio experience")).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('renders check again button', () => {
      render(<HeroFallback />)
      
      const checkAgainButton = screen.getByRole('button', { name: /check again/i })
      expect(checkAgainButton).toBeInTheDocument()
    })

    it('renders browse archive link', () => {
      render(<HeroFallback />)
      
      const archiveLinks = screen.getAllByRole('link', { name: /archive/i })
      expect(archiveLinks.length).toBeGreaterThan(0)
      
      const browseArchiveLink = archiveLinks.find(link => 
        link.textContent?.includes('Browse Archive')
      )
      expect(browseArchiveLink).toBeInTheDocument()
      expect(browseArchiveLink).toHaveAttribute('href', '/archive')
    })

    it('handles check again button click', () => {
      const mockReload = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(<HeroFallback />)
      
      const checkAgainButton = screen.getByRole('button', { name: /check again/i })
      fireEvent.click(checkAgainButton)
      
      expect(mockReload).toHaveBeenCalledTimes(1)
    })
  })

  describe('Quote Structure', () => {
    it('splits quote into individual words', () => {
      render(<HeroFallback />)
      
      // Each word should be wrapped in a span
      const wordSpans = screen.getByRole('main').querySelectorAll('blockquote span')
      expect(wordSpans.length).toBeGreaterThan(5) // Any fallback quote should have multiple words
    })

    it('applies correct styling to quote words', () => {
      render(<HeroFallback />)
      
      const wordSpans = screen.getByRole('main').querySelectorAll('blockquote span')
      wordSpans.forEach(span => {
        expect(span).toHaveClass('inline-block', 'mx-1', 'md:mx-2', 'text-gray-300')
      })
    })
  })

  describe('Layout and Styling', () => {
    it('renders with proper main container classes', () => {
      render(<HeroFallback />)
      
      const main = screen.getByRole('main')
      expect(main).toHaveClass(
        'min-h-screen',
        'flex',
        'flex-col',
        'justify-center',
        'items-center',
        'relative',
        'overflow-hidden'
      )
    })

    it('renders background gradient overlay', () => {
      const { container } = render(<HeroFallback />)
      
      const gradientDiv = container.querySelector('.bg-gradient-radial')
      expect(gradientDiv).toBeInTheDocument()
      expect(gradientDiv).toHaveClass(
        'absolute',
        'inset-0',
        'bg-gradient-radial',
        'from-gray-900/50',
        'via-black/80',
        'to-black'
      )
    })

    it('applies animation classes', () => {
      const { container } = render(<HeroFallback />)
      
      // Check for animation classes
      expect(container.querySelector('.scale-in-bounce')).toBeInTheDocument()
      expect(container.querySelector('.fade-in')).toBeInTheDocument()
      expect(container.querySelector('.slide-up')).toBeInTheDocument()
    })
  })

  describe('Category Badge', () => {
    it('renders category badge with correct styling', () => {
      render(<HeroFallback />)
      
      const categoryBadge = screen.getByText(/motivation|wisdom|discipline|grindset|reflection/).closest('div')
      expect(categoryBadge).toHaveClass(
        'inline-flex',
        'items-center',
        'px-3',
        'py-2',
        'md:px-4',
        'md:py-2',
        'bg-accent/20',
        'border',
        'border-accent/30',
        'rounded-full'
      )
    })

    it('renders pulsing dot in category badge', () => {
      const { container } = render(<HeroFallback />)
      
      const pulseDot = container.querySelector('.animate-pulse')
      expect(pulseDot).toBeInTheDocument()
      expect(pulseDot).toHaveClass('w-2', 'h-2', 'bg-accent', 'rounded-full')
    })
  })

  describe('Bottom CTA Section', () => {
    it('renders bottom call to action', () => {
      render(<HeroFallback />)
      
      expect(screen.getByText('In the meantime, enjoy this inspirational quote')).toBeInTheDocument()
    })

    it('renders view archive link with arrow', () => {
      render(<HeroFallback />)
      
      const viewArchiveLink = screen.getByRole('link', { name: /view archive/i })
      expect(viewArchiveLink).toBeInTheDocument()
      expect(viewArchiveLink).toHaveAttribute('href', '/archive')
      
      // Check for arrow SVG
      const svg = viewArchiveLink.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes to quote text', () => {
      render(<HeroFallback />)
      
      const blockquote = screen.getByRole('main').querySelector('blockquote')
      expect(blockquote).toHaveClass('px-4', 'md:px-8')
    })

    it('applies responsive classes to container spacing', () => {
      render(<HeroFallback />)
      
      const quoteContainer = screen.getByRole('main').querySelector('.container-full')
      expect(quoteContainer).toHaveClass('mb-8', 'md:mb-12')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML elements', () => {
      render(<HeroFallback />)
      
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('main').querySelector('blockquote')).toBeInTheDocument()
    })

    it('provides accessible button labels', () => {
      render(<HeroFallback />)
      
      const checkAgainButton = screen.getByRole('button', { name: /check again/i })
      expect(checkAgainButton).toBeInTheDocument()
    })

    it('provides accessible link labels', () => {
      render(<HeroFallback />)
      
      const archiveLinks = screen.getAllByRole('link')
      archiveLinks.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })
  })
})