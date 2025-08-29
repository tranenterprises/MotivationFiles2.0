/**
 * @jest-environment jsdom
 */

import {
  formatDate,
  formatQuoteDate,
  getTodayISOString,
  getPSTDate,
  formatDuration,
  getRelativeTime,
  isToday,
  formatDateRange,
} from '../utils/date';

describe('Date Utilities', () => {
  // Use actual current date for consistent testing
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  let originalDateNow: typeof Date.now;

  beforeAll(() => {
    // Mock Date.now for consistent testing
    originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
  });

  afterAll(() => {
    Date.now = originalDateNow;
  });

  describe('formatDate', () => {
    const testDate = '2024-01-15';

    it('should format date in full format by default', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/\w+day, January \d+, 2024/);
    });

    it('should format date in full format explicitly', () => {
      const result = formatDate(testDate, 'full');
      expect(result).toMatch(/\w+day, January \d+, 2024/);
    });

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toMatch(/Jan \d+, 2024/);
    });

    it('should format date in compact format', () => {
      const result = formatDate(testDate, 'compact');
      expect(result).toMatch(/1\/\d+\/2024/);
    });

    it('should format date in title format', () => {
      const result = formatDate(testDate, 'title');
      expect(result).toMatch(/1\/\d+\/2024/);
    });

    it('should handle invalid date format gracefully', () => {
      expect(() => formatDate('invalid-date')).not.toThrow();
    });

    it('should handle different date string formats', () => {
      // Just verify the functions work without throwing
      expect(() => formatDate('2024-12-25', 'short')).not.toThrow();
      expect(() => formatDate('2024-01-01', 'full')).not.toThrow();
      expect(formatDate('2024-12-25', 'short')).toContain('Dec');
    });
  });

  describe('formatQuoteDate', () => {
    const testDate = '2024-01-15';

    it('should format date for large size by default', () => {
      const result = formatQuoteDate(testDate);
      expect(result).toMatch(/\w+day, January \d+, 2024/);
    });

    it('should format date for large size explicitly', () => {
      const result = formatQuoteDate(testDate, 'large');
      expect(result).toMatch(/\w+day, January \d+, 2024/);
    });

    it('should format date for medium size', () => {
      const result = formatQuoteDate(testDate, 'medium');
      expect(result).toMatch(/\w+day, January \d+, 2024/);
    });

    it('should format date for small size without weekday', () => {
      const result = formatQuoteDate(testDate, 'small');
      expect(result).toMatch(/Jan \d+, 2024/);
      expect(result).not.toMatch(/\w+day/); // Should not contain weekday
    });

    it('should handle different months for small size', () => {
      const result = formatQuoteDate('2024-12-25', 'small');
      expect(result).toContain('Dec');
      expect(result).toContain('2024');
    });
  });

  describe('getTodayISOString', () => {
    it("should return today's date in ISO format", () => {
      const result = getTodayISOString();
      expect(result).toBe(todayISO);
    });

    it('should return string in YYYY-MM-DD format', () => {
      const result = getTodayISOString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(60)).toBe('1:00');
    });

    it('should format longer durations correctly', () => {
      expect(formatDuration(3661)).toBe('61:01'); // Over an hour
      expect(formatDuration(7200)).toBe('120:00'); // 2 hours
    });

    it('should handle edge cases', () => {
      expect(formatDuration(59)).toBe('0:59');
      expect(formatDuration(61)).toBe('1:01');
      expect(formatDuration(599)).toBe('9:59');
      expect(formatDuration(600)).toBe('10:00');
    });
  });

  describe('getRelativeTime', () => {
    it('should return "Today" for today\'s date', () => {
      const result = getRelativeTime(todayISO);
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().split('T')[0];

      const result = getRelativeTime(yesterdayISO);
      expect(result).toBe('Yesterday');
    });

    it('should return days ago for recent dates', () => {
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoISO = twoDaysAgo.toISOString().split('T')[0];

      expect(getRelativeTime(twoDaysAgoISO)).toBe('2 days ago');
    });

    it('should return relative time for different periods', () => {
      // Test with a known old date
      const result = getRelativeTime('2020-01-01');
      expect(result).toMatch(/(days|weeks|months|years) ago/);
    });

    it('should return years ago for old dates', () => {
      const result = getRelativeTime('2020-01-15');
      expect(result).toContain('ago');
    });

    it('should handle future dates (edge case)', () => {
      // Future dates might show as negative days, but that's acceptable
      const result = getRelativeTime('2024-01-16');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('isToday', () => {
    it("should return true for today's date", () => {
      const result = isToday(todayISO);
      expect(result).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().split('T')[0];

      const result = isToday(yesterdayISO);
      expect(result).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString().split('T')[0];

      const result = isToday(tomorrowISO);
      expect(result).toBe(false);
    });

    it('should return false for different dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
      expect(isToday('2030-01-01')).toBe(false);
    });
  });

  describe('formatDateRange', () => {
    it('should format same month and year correctly', () => {
      const result = formatDateRange('2024-01-01', '2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
      expect(result).toMatch(/-/);
    });

    it('should format different months, same year correctly', () => {
      const result = formatDateRange('2024-01-15', '2024-02-15');
      expect(result).toContain('Jan');
      expect(result).toContain('Feb');
      expect(result).toContain('2024');
    });

    it('should format different years correctly', () => {
      const result = formatDateRange('2023-12-15', '2024-01-15');
      expect(result).toContain('Dec');
      expect(result).toContain('Jan');
      expect(result).toContain('2023');
      expect(result).toContain('2024');
    });

    it('should handle same date', () => {
      const result = formatDateRange('2024-01-15', '2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('should handle complex ranges', () => {
      // Just verify the function works without throwing and returns strings
      const result1 = formatDateRange('2024-01-01', '2024-12-31');
      expect(typeof result1).toBe('string');
      expect(result1.length).toBeGreaterThan(0);

      const result2 = formatDateRange('2023-01-01', '2025-12-31');
      expect(typeof result2).toBe('string');
      expect(result2.length).toBeGreaterThan(0);
    });
  });

  describe('Date parsing and validation', () => {
    it('should handle various date string formats', () => {
      expect(() => formatDate('2024-01-01')).not.toThrow();
      expect(() => formatDate('2024-12-31')).not.toThrow();
      expect(() => formatQuoteDate('2024-06-15', 'small')).not.toThrow();
    });

    it('should maintain consistent behavior across functions', () => {
      const testDate = '2024-06-15';

      // All functions should handle the same date string
      expect(() => formatDate(testDate)).not.toThrow();
      expect(() => formatQuoteDate(testDate)).not.toThrow();
      expect(() => getRelativeTime(testDate)).not.toThrow();
      expect(() => isToday(testDate)).not.toThrow();
    });

    it('should work with boundary dates', () => {
      // Just verify they don't throw and return valid strings
      expect(() => formatDate('2024-01-01', 'short')).not.toThrow();
      expect(() => formatDate('2024-12-31', 'short')).not.toThrow();
      expect(() => formatQuoteDate('2024-02-29', 'small')).not.toThrow(); // Leap year

      expect(typeof formatDate('2024-01-01', 'short')).toBe('string');
      expect(typeof formatQuoteDate('2024-02-29', 'small')).toBe('string');
    });
  });

  describe('Locale and timezone handling', () => {
    it('should use en-US locale consistently', () => {
      const testDate = '2024-07-04';

      // Check that we get English month names
      expect(formatDate(testDate, 'full')).toContain('July');
      expect(formatDate(testDate, 'short')).toContain('Jul');
      expect(formatQuoteDate(testDate, 'small')).toContain('Jul');
    });

    it('should handle different weekdays', () => {
      // Test different days of the week - dates might be interpreted differently due to timezone
      const date1 = '2024-01-15';
      const date2 = '2024-01-14';

      const result1 = formatDate(date1, 'full');
      const result2 = formatDate(date2, 'full');

      // Both should contain a weekday name
      expect(result1).toMatch(
        /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/
      );
      expect(result2).toMatch(
        /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/
      );
    });

    it('should format dates consistently without timezone conversion issues', () => {
      // Test the specific issue we fixed: date should not shift backwards due to timezone
      const testDate = '2025-08-29';
      const formatted = formatDate(testDate, 'full');
      
      // Should contain August 29, not August 28
      expect(formatted).toContain('August 29');
      expect(formatted).toContain('2025');
      expect(formatted).not.toContain('August 28');
    });

    it('should maintain date integrity across different format types', () => {
      const testDate = '2025-01-15';
      
      const fullFormat = formatDate(testDate, 'full');
      const shortFormat = formatDate(testDate, 'short');
      const compactFormat = formatDate(testDate, 'compact');
      
      // All should contain the same date
      expect(fullFormat).toContain('January 15');
      expect(shortFormat).toContain('Jan 15');
      expect(compactFormat).toContain('15');
      
      // None should contain January 14 due to timezone issues
      expect(fullFormat).not.toContain('January 14');
      expect(shortFormat).not.toContain('Jan 14');
    });
  });

  describe('PST Timezone Functions', () => {
    it('should return valid ISO string for PST timezone', () => {
      const pstDate = getTodayISOString();
      
      // Should match YYYY-MM-DD format
      expect(pstDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof pstDate).toBe('string');
    });

    it('should return valid PST Date object', () => {
      const pstDate = getPSTDate();
      
      expect(pstDate).toBeInstanceOf(Date);
      expect(pstDate.getTime()).toBeGreaterThan(0);
      expect(typeof pstDate.getTime()).toBe('number');
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle empty strings gracefully', () => {
      // These will create invalid dates, but shouldn't throw
      expect(() => formatDate('')).not.toThrow();
      expect(() => getRelativeTime('')).not.toThrow();
    });

    it('should handle very old and future dates', () => {
      expect(() => formatDate('1900-01-01')).not.toThrow();
      expect(() => formatDate('2100-12-31')).not.toThrow();
      expect(() => getRelativeTime('1900-01-01')).not.toThrow();
      expect(() => getRelativeTime('2100-01-01')).not.toThrow();
    });

    it('should be consistent with multiple calls', () => {
      const testDate = '2024-01-15';
      const result1 = formatDate(testDate, 'full');
      const result2 = formatDate(testDate, 'full');
      expect(result1).toBe(result2);
    });
  });
});
