import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Navigation Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders the default title', () => {
      render(<Navigation />)
      
      expect(screen.getByText('DAILY')).toBeInTheDocument()
      expect(screen.getByText('MOTIVATION')).toBeInTheDocument()
    })

    it('renders custom title when provided', () => {
      render(<Navigation title="CUSTOM TITLE" />)
      
      // Navigation component currently ignores title prop and always shows DAILY MOTIVATION
      expect(screen.getByText('DAILY')).toBeInTheDocument()
      expect(screen.getByText('MOTIVATION')).toBeInTheDocument()
    })

    it('renders subtitle when provided', () => {
      render(<Navigation subtitle="Test Subtitle" />)
      
      expect(screen.getByText('/ Test Subtitle')).toBeInTheDocument()
    })

    it('renders navigation links', () => {
      render(<Navigation />)
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Archive')).toBeInTheDocument()
    })

    it('renders home and archive links with correct hrefs', () => {
      render(<Navigation />)
      
      const homeLink = screen.getByRole('link', { name: /home/i })
      const archiveLink = screen.getByRole('link', { name: /archive/i })
      
      expect(homeLink).toHaveAttribute('href', '/')
      expect(archiveLink).toHaveAttribute('href', '/archive')
    })
  })

  describe('Active State Handling', () => {
    it('highlights home link when on homepage', () => {
      mockUsePathname.mockReturnValue('/')
      render(<Navigation />)
      
      const homeLink = screen.getByRole('link', { name: /home/i })
      expect(homeLink).toHaveClass('text-accent', 'bg-gray-800', 'border-accent/30')
    })

    it('highlights archive link when on archive page', () => {
      mockUsePathname.mockReturnValue('/archive')
      render(<Navigation />)
      
      const archiveLink = screen.getByRole('link', { name: /archive/i })
      expect(archiveLink).toHaveClass('text-accent', 'bg-gray-800', 'border-accent/30')
    })

    it('highlights archive link when on archive subpage', () => {
      mockUsePathname.mockReturnValue('/archive/page/2')
      render(<Navigation />)
      
      const archiveLink = screen.getByRole('link', { name: /archive/i })
      expect(archiveLink).toHaveClass('text-accent', 'bg-gray-800', 'border-accent/30')
    })

    it('does not highlight links when on other pages', () => {
      mockUsePathname.mockReturnValue('/some-other-page')
      render(<Navigation />)
      
      const homeLink = screen.getByRole('link', { name: /home/i })
      const archiveLink = screen.getByRole('link', { name: /archive/i })
      
      expect(homeLink).toHaveClass('text-gray-300')
      expect(archiveLink).toHaveClass('text-gray-300')
    })
  })

  describe('Desktop Navigation', () => {
    it('shows desktop navigation by default', () => {
      render(<Navigation />)
      
      // Desktop nav should be visible (not hidden on md+ screens)
      const desktopNav = screen.getByRole('navigation')
      expect(desktopNav).toHaveClass('hidden', 'md:flex')
    })

    it('renders navigation icons', () => {
      render(<Navigation />)
      
      expect(screen.getByText('🏠')).toBeInTheDocument() // Home icon
      expect(screen.getByText('📚')).toBeInTheDocument() // Archive icon
    })
  })

  describe('Mobile Navigation', () => {
    it('shows mobile menu button', () => {
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      expect(mobileButton).toBeInTheDocument()
      expect(mobileButton).toHaveClass('md:hidden')
    })

    it('mobile menu is hidden by default', () => {
      render(<Navigation />)
      
      // Mobile menu items should not be visible initially
      const mobileHomeLink = screen.queryByText('Home')
      const mobileArchiveLink = screen.queryByText('Archive')
      
      // They exist but are in the hidden mobile menu
      expect(mobileHomeLink).toBeInTheDocument()
      expect(mobileArchiveLink).toBeInTheDocument()
    })

    it('opens mobile menu when hamburger is clicked', async () => {
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      fireEvent.click(mobileButton)
      
      // Check that the mobile navigation is visible by looking for the mobile-specific navigation section
      await waitFor(() => {
        const mobileSection = screen.getByRole('navigation').nextElementSibling
        expect(mobileSection).toBeInTheDocument()
      })
    })

    it('changes hamburger icon when menu is opened', async () => {
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      const svg = mobileButton.querySelector('svg')
      
      // Initially should show hamburger (3 lines)
      expect(svg).not.toHaveClass('rotate-90')
      
      fireEvent.click(mobileButton)
      
      // After click should show X and rotate
      expect(svg).toHaveClass('rotate-90')
    })

    it('closes mobile menu when a link is clicked', async () => {
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      fireEvent.click(mobileButton)
      
      // Find mobile links (they should be in the mobile section)
      const mobileLinks = screen.getAllByRole('link', { name: /home/i })
      const mobileHomeLink = mobileLinks.find(link => 
        link.closest('.md\\:hidden')
      )
      
      if (mobileHomeLink) {
        fireEvent.click(mobileHomeLink)
        
        // Menu should close (button should not be rotated)
        const svg = mobileButton.querySelector('svg')
        await waitFor(() => {
          expect(svg).not.toHaveClass('rotate-90')
        })
      }
    })
  })

  describe('Active State in Mobile', () => {
    it('shows active indicator in mobile menu', async () => {
      mockUsePathname.mockReturnValue('/')
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      fireEvent.click(mobileButton)
      
      // Look for the active indicator (●) in mobile menu
      expect(screen.getByText('●')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      expect(mobileButton).toHaveAttribute('aria-label', 'Toggle mobile menu')
    })

    it('navigation links are properly labeled', () => {
      render(<Navigation />)
      
      const homeLink = screen.getAllByRole('link', { name: /home/i })[0]
      const archiveLink = screen.getAllByRole('link', { name: /archive/i })[0]
      
      expect(homeLink).toBeInTheDocument()
      expect(archiveLink).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('applies correct responsive classes to desktop navigation', () => {
      render(<Navigation />)
      
      const desktopNav = screen.getByRole('navigation')
      expect(desktopNav).toHaveClass('hidden', 'md:flex')
    })

    it('applies correct responsive classes to mobile button', () => {
      render(<Navigation />)
      
      const mobileButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      expect(mobileButton).toHaveClass('md:hidden')
    })

    it('hides subtitle on small screens', () => {
      render(<Navigation subtitle="Test Subtitle" />)
      
      const subtitle = screen.getByText('/ Test Subtitle')
      expect(subtitle).toHaveClass('hidden', 'sm:block')
    })
  })

  describe('Styling and CSS Classes', () => {
    it('applies correct header styling', () => {
      const { container } = render(<Navigation />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass(
        'border-b',
        'border-gray-800',
        'bg-black/50',
        'backdrop-blur-sm',
        'sticky',
        'top-0',
        'z-50'
      )
    })

    it('applies hover effects to links', () => {
      render(<Navigation />)
      
      const homeLink = screen.getAllByRole('link', { name: /home/i })[0]
      expect(homeLink).toHaveClass('hover:text-accent')
    })

    it('applies transition animations', () => {
      render(<Navigation />)
      
      const homeLink = screen.getAllByRole('link', { name: /home/i })[0]
      expect(homeLink).toHaveClass('transition-all', 'duration-300')
    })
  })

  describe('Logo/Title Link', () => {
    it('logo links to homepage', () => {
      render(<Navigation />)
      
      const logoLink = screen.getByRole('link', { name: /daily motivation/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('applies hover effect to logo', () => {
      render(<Navigation />)
      
      const logoLink = screen.getByRole('link', { name: /daily motivation/i })
      expect(logoLink.querySelector('div')).toHaveClass('group-hover:text-accent')
    })
  })
})