import { render, screen } from '@testing-library/react'
import ArchiveLoading from './loading'

// Mock the Navigation component
jest.mock('@/components/layout/Navigation', () => {
  return function MockNavigation({ title, subtitle }: { title?: string; subtitle?: string }) {
    return (
      <div data-testid="navigation">
        <div data-testid="nav-title">{title || 'MOTIVE FILES'}</div>
        {subtitle && <div data-testid="nav-subtitle">{subtitle}</div>}
      </div>
    )
  }
})

describe('ArchiveLoading Component', () => {
  describe('Basic Rendering', () => {
    it('renders the loading page structure', () => {
      render(<ArchiveLoading />)
      
      // Check main container
      const container = document.querySelector('.min-h-screen')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('bg-black', 'relative', 'overflow-hidden')
    })

    it('renders navigation with correct props', () => {
      render(<ArchiveLoading />)
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument()
      expect(screen.getByTestId('nav-title')).toHaveTextContent('ARCHIVE')
      expect(screen.getByTestId('nav-subtitle')).toHaveTextContent('Archive')
    })

    it('renders background gradient overlay', () => {
      const { container } = render(<ArchiveLoading />)
      
      const gradientDiv = container.querySelector('.bg-gradient-radial')
      expect(gradientDiv).toBeInTheDocument()
      expect(gradientDiv).toHaveClass(
        'absolute',
        'inset-0',
        'bg-gradient-radial',
        'from-gray-900/50',
        'via-black/80',
        'to-black',
        'pointer-events-none',
        'gpu-accelerated'
      )
    })
  })

  describe('Hero Section Loading', () => {
    it('renders hero section loading skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      const heroSection = container.querySelector('section')
      expect(heroSection).toBeInTheDocument()
      expect(heroSection).toHaveClass('relative', 'z-10', 'py-12', 'px-4')
    })

    it('renders title loading skeleton', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check for title skeleton elements
      const titleSkeletons = container.querySelectorAll('.animate-pulse .h-16, .animate-pulse .h-20')
      expect(titleSkeletons.length).toBeGreaterThan(0)
    })

    it('renders description loading skeleton', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check for description skeleton
      const descriptionSkeleton = container.querySelector('.h-6.bg-gray-700\\/50')
      expect(descriptionSkeleton).toBeInTheDocument()
    })

    it('renders accent line skeleton', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check for accent line skeleton
      const accentLine = container.querySelector('.w-32.h-1.bg-gray-700\\/50')
      expect(accentLine).toBeInTheDocument()
    })
  })

  describe('Category Filter Loading', () => {
    it('renders category filter loading container', () => {
      const { container } = render(<ArchiveLoading />)
      
      const categoryContainer = container.querySelector('.bg-black\\/60.backdrop-blur-sm.border-accent\\/20')
      expect(categoryContainer).toBeInTheDocument()
      expect(categoryContainer).toHaveClass('rounded-xl', 'p-6', 'shadow-2xl')
    })

    it('renders category filter title skeleton', () => {
      const { container } = render(<ArchiveLoading />)
      
      const titleSkeleton = container.querySelector('.h-8.bg-gray-700\\/50.w-48')
      expect(titleSkeleton).toBeInTheDocument()
    })

    it('renders 6 category button skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      const categoryButtons = container.querySelectorAll('.h-12.bg-gray-700\\/50.w-32')
      expect(categoryButtons).toHaveLength(6)
    })
  })

  describe('Statistics Loading', () => {
    it('renders statistics loading container', () => {
      const { container } = render(<ArchiveLoading />)
      
      const statsContainer = container.querySelector('.bg-black\\/60.backdrop-blur-sm.border-accent\\/20.rounded-xl.p-8')
      expect(statsContainer).toBeInTheDocument()
    })

    it('renders statistics title skeleton', () => {
      const { container } = render(<ArchiveLoading />)
      
      const titleSkeleton = container.querySelector('.h-8.bg-gray-700\\/50.w-56')
      expect(titleSkeleton).toBeInTheDocument()
    })

    it('renders 3 statistics skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check for stats grid
      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-8')
      expect(statsGrid).toBeInTheDocument()
      
      // Check for 3 stat items (each has a number and label skeleton)
      const statNumbers = container.querySelectorAll('.h-12.bg-gray-700\\/50.w-20')
      const statLabels = container.querySelectorAll('.h-4.bg-gray-700\\/50.w-32')
      expect(statNumbers).toHaveLength(3)
      expect(statLabels).toHaveLength(3)
    })
  })

  describe('Quote Grid Loading', () => {
    it('renders quote grid loading container', () => {
      const { container } = render(<ArchiveLoading />)
      
      const quoteGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-8')
      expect(quoteGrid).toBeInTheDocument()
    })

    it('renders 6 quote card skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      const quoteCards = container.querySelectorAll('.bg-black\\/60.backdrop-blur-sm.border-accent\\/20.rounded-xl.p-6.shadow-2xl.animate-pulse')
      expect(quoteCards).toHaveLength(6)
    })

    it('renders quote card skeleton content', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Each quote card should have category, content lines, and metadata skeletons
      const categorySkeletons = container.querySelectorAll('.h-4.bg-gray-700\\/50.w-20')
      const contentLineSkeletons = container.querySelectorAll('.h-6.bg-gray-700\\/50')
      const metadataSkeletons = container.querySelectorAll('.h-4.bg-gray-700\\/50.w-24')
      const actionSkeletons = container.querySelectorAll('.h-8.bg-gray-700\\/50.w-16')
      
      expect(categorySkeletons.length).toBeGreaterThan(0)
      expect(contentLineSkeletons.length).toBeGreaterThan(0)
      expect(metadataSkeletons.length).toBeGreaterThan(0)
      expect(actionSkeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Pagination Loading', () => {
    it('renders pagination loading section', () => {
      const { container } = render(<ArchiveLoading />)
      
      const paginationSection = container.querySelector('.flex.justify-center.items-center.space-x-6.py-12')
      expect(paginationSection).toBeInTheDocument()
    })

    it('renders 3 pagination button skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Should have prev, current, and next button skeletons
      const paginationButtons = container.querySelectorAll('.animate-pulse .h-12.bg-gray-700\\/50')
      expect(paginationButtons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Animation Classes', () => {
    it('applies animation classes to containers', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check for staggered animation classes
      expect(container.querySelector('.slide-up.stagger-2')).toBeInTheDocument()
      expect(container.querySelector('.slide-up.stagger-3')).toBeInTheDocument()
      expect(container.querySelector('.slide-up.stagger-4')).toBeInTheDocument()
      expect(container.querySelector('.slide-up.stagger-5')).toBeInTheDocument()
    })

    it('applies animate-pulse to loading elements', () => {
      const { container } = render(<ArchiveLoading />)
      
      const pulsingElements = container.querySelectorAll('.animate-pulse')
      expect(pulsingElements.length).toBeGreaterThan(5) // Multiple sections have pulsing animations
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes to grid layouts', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check stats grid responsiveness
      const statsGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-3')
      expect(statsGrid).toBeInTheDocument()
      
      // Check quotes grid responsiveness
      const quotesGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-2')
      expect(quotesGrid).toBeInTheDocument()
    })

    it('applies responsive height classes to skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Check responsive height classes
      const responsiveHeights = container.querySelectorAll('.h-16.md\\:h-20, .h-20.md\\:h-24')
      expect(responsiveHeights.length).toBeGreaterThan(0)
    })
  })

  describe('Styling Consistency', () => {
    it('uses consistent card styling', () => {
      const { container } = render(<ArchiveLoading />)
      
      const cards = container.querySelectorAll('.bg-black\\/60.backdrop-blur-sm.border.border-accent\\/20.rounded-xl')
      expect(cards.length).toBeGreaterThan(0)
      
      cards.forEach(card => {
        expect(card).toHaveClass('shadow-2xl')
      })
    })

    it('uses consistent skeleton colors', () => {
      const { container } = render(<ArchiveLoading />)
      
      const skeletons = container.querySelectorAll('.bg-gray-700\\/50')
      expect(skeletons.length).toBeGreaterThan(10) // Many skeleton elements
    })

    it('uses backdrop-blur-sm consistently', () => {
      const { container } = render(<ArchiveLoading />)
      
      const blurredElements = container.querySelectorAll('.backdrop-blur-sm')
      expect(blurredElements.length).toBeGreaterThan(5)
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      render(<ArchiveLoading />)
      
      // Check for main content section
      const section = document.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('maintains proper heading hierarchy with skeletons', () => {
      const { container } = render(<ArchiveLoading />)
      
      // Even though they are skeletons, the structure should be logical
      const containers = container.querySelectorAll('.max-w-6xl.mx-auto')
      expect(containers.length).toBeGreaterThan(3) // Header, filters, stats, quotes
    })
  })
})