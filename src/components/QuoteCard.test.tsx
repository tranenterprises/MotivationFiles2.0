import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import QuoteCard from './QuoteCard'
import { Quote } from '@/lib/types'

// Mock the LoadingSpinner component
jest.mock('./LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>
  }
})

const mockQuote: Quote = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  date_created: '2024-01-15',
  content: 'Push through the pain, that\'s where champions are made.',
  category: 'motivation',
  audio_url: 'https://example.com/audio.mp3',
  audio_duration: 45,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

const mockQuoteWithoutAudio: Quote = {
  ...mockQuote,
  audio_url: null,
  audio_duration: null
}

describe('QuoteCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders quote content correctly', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      expect(screen.getByText('"Push through the pain, that\'s where champions are made."')).toBeInTheDocument()
      // Category text is rendered in lowercase but CSS makes it uppercase
      expect(screen.getByText('motivation')).toBeInTheDocument()
      // Check for the actual date that gets rendered (might have timezone differences)
      expect(screen.getByText(/January 1[4-5], 2024/)).toBeInTheDocument()
      expect(screen.getByText('#174000')).toBeInTheDocument()
    })

    it('renders category with uppercase CSS class', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      const categoryElement = screen.getByText('motivation')
      expect(categoryElement).toHaveClass('uppercase')
    })

    it('formats date correctly for large size', () => {
      render(<QuoteCard quote={mockQuote} size="large" />)
      
      // Check for the actual date that gets rendered (might have timezone differences)
      expect(screen.getByText(/January 1[4-5], 2024/)).toBeInTheDocument()
    })

    it('formats date correctly for small size', () => {
      render(<QuoteCard quote={mockQuote} size="small" />)
      
      // Small format shows abbreviated month
      expect(screen.getByText(/Jan 1[4-5], 2024/)).toBeInTheDocument()
    })
  })

  describe('Audio Functionality', () => {
    it('shows audio button when audio_url is present and showAudio is true', () => {
      render(<QuoteCard quote={mockQuote} showAudio={true} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      expect(audioButton).toBeInTheDocument()
    })

    it('hides audio button when audio_url is null', () => {
      render(<QuoteCard quote={mockQuoteWithoutAudio} showAudio={true} />)
      
      expect(screen.queryByRole('button', { name: 'Play audio' })).not.toBeInTheDocument()
    })

    it('hides audio button when showAudio is false', () => {
      render(<QuoteCard quote={mockQuote} showAudio={false} />)
      
      expect(screen.queryByRole('button', { name: 'Play audio' })).not.toBeInTheDocument()
    })

    it('calls onAudioPlay when audio button is clicked', async () => {
      const mockOnAudioPlay = jest.fn().mockResolvedValue(undefined)
      render(<QuoteCard quote={mockQuote} onAudioPlay={mockOnAudioPlay} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      fireEvent.click(audioButton)
      
      expect(mockOnAudioPlay).toHaveBeenCalledTimes(1)
    })

    it('shows loading spinner during audio loading', async () => {
      const mockOnAudioPlay = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<QuoteCard quote={mockQuote} onAudioPlay={mockOnAudioPlay} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      fireEvent.click(audioButton)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(audioButton).toBeDisabled()
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })

    it('disables button during loading', async () => {
      const mockOnAudioPlay = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<QuoteCard quote={mockQuote} onAudioPlay={mockOnAudioPlay} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      fireEvent.click(audioButton)
      
      expect(audioButton).toBeDisabled()
      
      await waitFor(() => {
        expect(audioButton).not.toBeDisabled()
      })
    })
  })

  describe('Audio Duration Display', () => {
    it('displays audio duration when available', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      expect(screen.getByText('Duration: 0:45')).toBeInTheDocument()
    })

    it('does not display duration when audio_duration is null', () => {
      render(<QuoteCard quote={mockQuoteWithoutAudio} />)
      
      expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument()
    })

    it('formats duration correctly for minutes and seconds', () => {
      const longQuote = { ...mockQuote, audio_duration: 125 } // 2:05
      render(<QuoteCard quote={longQuote} />)
      
      expect(screen.getByText('Duration: 2:05')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('applies correct classes for small size', () => {
      render(<QuoteCard quote={mockQuote} size="small" />)
      
      const quoteText = screen.getByText('"Push through the pain, that\'s where champions are made."')
      expect(quoteText).toHaveClass('text-lg', 'md:text-xl')
    })

    it('applies correct classes for medium size', () => {
      render(<QuoteCard quote={mockQuote} size="medium" />)
      
      const quoteText = screen.getByText('"Push through the pain, that\'s where champions are made."')
      expect(quoteText).toHaveClass('text-xl', 'md:text-2xl')
    })

    it('applies correct classes for large size', () => {
      render(<QuoteCard quote={mockQuote} size="large" />)
      
      const quoteText = screen.getByText('"Push through the pain, that\'s where champions are made."')
      expect(quoteText).toHaveClass('text-2xl', 'md:text-3xl', 'lg:text-4xl')
    })
  })

  describe('Quote ID Display', () => {
    it('displays last 6 characters of quote ID in uppercase', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      expect(screen.getByText('#174000')).toBeInTheDocument()
    })

    it('handles different ID formats', () => {
      const shortIdQuote = { ...mockQuote, id: 'abc123' }
      render(<QuoteCard quote={shortIdQuote} />)
      
      expect(screen.getByText('#ABC123')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for audio button', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      expect(audioButton).toHaveAttribute('aria-label', 'Play audio')
    })

    it('uses proper semantic HTML structure', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      const blockquote = screen.getByRole('blockquote')
      expect(blockquote).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles onAudioPlay errors gracefully', async () => {
      // Suppress console.error for this test since we're intentionally causing an error
      const originalError = console.error
      console.error = jest.fn()
      
      const mockOnAudioPlay = jest.fn().mockRejectedValue(new Error('Audio failed'))
      render(<QuoteCard quote={mockQuote} onAudioPlay={mockOnAudioPlay} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      
      // Click button - this will trigger an error
      fireEvent.click(audioButton)
      
      // Wait for the error to be handled and loading to stop
      await waitFor(() => {
        expect(audioButton).not.toBeDisabled()
      }, { timeout: 3000 })
      
      // Verify the function was called despite the error
      expect(mockOnAudioPlay).toHaveBeenCalledTimes(1)
      
      // Restore console.error
      console.error = originalError
    })

    it('prevents multiple simultaneous audio plays', async () => {
      const mockOnAudioPlay = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<QuoteCard quote={mockQuote} onAudioPlay={mockOnAudioPlay} />)
      
      const audioButton = screen.getByRole('button', { name: 'Play audio' })
      
      // Click multiple times rapidly
      fireEvent.click(audioButton)
      fireEvent.click(audioButton)
      fireEvent.click(audioButton)
      
      // Should only be called once
      expect(mockOnAudioPlay).toHaveBeenCalledTimes(1)
    })
  })

  describe('CSS Classes and Styling', () => {
    it('applies fade-in animation class', () => {
      const { container } = render(<QuoteCard quote={mockQuote} />)
      
      const fadeInDiv = container.querySelector('.fade-in')
      expect(fadeInDiv).toBeInTheDocument()
    })

    it('applies hover effects to the card', () => {
      const { container } = render(<QuoteCard quote={mockQuote} />)
      
      const card = container.querySelector('.hover\\:border-accent')
      expect(card).toBeInTheDocument()
    })

    it('applies accent color to category text', () => {
      render(<QuoteCard quote={mockQuote} />)
      
      // Category should be displayed with uppercase CSS class
      const categoryText = screen.getByText('motivation')
      expect(categoryText).toHaveClass('text-accent')
    })
  })
})