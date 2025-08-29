/**
 * Date formatting utilities for the Daily Motivation Voice App
 */

/**
 * Formats a date string for display in different contexts
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param format - The format type for different use cases
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  format: 'full' | 'short' | 'compact' | 'title' = 'full'
): string {
  // Parse date string as local date (don't add timezone info)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  switch (format) {
    case 'full':
      // Full format: "Monday, January 15, 2024"
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });

    case 'short':
      // Short format: "Jan 15, 2024"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });

    case 'compact':
      // Compact format: "1/15/2024"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });

    case 'title':
      // Title format: "1/15/2024" (same as compact, used for page titles)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });

    default:
      return date.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
      });
  }
}

/**
 * Formats a date string for display in QuoteCard components based on size
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param size - The QuoteCard size that affects date display format
 * @returns Formatted date string appropriate for the card size
 */
export function formatQuoteDate(
  dateString: string,
  size: 'small' | 'medium' | 'large' = 'large'
): string {
  // Parse date string as local date (don't add timezone info)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    weekday: size === 'small' ? undefined : 'long',
    year: 'numeric',
    month: size === 'small' ? 'short' : 'long',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

/**
 * Formats the current date as ISO string (YYYY-MM-DD) for database storage in PST
 * @returns Today's date in ISO format (PST timezone)
 */
export function getTodayISOString(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
  });
}

/**
 * Gets current date in PST timezone
 * @returns Date object representing current time in PST
 */
export function getPSTDate(): Date {
  return new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    })
  );
}

/**
 * Formats duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Calculates relative time from a date string (e.g., "2 days ago", "Today")
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Checks if a date string represents today
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns True if the date is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayISOString();
}

/**
 * Formats a date range for display
 * @param startDate - ISO date string for start date
 * @param endDate - ISO date string for end date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      // Same month and year: "Jan 1-15, 2024"
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
    } else {
      // Same year: "Jan 1 - Feb 15, 2024"
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
    }
  } else {
    // Different years: "Jan 1, 2023 - Feb 15, 2024"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}
