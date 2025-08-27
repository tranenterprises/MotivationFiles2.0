import { NextRequest, NextResponse } from 'next/server';
import {
  getTodaysQuote,
  getAllQuotes,
  getQuotesByCategory,
  getQuoteCount,
  getQuotesByDateRange,
} from '@/lib/api/supabase';
import { withRateLimit, addSecurityHeaders } from '@/lib/utils/rate-limit';

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const type = searchParams.get('type') || 'today'; // 'today', 'archive', 'category'
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let responseData;

    // Validate limit parameter
    if (limit > 100) {
      responseData = NextResponse.json(
        {
          success: false,
          error: 'Limit cannot exceed 100 quotes per request',
        },
        { status: 400 }
      );
      return addSecurityHeaders(responseData);
    }

    switch (type) {
      case 'today': {
        const todayQuote = await getTodaysQuote();

        if (!todayQuote) {
          responseData = NextResponse.json(
            {
              success: true,
              data: null,
              message: 'No quote available for today',
            },
            { status: 200 }
          );
          return addSecurityHeaders(responseData);
        }

        responseData = NextResponse.json(
          {
            success: true,
            data: todayQuote,
            message: "Today's quote retrieved successfully",
          },
          { status: 200 }
        );
        return addSecurityHeaders(responseData);
      }

      case 'archive': {
        const quotes = await getAllQuotes(limit, offset);
        const totalCount = await getQuoteCount();

        responseData = NextResponse.json(
          {
            success: true,
            data: quotes,
            pagination: {
              limit,
              offset,
              total: totalCount,
              hasMore: offset + quotes.length < totalCount,
            },
            message: 'Archive quotes retrieved successfully',
          },
          { status: 200 }
        );
        return addSecurityHeaders(responseData);
      }

      case 'category': {
        if (!category) {
          responseData = NextResponse.json(
            {
              success: false,
              error: 'Category parameter is required for category type',
            },
            { status: 400 }
          );
          return addSecurityHeaders(responseData);
        }

        const validCategories = [
          'motivation',
          'wisdom',
          'grindset',
          'reflection',
          'discipline',
        ];
        if (!validCategories.includes(category)) {
          responseData = NextResponse.json(
            {
              success: false,
              error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
            },
            { status: 400 }
          );
          return addSecurityHeaders(responseData);
        }

        const quotes = await getQuotesByCategory(category);

        responseData = NextResponse.json(
          {
            success: true,
            data: quotes,
            category,
            count: quotes.length,
            message: `${category} quotes retrieved successfully`,
          },
          { status: 200 }
        );
        return addSecurityHeaders(responseData);
      }

      case 'date_range': {
        if (!startDate || !endDate) {
          responseData = NextResponse.json(
            {
              success: false,
              error:
                'start_date and end_date parameters are required for date_range type',
            },
            { status: 400 }
          );
          return addSecurityHeaders(responseData);
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
          responseData = NextResponse.json(
            {
              success: false,
              error: 'Dates must be in YYYY-MM-DD format',
            },
            { status: 400 }
          );
          return addSecurityHeaders(responseData);
        }

        // Validate date range (start date should be before or equal to end date)
        if (new Date(startDate) > new Date(endDate)) {
          responseData = NextResponse.json(
            {
              success: false,
              error: 'start_date must be before or equal to end_date',
            },
            { status: 400 }
          );
          return addSecurityHeaders(responseData);
        }

        const quotes = await getQuotesByDateRange(startDate, endDate);

        responseData = NextResponse.json(
          {
            success: true,
            data: quotes,
            dateRange: { startDate, endDate },
            count: quotes.length,
            message: 'Date range quotes retrieved successfully',
          },
          { status: 200 }
        );
        return addSecurityHeaders(responseData);
      }

      default: {
        responseData = NextResponse.json(
          {
            success: false,
            error:
              'Invalid type parameter. Must be one of: today, archive, category, date_range',
          },
          { status: 400 }
        );
        return addSecurityHeaders(responseData);
      }
    }
  } catch (error: any) {
    console.error('Quote API error:', error);

    let responseData;

    // Handle specific database errors
    if (error.message.includes('Failed to fetch')) {
      responseData = NextResponse.json(
        {
          success: false,
          error: 'Database connection error',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 503 }
      );
    } else {
      responseData = NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return addSecurityHeaders(responseData);
  }
}

// Export rate-limited version
export const GET = withRateLimit(handleGET, 'quotes');

// Handle CORS preflight requests
export async function OPTIONS(_request: NextRequest) {
  const response = new Response(null, { status: 200 });
  return addSecurityHeaders(response);
}
