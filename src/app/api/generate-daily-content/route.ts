import { NextRequest, NextResponse } from 'next/server';
import { generateQuote, type QuoteCategory } from '@/lib/openai';
import { generateVoiceWithFallbacksAndUpload } from '@/lib/elevenlabs';
import { 
  createQuote, 
  getTodaysQuote,
  getQuotesByCategory 
} from '@/lib/supabase';

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

    console.log('Category usage in last 30 days:', categoryCounts);
    console.log('Selected category:', sortedCategories[0]);

    return sortedCategories[0];
  } catch (error) {
    console.error('Error determining next category, using random fallback:', error);
    // Fallback to random selection if there's an error
    return QUOTE_CATEGORIES[Math.floor(Math.random() * QUOTE_CATEGORIES.length)];
  }
}

/**
 * Generate daily motivational content (quote + voice)
 */
async function generateDailyContent() {
  const today = new Date().toISOString().split('T')[0];

  // Check if quote already exists for today
  const existingQuote = await getTodaysQuote();
  if (existingQuote) {
    console.log('Quote already exists for today:', today);
    return {
      success: true,
      message: 'Quote already exists for today',
      quote: existingQuote,
      skipReason: 'already_exists'
    };
  }

  console.log('Generating new daily content for:', today);

  // Get the next category to ensure balanced distribution
  const category = await getNextCategory();
  console.log('Selected category:', category);

  // Generate the quote
  console.log('Generating quote...');
  const generatedQuote = await generateQuote(category);
  
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
    const { updateQuoteAudioUrl } = await import('@/lib/supabase');
    const finalQuote = await updateQuoteAudioUrl(createdQuote.id, voiceResult.upload.url);

    console.log('Daily content generation completed successfully');

    return {
      success: true,
      message: 'Daily content generated successfully',
      quote: finalQuote,
      voiceGenerated: true,
      audioUrl: voiceResult.upload.url,
      category: generatedQuote.category,
    };
  } catch (voiceError: any) {
    console.error('Voice generation failed:', voiceError.message);
    
    // Quote was created successfully, but voice failed
    // This is still a partial success
    return {
      success: true,
      message: 'Quote generated but voice generation failed',
      quote: createdQuote,
      voiceGenerated: false,
      voiceError: voiceError.message,
      category: generatedQuote.category,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Daily content generation triggered');

    // Verify this is a cron job or authorized request
    const authHeader = request.headers.get('authorization');
    const cronHeader = request.headers.get('x-vercel-cron');
    
    // Allow requests from Vercel cron jobs or with proper authorization
    const isAuthorized = cronHeader === '1' || 
                        (authHeader && authHeader === `Bearer ${process.env.CRON_SECRET}`);

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      console.log('Unauthorized request to generate daily content');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized. This endpoint is for scheduled cron jobs only.' 
        },
        { status: 401 }
      );
    }

    const result = await generateDailyContent();

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Daily content generation failed:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate daily content',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Allow GET requests for manual testing (with proper auth)
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

    const result = await generateDailyContent();

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Manual daily content generation failed:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate daily content',
        details: error.message,
      },
      { status: 500 }
    );
  }
}