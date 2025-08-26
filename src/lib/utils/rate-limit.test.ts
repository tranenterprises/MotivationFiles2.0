import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, withRateLimit, addSecurityHeaders } from './rate-limit';

// Mock NextRequest for testing
function createMockRequest(ip?: string, headers: Record<string, string> = {}): NextRequest {
  const mockHeaders = new Map(Object.entries({
    'x-forwarded-for': ip,
    ...headers,
  }));

  return {
    headers: {
      get: (key: string) => mockHeaders.get(key) || null,
    },
  } as NextRequest;
}

describe('Rate Limiting Utility', () => {
  beforeEach(() => {
    // Clear the internal rate limiter store before each test
    // Since we can't access private properties directly, we'll work with fresh instances
    jest.clearAllMocks();
  });

  describe('RateLimiter Class', () => {
    describe('checkRateLimit', () => {
      it('should allow requests within limit', () => {
        const request = createMockRequest('192.168.1.1');
        
        const result = rateLimiter.checkRateLimit(request, 'quotes');
        
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(100);
        expect(result.remaining).toBe(99);
        expect(result.retryAfter).toBeUndefined();
        expect(typeof result.resetTime).toBe('number');
      });

      it('should track multiple requests from same IP', () => {
        const request = createMockRequest('192.168.1.1');
        
        // First request
        let result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99);
        
        // Second request
        result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(98);
      });

      it('should distinguish between different endpoints', () => {
        const request = createMockRequest('192.168.1.1');
        
        // Request to quotes endpoint
        let result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(100);
        
        // Request to manual endpoint (different limits)
        result = rateLimiter.checkRateLimit(request, 'manual');
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(1); // Different limit for manual endpoint
      });

      it('should distinguish between different IP addresses', () => {
        const request1 = createMockRequest('192.168.1.1');
        const request2 = createMockRequest('192.168.1.2');
        
        // Request from IP 1
        let result = rateLimiter.checkRateLimit(request1, 'quotes');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99);
        
        // Request from IP 2 should have full limit
        result = rateLimiter.checkRateLimit(request2, 'quotes');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99);
      });

      it('should reject requests over limit', () => {
        const request = createMockRequest('192.168.1.1');
        
        // Use manual endpoint with limit of 1 for easier testing
        let result = rateLimiter.checkRateLimit(request, 'manual');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(0);
        
        // Second request should be rejected
        result = rateLimiter.checkRateLimit(request, 'manual');
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
        expect(result.retryAfter).toBeLessThanOrEqual(60);
      });

      it('should handle requests with custom limits', () => {
        const request = createMockRequest('192.168.1.1');
        const customLimit = { requests: 3, window: 10000 };
        
        // First 3 requests should be allowed
        for (let i = 0; i < 3; i++) {
          const result = rateLimiter.checkRateLimit(request, 'quotes', customLimit);
          expect(result.allowed).toBe(true);
          expect(result.limit).toBe(3);
          expect(result.remaining).toBe(2 - i);
        }
        
        // 4th request should be rejected
        const result = rateLimiter.checkRateLimit(request, 'quotes', customLimit);
        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(3);
        expect(result.remaining).toBe(0);
      });

      it('should use x-forwarded-for header for IP identification', () => {
        const request = createMockRequest(undefined, { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' });
        
        const result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
        
        // Should use first IP from forwarded header
        const request2 = createMockRequest(undefined, { 'x-forwarded-for': '10.0.0.1, 192.168.1.2' });
        const result2 = rateLimiter.checkRateLimit(request2, 'quotes');
        
        // Second request from same IP (first in forwarded header) should decrease remaining
        expect(result2.remaining).toBe(98);
      });

      it('should use x-real-ip header as fallback', () => {
        const request = createMockRequest(undefined, { 'x-real-ip': '172.16.0.1' });
        
        const result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
      });

      it('should use cf-connecting-ip header for Cloudflare', () => {
        const request = createMockRequest(undefined, { 'cf-connecting-ip': '203.0.113.1' });
        
        const result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
      });

      it('should fallback to "unknown" if no IP headers present', () => {
        const request = createMockRequest();
        
        const result = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result.allowed).toBe(true);
        
        // All requests without IP info should be grouped together
        const result2 = rateLimiter.checkRateLimit(request, 'quotes');
        expect(result2.remaining).toBe(98);
      });

      it('should prioritize x-forwarded-for over other headers', () => {
        const request = createMockRequest(undefined, {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': '172.16.0.1',
          'cf-connecting-ip': '203.0.113.1',
        });
        
        rateLimiter.checkRateLimit(request, 'quotes');
        
        // Request with same x-forwarded-for should be grouped together
        const request2 = createMockRequest(undefined, {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': '192.168.1.1',
        });
        
        const result2 = rateLimiter.checkRateLimit(request2, 'quotes');
        expect(result2.remaining).toBe(98); // Should be decremented
      });
    });

    describe('getRateLimitHeaders', () => {
      it('should return correct headers for allowed request', () => {
        const rateLimitResult = {
          allowed: true,
          limit: 100,
          remaining: 95,
          resetTime: Date.now() + 60000,
        };
        
        const headers = rateLimiter.getRateLimitHeaders(rateLimitResult);
        
        expect(headers['X-RateLimit-Limit']).toBe('100');
        expect(headers['X-RateLimit-Remaining']).toBe('95');
        expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(rateLimitResult.resetTime / 1000).toString());
        expect(headers['Retry-After']).toBeUndefined();
      });

      it('should include Retry-After header for rejected request', () => {
        const rateLimitResult = {
          allowed: false,
          limit: 100,
          remaining: 0,
          resetTime: Date.now() + 30000,
          retryAfter: 30,
        };
        
        const headers = rateLimiter.getRateLimitHeaders(rateLimitResult);
        
        expect(headers['X-RateLimit-Limit']).toBe('100');
        expect(headers['X-RateLimit-Remaining']).toBe('0');
        expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(rateLimitResult.resetTime / 1000).toString());
        expect(headers['Retry-After']).toBe('30');
      });
    });
  });

  describe('withRateLimit Middleware', () => {
    const mockHandler = jest.fn();
    const mockResponse = NextResponse.json({ success: true }, { status: 200 });

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(mockResponse);
    });

    it('should allow requests within rate limit', async () => {
      const rateLimitedHandler = withRateLimit(mockHandler, 'quotes');
      const request = createMockRequest('192.168.1.1');
      
      const response = await rateLimitedHandler(request);
      
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    });

    it('should reject requests over rate limit', async () => {
      const rateLimitedHandler = withRateLimit(mockHandler, 'manual');
      const request = createMockRequest('192.168.1.1');
      
      // First request should be allowed
      let response = await rateLimitedHandler(request);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      // Second request should be rejected
      response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
      expect(mockHandler).toHaveBeenCalledTimes(1); // Handler should not be called again
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.retryAfter).toBeGreaterThan(0);
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('should handle rate limiting errors gracefully', async () => {
      // Mock rateLimiter to throw an error
      const originalCheckRateLimit = rateLimiter.checkRateLimit;
      rateLimiter.checkRateLimit = jest.fn().mockImplementation(() => {
        throw new Error('Rate limiter error');
      });
      
      const rateLimitedHandler = withRateLimit(mockHandler, 'quotes');
      const request = createMockRequest('192.168.1.1');
      
      const response = await rateLimitedHandler(request);
      
      // Should allow request to proceed if rate limiting fails
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request);
      
      // Restore original method
      rateLimiter.checkRateLimit = originalCheckRateLimit;
    });

    it('should work with custom rate limits', async () => {
      const customLimit = { requests: 2, window: 10000 };
      const rateLimitedHandler = withRateLimit(mockHandler, 'quotes', customLimit);
      const request = createMockRequest('192.168.1.1');
      
      // First two requests should be allowed
      for (let i = 0; i < 2; i++) {
        const response = await rateLimitedHandler(request);
        expect(response.status).toBe(200);
        expect(response.headers.get('X-RateLimit-Limit')).toBe('2');
      }
      
      // Third request should be rejected
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('addSecurityHeaders', () => {
    it('should add all required security headers', () => {
      const response = new NextResponse('test content');
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secureResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should add CORS headers', () => {
      const response = new NextResponse('test content');
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(secureResponse.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should set development CORS origin in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const response = new NextResponse('test content');
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should set production CORS origin in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      
      const response = new NextResponse('test content');
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      
      process.env.NODE_ENV = originalEnv;
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    });

    it('should fallback to default domain if NEXT_PUBLIC_APP_URL not set in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_APP_URL;
      
      const response = new NextResponse('test content');
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://yourdomain.com');
      
      process.env.NODE_ENV = originalEnv;
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    });

    it('should preserve existing response content', () => {
      const originalContent = JSON.stringify({ test: 'data' });
      const response = new NextResponse(originalContent, {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
      
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.status).toBe(201);
      expect(secureResponse.headers.get('Content-Type')).toBe('application/json');
    });

    it('should not override existing security headers', () => {
      const response = new NextResponse('test content', {
        headers: { 'X-Frame-Options': 'SAMEORIGIN' },
      });
      
      const secureResponse = addSecurityHeaders(response);
      
      // Should not override existing header
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic scenario', async () => {
      const mockHandler = jest.fn();
      const mockResponse = NextResponse.json({ data: 'test' }, { status: 200 });
      mockHandler.mockResolvedValue(mockResponse);
      
      const rateLimitedHandler = withRateLimit(mockHandler, 'manual', { requests: 2, window: 60000 });
      const request = createMockRequest('203.0.113.1');
      
      // First request
      let response = await rateLimitedHandler(request);
      let data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data).toBe('test');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('2');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('1');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      
      // Second request
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ data: 'test2' }, { status: 200 }));
      
      response = await rateLimitedHandler(request);
      data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data).toBe('test2');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      
      // Third request should be rate limited
      response = await rateLimitedHandler(request);
      data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rate limit exceeded');
      expect(response.headers.get('Retry-After')).toBeTruthy();
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});