import { render, screen } from '@testing-library/react'
import Footer from '../layout/Footer'

describe('Footer Component', () => {
  describe('Basic Rendering', () => {
    it('renders footer title correctly', () => {
      render(<Footer />)
      
      expect(screen.getByText('DAILY')).toBeInTheDocument()
      expect(screen.getByText('MOTIVATION')).toBeInTheDocument()
    })

    it('renders motivational description', () => {
      render(<Footer />)
      
      expect(screen.getByText('Fueling greatness one quote at a time. Every word is designed to push you beyond your limits.')).toBeInTheDocument()
    })

    it('renders copyright notice', () => {
      render(<Footer />)
      
      expect(screen.getByText('© 2024 Daily Motivation Voice App. Powered by determination.')).toBeInTheDocument()
    })

    it('renders tech stack information', () => {
      render(<Footer />)
      
      expect(screen.getByText('Built with 💪 and Next.js')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('has proper footer element', () => {
      const { container } = render(<Footer />)
      
      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('applies correct layout classes', () => {
      const { container } = render(<Footer />)
      
      const footer = container.querySelector('footer')
      expect(footer).toHaveClass(
        'border-t',
        'border-gray-800',
        'bg-gray-800/30',
        'py-8',
        'px-4',
        'mt-16'
      )
    })

    it('has responsive layout classes', () => {
      const { container } = render(<Footer />)
      
      const bottomSection = container.querySelector('.flex.flex-col.md\\:flex-row')
      expect(bottomSection).toBeInTheDocument()
    })
  })

  describe('Content Styling', () => {
    it('applies accent color to title', () => {
      render(<Footer />)
      
      const dailyText = screen.getByText('DAILY')
      expect(dailyText).toHaveClass('text-accent')
    })

    it('applies proper text styling to description', () => {
      render(<Footer />)
      
      const description = screen.getByText(/Fueling greatness one quote at a time/)
      expect(description).toHaveClass('text-gray-400', 'text-sm', 'max-w-2xl', 'mx-auto')
    })

    it('applies proper styling to copyright text', () => {
      render(<Footer />)
      
      const copyright = screen.getByText(/© 2024 Daily Motivation Voice App/)
      expect(copyright).toHaveClass('text-gray-400', 'text-sm')
    })

    it('applies proper styling to tech stack text', () => {
      render(<Footer />)
      
      const techStack = screen.getByText(/Built with 💪 and Next.js/)
      expect(techStack).toHaveClass('text-gray-500', 'text-xs')
    })
  })

  describe('Responsive Design', () => {
    it('has responsive spacing classes', () => {
      const { container } = render(<Footer />)
      
      const bottomSection = container.querySelector('.space-y-4.md\\:space-y-0')
      expect(bottomSection).toBeInTheDocument()
    })

    it('has responsive alignment classes', () => {
      const { container } = render(<Footer />)
      
      const bottomSection = container.querySelector('.justify-between.items-center')
      expect(bottomSection).toBeInTheDocument()
    })
  })

  describe('Visual Hierarchy', () => {
    it('has proper heading structure', () => {
      render(<Footer />)
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass('text-xl', 'font-bold', 'text-white', 'mb-2')
    })

    it('has visual separator between sections', () => {
      const { container } = render(<Footer />)
      
      const separator = container.querySelector('.border-t.border-gray-700.pt-6')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('Container Structure', () => {
    it('has max-width container', () => {
      const { container } = render(<Footer />)
      
      const maxWidthContainer = container.querySelector('.max-w-6xl.mx-auto')
      expect(maxWidthContainer).toBeInTheDocument()
    })

    it('has centered content layout', () => {
      const { container } = render(<Footer />)
      
      const centeredContent = container.querySelector('.text-center.mb-6')
      expect(centeredContent).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      const { container } = render(<Footer />)
      
      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('has proper heading hierarchy', () => {
      render(<Footer />)
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })

    it('has readable text contrast', () => {
      render(<Footer />)
      
      // Main title should be white for good contrast on dark background
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveClass('text-white')
      
      // Secondary text should be appropriately grayed
      const description = screen.getByText(/Fueling greatness/)
      expect(description).toHaveClass('text-gray-400')
    })
  })

  describe('Brand Consistency', () => {
    it('matches the header branding style', () => {
      render(<Footer />)
      
      // Should have consistent "DAILY MOTIVATION" branding
      const dailyText = screen.getByText('DAILY')
      const motivationText = screen.getByText('MOTIVATION')
      
      expect(dailyText).toHaveClass('text-accent')
      expect(motivationText).toBeInTheDocument()
    })

    it('maintains motivational messaging tone', () => {
      render(<Footer />)
      
      // Check for motivational language
      expect(screen.getByText(/Fueling greatness/)).toBeInTheDocument()
      expect(screen.getByText(/push you beyond your limits/)).toBeInTheDocument()
      expect(screen.getByText(/Powered by determination/)).toBeInTheDocument()
    })
  })

  describe('Visual Design Elements', () => {
    it('includes emoji in tech stack for personality', () => {
      render(<Footer />)
      
      expect(screen.getByText(/Built with 💪/)).toBeInTheDocument()
    })

    it('has subtle background styling', () => {
      const { container } = render(<Footer />)
      
      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('bg-gray-800/30') // Semi-transparent background
    })

    it('has border styling for visual separation', () => {
      const { container } = render(<Footer />)
      
      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('border-t', 'border-gray-800')
    })
  })
})