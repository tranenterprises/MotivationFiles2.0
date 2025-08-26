import { NextRequest, NextResponse } from 'next/server';
import { generateQuote, type QuoteCategory } from '@/lib/api/openai';
import { generateVoiceWithFallbacksAndUpload } from '@/lib/api/elevenlabs';
import { 
  createQuote, 
  getTodaysQuote,
  updateQuoteAudioUrl,
  getQuotesByCategory 
} from '@/lib/api/supabase';
import { withRateLimit, addSecurityHeaders } from '@/lib/utils/rate-limit';

const QUOTE_CATEGORIES: QuoteCategory[] = ['motivation', 'wisdom', 'grindset', 'reflection', 'discipline'];

/**
 * Get the next category to use based on equal distribution
 */
async function getNextCategory(): Promise<QuoteCategory> {
  try {
    // Get category counts for the last 30 days to ensure recent balance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const categoryCounts: Record<QuoteCategory, number> = {
      motivation: 0,
      wisdom: 0,
      grindset: 0,
      reflection: 0,
      discipline: 0,
    };

    // Count quotes by category in the last 30 days
    for (const category of QUOTE_CATEGORIES) {
      const quotes = await getQuotesByCategory(category);
      const recentQuotes = quotes.filter(quote => 
        quote.date_created && quote.date_created >= startDate
      );
      categoryCounts[category] = recentQuotes.length;
    }

    // Find the category with the least usage
    const sortedCategories = QUOTE_CATEGORIES.sort((a, b) => 
      categoryCounts[a] - categoryCounts[b]
    );

    return sortedCategories[0];
  } catch (error) {
    console.error('Error determining next category, using random fallback:', error);
    // Fallback to random selection if there's an error
    return QUOTE_CATEGORIES[Math.floor(Math.random() * QUOTE_CATEGORIES.length)];
  }
}

/**
 * Generate content manually with options
 */
async function generateManualContent(options: {
  category?: QuoteCategory | undefined;
  force?: boolean | undefined;
  targetDate?: string | undefined;
}) {
  const { category, force = false, targetDate } = options;
  const today = targetDate || new Date().toISOString().split('T')[0];

  // Check if quote already exists for target date (unless force is true)
  if (!force) {
    const existingQuote = targetDate ? null : await getTodaysQuote();
    if (existingQuote) {
      return {
        success: true,
        message: 'Quote already exists for today. Use force=true to regenerate.',
        quote: existingQuote,
        skipReason: 'already_exists',
        generated: false
      };
    }
  }

  console.log(`Generating manual content for: ${today}`);

  // Use provided category or determine the next category
  const selectedCategory = category || await getNextCategory();
  console.log('Selected category:', selectedCategory);

  // Generate the quote
  console.log('Generating quote...');
  const generatedQuote = await generateQuote(selectedCategory);
  
  // Create the quote in database first (without audio_url)
  console.log('Creating quote in database...');
  const quoteData = {
    content: generatedQuote.content,
    category: generatedQuote.category,
    date_created: today,
    audio_url: null, // Will be updated after voice generation
    audio_duration: null, // Will be updated after voice generation
  };

  const createdQuote = await createQuote(quoteData);
  console.log('Quote created with ID:', createdQuote.id);

  try {
    // Generate voice with fallbacks
    console.log('Generating voice audio...');
    const voiceResult = await generateVoiceWithFallbacksAndUpload(
      generatedQuote.content,
      createdQuote.id
    );

    // Update quote with audio URL
    console.log('Updating quote with audio URL...');
    const finalQuote = await updateQuoteAudioUrl(createdQuote.id, voiceResult.upload.url);

    console.log('Manual content generation completed successfully');

    return {
      success: true,
      message: 'Content generated successfully',
      quote: finalQuote,
      voiceGenerated: true,
      audioUrl: voiceResult.upload.url,
      category: generatedQuote.category,
      generated: true,
      targetDate: today
    };
  } catch (voiceError: any) {
    console.error('Voice generation failed:', voiceError.message);
    
    // Quote was created successfully, but voice failed
    return {
      success: true,
      message: 'Quote generated but voice generation failed',
      quote: createdQuote,
      voiceGenerated: false,
      voiceError: voiceError.message,
      category: generatedQuote.category,
      generated: true,
      targetDate: today
    };
  }
}

async function handlePOST(request: NextRequest) {
  try {
    console.log('Manual content generation triggered');

    // Parse request body for options
    let options: {
      category?: QuoteCategory;
      force?: boolean;
      targetDate?: string;
      adminKey?: string;
    } = {};

    try {
      options = await request.json();
    } catch (error) {
      // Body parsing failed, use default options
      console.log('No valid JSON body provided, using default options');
    }

    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const adminKey = options.adminKey;
    
    // Allow requests with proper authorization header or admin key
    const isAuthorized = (authHeader && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
                        (adminKey && adminKey === process.env.ADMIN_SECRET);

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      console.log('Unauthorized request to manual generate');
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized. Please provide valid authorization.' 
        },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    // Validate category if provided
    if (options.category && !QUOTE_CATEGORIES.includes(options.category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${QUOTE_CATEGORIES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate target date if provided
    if (options.targetDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(options.targetDate)) {
        return NextResponse.json(
          {
            success: false,
            error: 'targetDate must be in YYYY-MM-DD format'
          },
          { status: 400 }
        );
      }
    }

    const result = await generateManualContent({
      category: options.category,
      force: options.force ?? false,
      targetDate: options.targetDate
    });
    
    // Invalidate cache after generating new content (if generated)
    if (result.success && result.generated) {
      try {
        const { invalidateCache } = await import('@/lib/utils/cache');
        invalidateCache(['today_quote', 'archive', 'quote_count']);
      } catch (cacheError) {
        console.warn('Cache invalidation failed:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }

    const response = NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error('Manual content generation failed:', error);

    // Handle specific errors
    if (error.message.includes('Failed to create quote')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error: Failed to create quote',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }

    if (error.message.includes('OpenAI') || error.message.includes('quota')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'AI service temporarily unavailable',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET method for simple triggering (backward compatibility)
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized. Please provide valid authorization header.' 
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const category = searchParams.get('category') as QuoteCategory | null;
    const force = searchParams.get('force') === 'true';
    const targetDate = searchParams.get('target_date');

    // Validate category if provided
    if (category && !QUOTE_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${QUOTE_CATEGORIES.join(', ')}`
        },
        { status: 400 }
      );
    }

    const result = await generateManualContent({ 
      category: category || undefined, 
      force, 
      targetDate: targetDate || undefined 
    });

    const response = NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error('Manual content generation failed:', error);

    const response = NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

// Export rate-limited versions
export const POST = withRateLimit(handlePOST, 'manual');
export const GET = withRateLimit(handleGET, 'manual');

// Handle CORS preflight requests
export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  return addSecurityHeaders(response);
}