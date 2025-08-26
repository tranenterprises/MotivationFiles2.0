import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private defaultLimits = {
    quotes: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    generate: { requests: 5, window: 60 * 1000 }, // 10 requests per minute
    manual: { requests: 1, window: 60 * 1000 }, // 5 requests per minute
  };

  /**
   * Get client identifier from request
   */
  private getClientId(request: NextRequest): string {
    // Try to get real IP from headers (for production behind proxy)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const connectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    // Use the first available IP address
    const ip = forwarded?.split(',')[0]?.trim() || 
              realIp || 
              connectingIp || 
              'unknown';

    return ip;
  }

  /**
   * Clean expired entries from store
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Check if request is within rate limit
   */
  checkRateLimit(
    request: NextRequest, 
    endpoint: 'quotes' | 'generate' | 'manual',
    customLimit?: { requests: number; window: number }
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    this.cleanup();

    const clientId = this.getClientId(request);
    const limits = customLimit || this.defaultLimits[endpoint];
    const key = `${endpoint}:${clientId}`;
    const now = Date.now();

    // Get or create entry
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 0,
        resetTime: now + limits.window,
      };
    }

    const entry = this.store[key];
    const allowed = entry.count < limits.requests;

    if (allowed) {
      entry.count++;
    }

    const result: {
      allowed: boolean;
      limit: number;
      remaining: number;
      resetTime: number;
      retryAfter?: number;
    } = {
      allowed,
      limit: limits.requests,
      remaining: Math.max(0, limits.requests - entry.count),
      resetTime: entry.resetTime,
    };

    if (!allowed) {
      result.retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    }

    return result;
  }

  /**
   * Get rate limit headers for response
   */
  getRateLimitHeaders(rateLimitResult: ReturnType<typeof this.checkRateLimit>): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
    };

    if (rateLimitResult.retryAfter) {
      headers['Retry-After'] = rateLimitResult.retryAfter.toString();
    }

    return headers;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware helper
 */
export function withRateLimit<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  endpoint: 'quotes' | 'generate' | 'manual',
  customLimit?: { requests: number; window: number }
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as NextRequest;
    
    try {
      const rateLimitResult = rateLimiter.checkRateLimit(request, endpoint, customLimit);
      const headers = rateLimiter.getRateLimitHeaders(rateLimitResult);

      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${rateLimitResult.limit} per minute`,
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }
        );
      }

      // Call the original handler
      const response = await handler(...args);

      // Add rate limit headers to successful responses
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
      return handler(...args);
    }
  };
}

/**
 * Security headers helper
 */
export function addSecurityHeaders(response: Response): Response {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers for API
  response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com')
    : '*'
  );
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}