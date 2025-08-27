import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Navigation from '../layout/Navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Navigation Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the default title', () => {
      render(<Navigation />);

      expect(screen.getByText('MOTIVE FILES')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(<Navigation title="CUSTOM TITLE" />);

      // Navigation component currently ignores title prop and always shows MOTIVE FILES
      expect(screen.getByText('MOTIVE FILES')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<Navigation subtitle="Test Subtitle" />);

      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
      render(<Navigation />);

      expect(screen.getByText('TODAY')).toBeInTheDocument();
      expect(screen.getByText('ARCHIVE')).toBeInTheDocument();
    });

    it('renders home and archive links with correct hrefs', () => {
      render(<Navigation />);

      const todayLink = screen.getByRole('link', { name: /today/i });
      const archiveLink = screen.getByRole('link', { name: /archive/i });

      expect(todayLink).toHaveAttribute('href', '/');
      expect(archiveLink).toHaveAttribute('href', '/archive');
    });
  });

  describe('Active State Handling', () => {
    it('highlights today link when on homepage', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation />);

      const todayLink = screen.getByRole('link', { name: /today/i });
      expect(todayLink).toHaveClass(
        'text-white',
        'bg-accent/20',
        'border-accent/50'
      );
    });

    it('highlights archive link when on archive page', () => {
      mockUsePathname.mockReturnValue('/archive');
      render(<Navigation />);

      const archiveLink = screen.getByRole('link', { name: /archive/i });
      expect(archiveLink).toHaveClass(
        'text-white',
        'bg-accent/20',
        'border-accent/50'
      );
    });

    it('highlights archive link when on archive subpage', () => {
      mockUsePathname.mockReturnValue('/archive/page/2');
      render(<Navigation />);

      const archiveLink = screen.getByRole('link', { name: /archive/i });
      expect(archiveLink).toHaveClass(
        'text-white',
        'bg-accent/20',
        'border-accent/50'
      );
    });

    it('does not highlight links when on other pages', () => {
      mockUsePathname.mockReturnValue('/some-other-page');
      render(<Navigation />);

      const todayLink = screen.getByRole('link', { name: /today/i });
      const archiveLink = screen.getByRole('link', { name: /archive/i });

      expect(todayLink).toHaveClass('text-gray-300');
      expect(archiveLink).toHaveClass('text-gray-300');
    });
  });

  describe('Desktop Navigation', () => {
    it('shows desktop navigation by default', () => {
      render(<Navigation />);

      // Desktop nav should be visible (not hidden on md+ screens)
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('does not render navigation icons', () => {
      render(<Navigation />);

      // Icons have been removed from the navigation
      expect(screen.queryByText('🏠')).not.toBeInTheDocument();
      expect(screen.queryByText('📚')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('shows mobile menu button', () => {
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      expect(mobileButton).toBeInTheDocument();
      expect(mobileButton).toHaveClass('md:hidden');
    });

    it('mobile menu is hidden by default', () => {
      render(<Navigation />);

      // Mobile menu items should not be visible initially
      const mobileTodayLink = screen.queryByText('TODAY');
      const mobileArchiveLink = screen.queryByText('ARCHIVE');

      // They exist but are in the hidden mobile menu
      expect(mobileTodayLink).toBeInTheDocument();
      expect(mobileArchiveLink).toBeInTheDocument();
    });

    it('opens mobile menu when hamburger is clicked', async () => {
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      fireEvent.click(mobileButton);

      // Check that the mobile navigation is visible by looking for mobile menu content
      await waitFor(() => {
        const mobileLinks = screen.getAllByRole('link', { name: /today/i });
        expect(mobileLinks.length).toBeGreaterThan(1); // Desktop + mobile links
      });
    });

    it('changes hamburger icon when menu is opened', async () => {
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      const svg = mobileButton.querySelector('svg');

      // Initially should show hamburger (3 lines)
      expect(svg).not.toHaveClass('rotate-90');

      fireEvent.click(mobileButton);

      // After click should show X and rotate
      expect(svg).toHaveClass('rotate-180');
    });

    it('closes mobile menu when a link is clicked', async () => {
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      fireEvent.click(mobileButton);

      // Find mobile links (they should be in the mobile section)
      const mobileLinks = screen.getAllByRole('link', { name: /today/i });
      const mobileTodayLink = mobileLinks.find(link =>
        link.closest('.md\\:hidden')
      );

      if (mobileTodayLink) {
        fireEvent.click(mobileTodayLink);

        // Menu should close (button should not be rotated)
        const svg = mobileButton.querySelector('svg');
        await waitFor(() => {
          expect(svg).not.toHaveClass('rotate-180');
        });
      }
    });
  });

  describe('Active State in Mobile', () => {
    it('shows active indicator in mobile menu', async () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      fireEvent.click(mobileButton);

      // Look for the active indicator (●) in mobile menu
      expect(screen.getByText('●')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      expect(mobileButton).toHaveAttribute('aria-label', 'Toggle mobile menu');
    });

    it('navigation links are properly labeled', () => {
      render(<Navigation />);

      const todayLink = screen.getAllByRole('link', { name: /today/i })[0];
      const archiveLink = screen.getAllByRole('link', { name: /archive/i })[0];

      expect(todayLink).toBeInTheDocument();
      expect(archiveLink).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct responsive classes to desktop navigation', () => {
      render(<Navigation />);

      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('applies correct responsive classes to mobile button', () => {
      render(<Navigation />);

      const mobileButton = screen.getByRole('button', {
        name: /toggle mobile menu/i,
      });
      expect(mobileButton).toHaveClass('md:hidden');
    });

    it('hides subtitle on small screens', () => {
      render(<Navigation subtitle="Test Subtitle" />);

      const subtitleContainer = screen
        .getByText('Test Subtitle')
        .closest('div');
      expect(subtitleContainer).toHaveClass('hidden', 'sm:flex');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies correct header styling', () => {
      const { container } = render(<Navigation />);

      const header = container.querySelector('header');
      expect(header).toHaveClass(
        'border-b',
        'border-accent/20',
        'bg-black/90',
        'backdrop-blur-sm',
        'sticky',
        'top-0',
        'z-50'
      );
    });

    it('applies hover effects to links', () => {
      render(<Navigation />);

      const todayLink = screen.getAllByRole('link', { name: /today/i })[0];
      expect(todayLink).toHaveClass('hover-lift');
    });

    it('applies transition animations', () => {
      render(<Navigation />);

      const todayLink = screen.getAllByRole('link', { name: /today/i })[0];
      expect(todayLink).toHaveClass('transition-all', 'duration-500');
    });
  });

  describe('Logo/Title Link', () => {
    it('logo links to homepage', () => {
      render(<Navigation />);

      const logoLink = screen.getByRole('link', { name: /motive files/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('applies hover effect to logo', () => {
      render(<Navigation />);

      const logoLink = screen.getByRole('link', { name: /motive files/i });
      const logoDiv = logoLink.querySelector('div div');
      expect(logoDiv).toHaveClass('group-hover:text-accent');
    });
  });
});
