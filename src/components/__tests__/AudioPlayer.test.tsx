import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import AudioPlayer from '../media/AudioPlayer';

// Mock the LoadingSpinner component
jest.mock('../ui/LoadingSpinner', () => {
  return function MockLoadingSpinner({ className }: { className?: string }) {
    return (
      <div data-testid="loading-spinner" className={className}>
        Loading...
      </div>
    );
  };
});

// Mock the HTML Audio API
const createMockAudio = () => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  canPlayType: jest.fn((format: string) => {
    if (format === 'audio/mpeg') return 'probably';
    if (format === 'audio/wav') return 'maybe';
    return '';
  }),
  currentTime: 0,
  duration: 60,
  paused: true,
  buffered: {
    length: 1,
    end: jest.fn().mockReturnValue(30),
  },
  preload: 'metadata',
  crossOrigin: null,
  src: '',
  volume: 1,
  muted: false,
  load: jest.fn(),
  readyState: 4, // HAVE_ENOUGH_DATA
});

let mockAudio = createMockAudio();

// Mock Audio constructor
const mockAudioConstructor = jest.fn().mockImplementation(() => mockAudio);

// Replace global Audio
Object.defineProperty(window, 'Audio', {
  writable: true,
  value: mockAudioConstructor,
});

const mockProps = {
  audioUrl: 'https://example.com/test-audio.mp3',
  title: 'Test Audio',
  duration: 60,
  size: 'medium' as const,
  preloadStrategy: 'metadata' as const,
};

