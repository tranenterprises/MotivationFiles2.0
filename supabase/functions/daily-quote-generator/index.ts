// Supabase Edge Function for Daily Quote Generation
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';
import { ElevenLabsClient } from 'https://esm.sh/@elevenlabs/elevenlabs-js@0.8.0';

// Types
interface Quote {
  id: string;
  date_created: string;
  content: string;
  category: string;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
  updated_at: string;
}

type QuoteCategory =
  | 'motivation'
  | 'wisdom'
  | 'grindset'
  | 'reflection'
  | 'discipline';

// Configuration
const QUOTE_CATEGORIES: QuoteCategory[] = [
  'motivation',
  'wisdom',
  'grindset',
  'reflection',
  'discipline',
];

// Prompt templates (simplified version of your prompts)
const PROMPT_TEMPLATES: Record<QuoteCategory, string> = {
  motivation:
    'Generate an original, powerful motivational quote that inspires action and perseverance. Focus on themes like overcoming obstacles, pushing through challenges, and achieving greatness. Make it impactful and memorable.',
  wisdom:
    'Generate an original, thoughtful wisdom quote that provides deep insight about life, success, or human nature. Focus on timeless truths and practical wisdom that guides decision-making.',
  grindset:
    'Generate an original, intense grindset quote that embodies the mentality of relentless work ethic, discipline, and never giving up. Focus on themes like outworking competition, embracing the struggle, and dominating your goals.',
  reflection:
    'Generate an original, introspective quote that encourages self-reflection and personal growth. Focus on themes like learning from experiences, understanding yourself better, and continuous improvement.',
  discipline:
    'Generate an original, powerful discipline quote that emphasizes self-control, consistency, and doing what needs to be done. Focus on themes like building habits, staying committed, and mastering yourself.',
};

const SYSTEM_PROMPT = `You are a motivational quote generator. Generate original, impactful quotes that inspire and motivate people to take action and achieve their goals.

Requirements:
- Generate only ONE original quote
- Keep it under 50 words
- Make it powerful and actionable
- Avoid clichés or overused phrases
- Focus on the specific theme requested
- Return ONLY the quote text, no quotation marks or attribution`;

// Helper functions
async function getNextCategory(supabase: any): Promise<QuoteCategory> {
  try {
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
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('category', category)
        .gte('date_created', startDate);

      categoryCounts[category] = quotes?.length || 0;
    }

    // Find category with least usage
    const sortedCategories = QUOTE_CATEGORIES.sort(
      (a, b) => categoryCounts[a] - categoryCounts[b]
    );

    console.log('Category usage in last 30 days:', categoryCounts);
    console.log('Selected category:', sortedCategories[0]);

    return sortedCategories[0];
  } catch (error) {
    console.error(
      'Error determining next category, using random fallback:',
      error
    );
    return QUOTE_CATEGORIES[
      Math.floor(Math.random() * QUOTE_CATEGORIES.length)
    ];
  }
}

async function generateQuote(
  openai: OpenAI,
  category: QuoteCategory
): Promise<{ content: string; category: QuoteCategory }> {
  const prompt = PROMPT_TEMPLATES[category];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.8,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error('Failed to generate quote content');
    }

    // Basic content filtering
    const filteredContent = rawContent
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return {
      content: filteredContent,
      category,
    };
  } catch (error: any) {
    throw new Error(`Failed to generate quote: ${error.message}`);
  }
}

async function generateVoiceAndUpload(
  elevenlabs: ElevenLabsClient,
  text: string,
  quoteId: string,
  supabase: any
): Promise<string> {
  try {
    // Generate voice using ElevenLabs
    const audioResponse = await elevenlabs.textToSpeech.convert(
      'pNInz6obpgDQGcFmaJgB', // Adam voice ID
      {
        text,
        modelId: 'eleven_monolingual_v1',
        voiceSettings: {
          stability: 0.75,
          similarityBoost: 0.75,
          style: 0.5,
          useSpeakerBoost: true,
        },
        outputFormat: 'mp3_44100_192' as any,
      }
    );

    if (!audioResponse) {
      throw new Error('Failed to generate voice audio');
    }

    // Convert stream to buffer
    const reader = audioResponse.getReader();
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const audioBuffer = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    if (audioBuffer.length === 0) {
      throw new Error('Generated audio buffer is empty');
    }

    // Upload to Supabase Storage
    const fileName = `${quoteId}-${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quote-audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000', // 1 year cache
      });

    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('quote-audio').getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Voice generation failed:', error.message);
    throw error;
  }
}

async function generateDailyContent() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
  const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')!;

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const elevenlabs = new ElevenLabsClient({ apiKey: elevenlabsApiKey });

  const today = new Date().toISOString().split('T')[0];

  // Check if quote already exists for today
  const { data: existingQuote } = await supabase
    .from('quotes')
    .select('*')
    .eq('date_created', today)
    .single();

  if (existingQuote) {
    console.log('Quote already exists for today:', today);
    return {
      success: true,
      message: 'Quote already exists for today',
      quote: existingQuote,
      skipReason: 'already_exists',
    };
  }

  console.log('Generating new daily content for:', today);

  // Get the next category to ensure balanced distribution
  const category = await getNextCategory(supabase);
  console.log('Selected category:', category);

  // Generate the quote
  console.log('Generating quote...');
  const generatedQuote = await generateQuote(openai, category);

  // Create the quote in database first (without audio_url)
  console.log('Creating quote in database...');
  const { data: createdQuote, error: createError } = await supabase
    .from('quotes')
    .insert({
      content: generatedQuote.content,
      category: generatedQuote.category,
      date_created: today,
      audio_url: null,
      audio_duration: null,
    })
    .select()
    .single();

  if (createError || !createdQuote) {
    throw new Error(`Failed to create quote: ${createError?.message}`);
  }

  console.log('Quote created with ID:', createdQuote.id);

  try {
    // Generate voice with upload
    console.log('Generating voice audio...');
    const audioUrl = await generateVoiceWithFallbacksAndUpload(
      elevenlabs,
      generatedQuote.content,
      createdQuote.id,
      supabase
    );

    // Update quote with audio URL
    console.log('Updating quote with audio URL...');
    const { data: finalQuote, error: updateError } = await supabase
      .from('quotes')
      .update({ audio_url: audioUrl })
      .eq('id', createdQuote.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(
        `Failed to update quote with audio URL: ${updateError.message}`
      );
    }

    console.log('Daily content generation completed successfully');

    return {
      success: true,
      message: 'Daily content generated successfully',
      quote: finalQuote,
      voiceGenerated: true,
      audioUrl: audioUrl,
      category: generatedQuote.category,
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
    };
  }
}

// Edge Function handler
Deno.serve(async req => {
  try {
    console.log('Daily content generation triggered via Edge Function');

    // Basic security check - verify this is being called by pg_cron or authorized request
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!authHeader || !authHeader.includes(cronSecret || '')) {
      console.log('Unauthorized request to Edge Function');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await generateDailyContent();

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Daily content generation failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate daily content',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
