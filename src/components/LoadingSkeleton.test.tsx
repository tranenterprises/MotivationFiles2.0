import { render, screen } from '@testing-library/react'
import LoadingSkeleton from './LoadingSkeleton'

describe('LoadingSkeleton Component', () => {
  describe('Text Variant', () => {
    it('renders text skeleton by default', () => {
      const { container } = render(<LoadingSkeleton />)
      
      const textSkeleton = container.querySelector('.h-4.bg-gray-700.rounded.animate-pulse')
      expect(textSkeleton).toBeInTheDocument()
    })

    it('renders multiple text skeletons when count is specified', () => {
      const { container } = render(<LoadingSkeleton variant="text" count={3} />)
      
      const textSkeletons = container.querySelectorAll('.h-4.bg-gray-700.rounded.animate-pulse')
      expect(textSkeletons).toHaveLength(3)
    })
  })

  describe('Button Variant', () => {
    it('renders button skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="button" />)
      
      const buttonSkeleton = container.querySelector('.h-10.bg-gray-700.rounded-lg.animate-pulse')
      expect(buttonSkeleton).toBeInTheDocument()
    })

    it('renders multiple button skeletons', () => {
      const { container } = render(<LoadingSkeleton variant="button" count={2} />)
      
      const buttonSkeletons = container.querySelectorAll('.h-10.bg-gray-700.rounded-lg.animate-pulse')
      expect(buttonSkeletons).toHaveLength(2)
    })
  })

  describe('Quote Card Variant', () => {
    it('renders quote card skeleton with default medium size', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" />)
      
      // Check for quote card container
      const cardContainer = container.querySelector('.bg-gray-800.border.border-gray-600.rounded-lg')
      expect(cardContainer).toBeInTheDocument()
      
      // Check for fade-in animation
      const fadeInContainer = container.querySelector('.fade-in')
      expect(fadeInContainer).toBeInTheDocument()
    })

    it('renders quote card skeleton with small size', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" size="small" />)
      
      const cardContainer = container.querySelector('.p-4')
      expect(cardContainer).toBeInTheDocument()
    })

    it('renders quote card skeleton with large size', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" size="large" />)
      
      const cardContainer = container.querySelector('.p-8')
      expect(cardContainer).toBeInTheDocument()
    })

    it('includes all quote card skeleton elements', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" />)
      
      // Category and date skeletons
      const categoryDateSection = container.querySelector('.mb-6')
      expect(categoryDateSection).toBeInTheDocument()
      
      // Quote text lines
      const quoteLines = container.querySelectorAll('.space-y-3 .h-6.bg-gray-700.rounded')
      expect(quoteLines.length).toBeGreaterThan(0)
      
      // Audio button placeholder
      const audioButton = container.querySelector('.w-10.h-10.bg-gray-700.rounded-full')
      expect(audioButton).toBeInTheDocument()
    })

    it('renders multiple quote card skeletons', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" count={3} />)
      
      const fadeInContainers = container.querySelectorAll('.fade-in')
      expect(fadeInContainers).toHaveLength(3)
    })
  })

  describe('Quote Grid Variant', () => {
    it('renders quote grid skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="quote-grid" />)
      
      // Check for grid container
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-6')
      expect(gridContainer).toBeInTheDocument()
      
      // Should contain 6 quote card skeletons
      const fadeInContainers = container.querySelectorAll('.fade-in')
      expect(fadeInContainers).toHaveLength(6)
    })

    it('ignores count parameter for quote-grid (always shows 6)', () => {
      const { container } = render(<LoadingSkeleton variant="quote-grid" count={3} />)
      
      // Should still show 6 items regardless of count (6 items in the grid container)
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-6')
      const fadeInContainers = gridContainer?.querySelectorAll('.fade-in')
      expect(fadeInContainers).toHaveLength(6)
    })
  })

  describe('Animation and Styling', () => {
    it('applies pulse animation to all skeleton elements', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" />)
      
      const animatedElements = container.querySelectorAll('.animate-pulse')
      expect(animatedElements.length).toBeGreaterThan(0)
    })

    it('uses consistent gray color scheme', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" />)
      
      const grayElements = container.querySelectorAll('.bg-gray-700, .bg-gray-800')
      expect(grayElements.length).toBeGreaterThan(0)
    })
  })

  describe('Default Behavior', () => {
    it('defaults to text variant when no variant specified', () => {
      const { container } = render(<LoadingSkeleton />)
      
      const textSkeleton = container.querySelector('.h-4.bg-gray-700.rounded.animate-pulse')
      expect(textSkeleton).toBeInTheDocument()
    })

    it('defaults to count of 1 when no count specified', () => {
      const { container } = render(<LoadingSkeleton variant="text" />)
      
      const textSkeletons = container.querySelectorAll('.h-4.bg-gray-700.rounded.animate-pulse')
      expect(textSkeletons).toHaveLength(1)
    })

    it('defaults to medium size when no size specified', () => {
      const { container } = render(<LoadingSkeleton variant="quote-card" />)
      
      const mediumSizeContainer = container.querySelector('.p-6')
      expect(mediumSizeContainer).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero count gracefully', () => {
      const { container } = render(<LoadingSkeleton variant="text" count={0} />)
      
      const textSkeletons = container.querySelectorAll('.h-4.bg-gray-700.rounded.animate-pulse')
      expect(textSkeletons).toHaveLength(0)
    })

    it('handles invalid variant gracefully (falls back to text)', () => {
      // @ts-ignore - Testing invalid variant
      const { container } = render(<LoadingSkeleton variant="invalid" />)
      
      const textSkeleton = container.querySelector('.h-4.bg-gray-700.rounded.animate-pulse')
      expect(textSkeleton).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('quote-grid applies responsive grid classes', () => {
      const { container } = render(<LoadingSkeleton variant="quote-grid" />)
      
      const gridContainer = container.querySelector('.grid-cols-1.md\\:grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })
  })
})