describe('AudioPlayer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAudio = createMockAudio();
    mockAudioConstructor.mockImplementation(() => mockAudio);
  });

  describe('Basic Rendering', () => {
    it('renders play button when audio is paused', async () => {
      render(<AudioPlayer {...mockProps} />);

      // Simulate successful load
      const canPlayHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'canplay'
      )?.[1];

      if (canPlayHandler) {
        act(() => {
          canPlayHandler();
        });
      }

      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: /play audio/i });
        expect(playButton).toBeInTheDocument();
        expect(playButton).not.toBeDisabled();
      });
    });

    it('renders progress bar with correct structure', () => {
      render(<AudioPlayer {...mockProps} />);

      const progressBar = screen.getByRole('progressbar', {
        name: /audio progress/i,
      });
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '60');
    });

    it('displays time information correctly', () => {
      render(<AudioPlayer {...mockProps} />);

      // Should show 0:00 for current time and duration
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('displays title when provided', () => {
      render(<AudioPlayer {...mockProps} />);

      expect(screen.getByText('Test Audio')).toBeInTheDocument();
    });

    it('handles null audioUrl gracefully', () => {
      render(<AudioPlayer {...mockProps} audioUrl={null} />);

      expect(screen.getByText('No audio available')).toBeInTheDocument();
    });
  });

  describe('Audio Controls', () => {
    it('calls play when play button is clicked', async () => {
      render(<AudioPlayer {...mockProps} />);

      // Simulate audio ready state
      const canPlayHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'canplay'
      )?.[1];

      if (canPlayHandler) {
        act(() => {
          canPlayHandler();
        });
      }

      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: /play audio/i });
        expect(playButton).not.toBeDisabled();
      });

      const playButton = screen.getByRole('button', { name: /play audio/i });

      await act(async () => {
        fireEvent.click(playButton);
      });

      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('calls pause when pause button is clicked', async () => {
      mockAudio.paused = false;
      render(<AudioPlayer {...mockProps} />);

      // Wait for state to update
      await waitFor(() => {
        const pauseButton = screen.getByRole('button', {
          name: /pause audio/i,
        });
        expect(pauseButton).toBeInTheDocument();
      });

      const pauseButton = screen.getByRole('button', { name: /pause audio/i });

      await act(async () => {
        fireEvent.click(pauseButton);
      });

      expect(mockAudio.pause).toHaveBeenCalled();
    });

    it('shows loading spinner during audio loading', () => {
      render(<AudioPlayer {...mockProps} />);

      const playButton = screen.getByRole('button', { name: /play audio/i });

      act(() => {
        fireEvent.click(playButton);
      });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('handles play errors gracefully', async () => {
      const mockError = new Error('Playback failed');
      mockAudio.play.mockRejectedValue(mockError);
      const onError = jest.fn();

      render(<AudioPlayer {...mockProps} onError={onError} />);

      const playButton = screen.getByRole('button', { name: /play audio/i });

      await act(async () => {
        fireEvent.click(playButton);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Playback failed');
      });
    });
  });

  describe('Progress Bar Interaction', () => {
    it('seeks to correct time when progress bar is clicked', () => {
      render(<AudioPlayer {...mockProps} />);

      const progressBar = screen.getByRole('progressbar');

      // Mock getBoundingClientRect
      const mockRect = {
        left: 0,
        width: 200,
        getBoundingClientRect: jest.fn(),
      };

      Object.defineProperty(progressBar, 'getBoundingClientRect', {
        value: () => mockRect,
      });

      act(() => {
        fireEvent.click(progressBar, { clientX: 100 }); // Click at 50% width
      });

      // Should set currentTime to 50% of duration (30 seconds)
      expect(mockAudio.currentTime).toBe(30);
    });

    it('handles touch events on progress bar', () => {
      render(<AudioPlayer {...mockProps} />);

      const progressBar = screen.getByRole('progressbar');

      const mockRect = {
        left: 0,
        width: 200,
      };

      Object.defineProperty(progressBar, 'getBoundingClientRect', {
        value: () => mockRect,
      });

      act(() => {
        fireEvent.touchStart(progressBar, {
          touches: [{ clientX: 150 }],
        });
      });

      expect(mockAudio.currentTime).toBe(45); // 75% of 60 seconds
    });
  });

  describe('Size Variants', () => {
    it('applies correct classes for small size', () => {
      render(<AudioPlayer {...mockProps} size="small" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-8');
    });

    it('applies correct classes for medium size', () => {
      render(<AudioPlayer {...mockProps} size="medium" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10');
    });

    it('applies correct classes for large size', () => {
      render(<AudioPlayer {...mockProps} size="large" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Preload Strategy', () => {
    it('sets correct preload attribute for metadata strategy', () => {
      render(<AudioPlayer {...mockProps} preloadStrategy="metadata" />);

      expect(mockAudio.preload).toBe('metadata');
    });

    it('sets correct preload attribute for auto strategy', () => {
      render(<AudioPlayer {...mockProps} preloadStrategy="auto" />);

      expect(mockAudio.preload).toBe('auto');
    });

    it('sets correct preload attribute for none strategy', () => {
      render(<AudioPlayer {...mockProps} preloadStrategy="none" />);

      expect(mockAudio.preload).toBe('none');
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('checks audio format support', () => {
      mockAudio.canPlayType.mockImplementation((format: string) => {
        if (format === 'audio/mpeg') return 'probably';
        return '';
      });

      render(<AudioPlayer {...mockProps} />);

      expect(mockAudio.canPlayType).toHaveBeenCalledWith('audio/mpeg');
      expect(mockAudio.canPlayType).toHaveBeenCalledWith('audio/wav');
      expect(mockAudio.canPlayType).toHaveBeenCalledWith('audio/ogg');
    });

    it('handles unsupported audio formats', async () => {
      // Create a new mock with no format support
      const unsupportedMockAudio = {
        ...mockAudio,
        canPlayType: jest.fn().mockReturnValue(''),
      };
      mockAudioConstructor.mockImplementation(() => unsupportedMockAudio);

      render(<AudioPlayer {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Audio format not supported/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Event Handlers', () => {
    it('calls onPlay callback when audio starts playing', async () => {
      const onPlay = jest.fn();
      mockAudio.play.mockResolvedValue(undefined);

      render(<AudioPlayer {...mockProps} onPlay={onPlay} />);

      const playButton = screen.getByRole('button', { name: /play audio/i });

      await act(async () => {
        fireEvent.click(playButton);
      });

      await waitFor(() => {
        expect(onPlay).toHaveBeenCalled();
      });
    });

    it('calls onPause callback when audio is paused', async () => {
      const onPause = jest.fn();
      mockAudio.paused = false;

      render(<AudioPlayer {...mockProps} onPause={onPause} />);

      await waitFor(() => {
        const pauseButton = screen.getByRole('button', {
          name: /pause audio/i,
        });
        expect(pauseButton).toBeInTheDocument();
      });

      const pauseButton = screen.getByRole('button', { name: /pause audio/i });

      await act(async () => {
        fireEvent.click(pauseButton);
      });

      expect(onPause).toHaveBeenCalled();
    });

    it('calls onLoadProgress callback during loading', () => {
      const onLoadProgress = jest.fn();

      render(<AudioPlayer {...mockProps} onLoadProgress={onLoadProgress} />);

      // Simulate progress event
      const progressHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'progress'
      )?.[1];

      if (progressHandler) {
        act(() => {
          progressHandler();
        });

        expect(onLoadProgress).toHaveBeenCalledWith(30, 60);
      }
    });
  });

  describe('Error Handling', () => {
    it('displays error message when audio fails to load', () => {
      render(<AudioPlayer {...mockProps} />);

      // Simulate error event
      const errorHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorHandler) {
        act(() => {
          errorHandler(new Event('error'));
        });

        expect(screen.getByText(/Failed to load audio/i)).toBeInTheDocument();
      }
    });

    it('disables button when there is an error', () => {
      render(<AudioPlayer {...mockProps} />);

      // Simulate error event
      const errorHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorHandler) {
        act(() => {
          errorHandler(new Event('error'));
        });

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
      }
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly', () => {
      // Set currentTime to 90 seconds (1:30)
      mockAudio.currentTime = 90;
      mockAudio.duration = 180; // 3:00

      render(<AudioPlayer {...mockProps} duration={180} />);

      // Simulate timeupdate event
      const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'timeupdate'
      )?.[1];

      if (timeUpdateHandler) {
        act(() => {
          timeUpdateHandler();
        });
      }

      // Should show formatted times
      expect(screen.getByText('1:30')).toBeInTheDocument();
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const { unmount } = render(<AudioPlayer {...mockProps} />);

      unmount();

      expect(mockAudio.removeEventListener).toHaveBeenCalledWith(
        'loadedmetadata',
        expect.any(Function)
      );
      expect(mockAudio.removeEventListener).toHaveBeenCalledWith(
        'timeupdate',
        expect.any(Function)
      );
      expect(mockAudio.removeEventListener).toHaveBeenCalledWith(
        'ended',
        expect.any(Function)
      );
      expect(mockAudio.removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });

    it('pauses audio on unmount if playing', () => {
      mockAudio.paused = false;
      const { unmount } = render(<AudioPlayer {...mockProps} />);

      unmount();

      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });
});
