'use client';

import { useState, useRef, useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AudioPlayerProps {
  audioUrl: string | null;
  title?: string;
  duration?: number | null;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  preloadStrategy?: 'none' | 'metadata' | 'auto';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoadProgress?: (loaded: number, total: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>;
}

export default function AudioPlayer({
  audioUrl,
  title,
  duration,
  className = '',
  size = 'medium',
  preloadStrategy = 'metadata',
  onPlay,
  onPause,
  onEnded,
  onError,
  onLoadProgress,
  onTimeUpdate,
  audioRef: externalAudioRef,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
      progress: 'h-1',
      time: 'text-xs',
      container: 'gap-2',
    },
    medium: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      progress: 'h-2',
      time: 'text-sm',
      container: 'gap-3',
    },
    large: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      progress: 'h-3',
      time: 'text-base',
      container: 'gap-4',
    },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (!audioUrl) {
      setHasError(true);
      setErrorMessage('No audio URL provided');
      return;
    }

    const audio = new Audio();
    audioRef.current = audio;

    // Also set external ref if provided
    if (externalAudioRef) {
      externalAudioRef.current = audio;
    }

    // Cross-browser compatibility and preload settings
    audio.preload = preloadStrategy;
    audio.crossOrigin = 'anonymous';

    // Set supported audio formats for better browser compatibility
    if (audio.canPlayType) {
      const mp3Support = audio.canPlayType('audio/mpeg');
      const wavSupport = audio.canPlayType('audio/wav');
      const oggSupport = audio.canPlayType('audio/ogg');

      if (!mp3Support && !wavSupport && !oggSupport) {
        setHasError(true);
        setErrorMessage('Audio format not supported');
        return;
      }
    }

    audio.src = audioUrl;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const loaded = audio.buffered.end(audio.buffered.length - 1);
        const total = audio.duration;
        const progress = total ? (loaded / total) * 100 : 0;

        setLoadProgress(progress);
        onLoadProgress?.(loaded, total);

        // Consider it preloaded when we have enough buffer (25% or 30 seconds)
        const preloadThreshold = Math.min(0.25 * total, 30);
        if (loaded >= preloadThreshold) {
          setIsPreloaded(true);
        }
      }
    };

    const handleCanPlayThrough = () => {
      setIsPreloaded(true);
      setLoadProgress(100);
    };

    const handleTimeUpdate = () => {
      const currentAudioTime = audio.currentTime;
      setCurrentTime(currentAudioTime);
      onTimeUpdate?.(currentAudioTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setHasError(true);
      setErrorMessage('Failed to load audio');
      setIsLoading(false);
      setIsPlaying(false);
      onError?.('Failed to load audio');
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      // Cleanup
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);

      if (!audio.paused) {
        audio.pause();
      }
      audio.src = '';
    };
  }, [
    audioUrl,
    preloadStrategy,
    onEnded,
    onError,
    onLoadProgress,
    onTimeUpdate,
    externalAudioRef,
  ]);

  const togglePlayPause = async () => {
    if (!audioRef.current || hasError) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        setIsLoading(true);

        // Better mobile/iOS support - handle autoplay restrictions
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setIsLoading(false);
          onPlay?.();
        } else {
          // Fallback for older browsers
          setTimeout(() => {
            if (audioRef.current && !audioRef.current.paused) {
              setIsPlaying(true);
              setIsLoading(false);
              onPlay?.();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Playback failed';

      // Handle specific mobile browser errors
      if (
        errorMsg.includes('user interaction') ||
        errorMsg.includes('autoplay')
      ) {
        setErrorMessage('Tap to play audio');
      } else {
        setErrorMessage('Playback failed');
      }

      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
      onError?.(errorMsg);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || hasError) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * audioDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || hasError) return;

    e.preventDefault(); // Prevent scrolling on mobile

    const rect = progressRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const width = rect.width;
    const newTime = (touchX / width) * audioDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage =
    audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  if (!audioUrl) {
    return (
      <div
        className={`flex items-center justify-center p-4 text-gray-500 ${className}`}
      >
        <span className={config.time}>No audio available</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      {/* Play/Pause Button */}
      <div className="relative">
        {/* Preload progress ring */}
        {loadProgress > 0 &&
          loadProgress < 100 &&
          preloadStrategy !== 'none' && (
            <svg
              className={`absolute inset-0 ${config.button} transform -rotate-90`}
            >
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-accent opacity-30"
                strokeDasharray={`${loadProgress * 2.83} 283`}
              />
            </svg>
          )}

        <button
          onClick={togglePlayPause}
          disabled={isLoading || hasError}
          className={`
            ${config.button} 
            flex items-center justify-center
            bg-gradient-to-br from-gray-700 to-gray-800 hover:from-accent hover:to-accent-dark
            rounded-full transition-all duration-300 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-4 focus:ring-accent/30
            transform hover:scale-110 active:scale-95
            shadow-lg hover:shadow-xl hover:shadow-accent/25
            border-2 border-transparent hover:border-accent/50
            ${isPreloaded ? 'ring-2 ring-green-400/40 shadow-green-400/20' : ''}
            ${isPlaying ? 'bg-gradient-to-br from-accent to-accent-dark shadow-accent/30' : ''}
            touch-target
          `}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          title={
            isPreloaded ? 'Audio ready for fast playback' : 'Audio loading...'
          }
        >
          {isLoading ? (
            <LoadingSpinner size="small" className="text-white" />
          ) : hasError ? (
            <svg
              className={`${config.icon} text-red-400 fill-current`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
          ) : isPlaying ? (
            <svg
              className={`${config.icon} text-white fill-current`}
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              className={`${config.icon} text-white fill-current`}
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex-1">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onTouchStart={handleProgressTouch}
          className={`
            ${config.progress}
            bg-gray-700 rounded-full cursor-pointer group
            hover:bg-gray-600 transition-all duration-300 ease-out
            relative overflow-hidden touch-manipulation
            shadow-inner hover:shadow-lg
            border border-gray-600 hover:border-accent/50
            transform hover:scale-[1.02]
          `}
          role="progressbar"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={audioDuration}
          aria-label="Audio progress"
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Progress fill */}
          <div
            className={`
              ${config.progress} 
              bg-gradient-to-r from-accent via-accent-light to-accent
              rounded-full transition-all duration-300 ease-out
              shadow-sm
              relative overflow-hidden
            `}
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </div>

          {/* Progress indicator dot */}
          {progressPercentage > 0 && (
            <div
              className={`
                absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2
                w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-lg
                border-2 border-accent
                opacity-0 group-hover:opacity-100 transition-all duration-300
                pointer-events-none
              `}
              style={{ left: `${progressPercentage}%` }}
            />
          )}
        </div>

        {/* Time Display */}
        <div
          className={`flex justify-between items-center mt-2 ${config.time}`}
        >
          <span className="text-gray-300 font-mono tabular-nums bg-gray-800/50 px-2 py-1 rounded backdrop-blur-sm">
            {formatTime(currentTime)}
          </span>
          <div className="flex items-center space-x-2">
            {isPlaying && (
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-accent rounded-full animate-pulse"></div>
                <div
                  className="w-1 h-4 bg-accent-light rounded-full animate-pulse"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-1 h-2 bg-accent rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            )}
            <span className="text-gray-400 font-mono tabular-nums bg-gray-800/30 px-2 py-1 rounded backdrop-blur-sm">
              {formatTime(audioDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Title and Status */}
      <div className="flex flex-col items-end space-y-2">
        {title && (
          <div
            className={`${config.time} text-gray-300 truncate max-w-32 bg-gray-800/30 px-2 py-1 rounded backdrop-blur-sm font-medium`}
          >
            {title}
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div
            className={`${config.time} text-red-400 truncate bg-red-900/20 px-2 py-1 rounded border border-red-500/30 backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Preload Status */}
        {!hasError && loadProgress > 0 && loadProgress < 100 && (
          <div
            className={`${config.time} text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/30 backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-1">
              <svg
                className="w-3 h-3 fill-current animate-spin"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                  opacity=".25"
                />
                <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
              </svg>
              <span>Loading {Math.round(loadProgress)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
