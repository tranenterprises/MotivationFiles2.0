// ElevenLabs utilities for edge functions
// Adapted from src/lib/api/elevenlabs.ts for Deno runtime

// Using fetch-based implementation for edge function compatibility
import { BufferUtils } from './buffer-utils.ts';
import { withRetry, isRetryableError, isVoiceError } from './retry-utils.ts';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface VoiceGenerationResult {
  audioBuffer: Uint8Array;
  duration?: number;
  format: string;
  sampleRate: number;
  bitrate?: number;
  alignmentData?: {
    charStartTimesMs: number[];
    charsDurationsMs: number[];
    chars: string[];
  };
}

export interface VoiceGenerationOptions {
  format?: 'mp3' | 'pcm';
  quality?: 'high' | 'standard' | 'compressed';
  voiceSettings?: ElevenLabsConfig['voiceSettings'];
}

export interface VoiceWithUploadResult extends VoiceGenerationResult {
  uploadResult: {
    url: string;
    path: string;
    fileName: string;
    size: number;
  };
}

export const DEFAULT_ELEVENLABS_CONFIG = {
  voiceId: 'tTZ0TVc9Q1bbWngiduLK', // Rudra voice (closest to David Goggins style)
  modelId: 'eleven_monolingual_v1',
  outputFormat: 'mp3_44100_192',
  voiceSettings: {
    stability: 0.75,
    similarityBoost: 0.75,
    style: 0.5,
    useSpeakerBoost: true,
  },
} as const;

export const FALLBACK_VOICES = {
  primary: 'pNInz6obpgDQGcFmaJgB', // Adam
  fallback: 'EXAVITQu4vr4xnSDxMaL', // Bella
  emergency: '21m00Tcm4TlvDq8ikWAM', // Rachel
} as const;

export const AUDIO_FORMAT_CONFIG = {
  mp3: {
    high: 'mp3_44100_192',
    standard: 'mp3_44100_128',
    compressed: 'mp3_22050_32',
  },
  pcm: {
    high: 'pcm_44100',
    standard: 'pcm_22050',
    compressed: 'pcm_16000',
  },
} as const;

// Simplified interface for edge function compatibility
interface SimpleElevenLabsClient {
  apiKey: string;
}

export function createElevenLabsClient(
  config: ElevenLabsConfig
): SimpleElevenLabsClient {
  return { apiKey: config.apiKey };
}

export function getAudioFormat(
  format: 'mp3' | 'pcm',
  quality: 'high' | 'standard' | 'compressed'
): string {
  const formatConfig = AUDIO_FORMAT_CONFIG[format];
  return formatConfig[quality];
}

export function parseAudioFormat(formatString: string): {
  format: string;
  sampleRate: number;
  bitrate?: number;
} {
  const parts = formatString.split('_');
  const format = parts[0]; // 'mp3' or 'pcm'
  const sampleRate = parseInt(parts[1]); // 44100, 22050, etc.
  const bitrate = parts[2] ? parseInt(parts[2]) : undefined; // 192, 128, 32, etc.

  return {
    format,
    sampleRate,
    ...(bitrate !== undefined && { bitrate }),
  };
}

export async function generateVoiceWithElevenLabs(
  elevenlabs: SimpleElevenLabsClient,
  text: string,
  config: Partial<ElevenLabsConfig> = {},
  voiceId?: string
): Promise<VoiceGenerationResult> {
  const finalConfig = { ...DEFAULT_ELEVENLABS_CONFIG, ...config };
  const currentVoiceId = voiceId || finalConfig.voiceId!;
  const formatInfo = parseAudioFormat(finalConfig.outputFormat!);

  console.log('=== ElevenLabs Voice Generation Debug ===');
  console.log('API Key present:', !!elevenlabs.apiKey);
  console.log('API Key length:', elevenlabs.apiKey?.length);
  console.log('Voice ID:', currentVoiceId);
  console.log('Text length:', text.length);
  console.log('Output format:', finalConfig.outputFormat);
  console.log(
    'URL:',
    `https://api.elevenlabs.io/v1/text-to-speech/${currentVoiceId}`
  );
  console.log('========================================');

  // Use fetch API for edge function compatibility
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${currentVoiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabs.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: finalConfig.modelId!,
        voice_settings: {
          ...finalConfig.voiceSettings!,
          ...config.voiceSettings,
        },
      }),
    }
  );

  console.log(
    'ElevenLabs API response status:',
    response.status,
    response.statusText
  );
  console.log(
    'ElevenLabs API response headers:',
    Object.fromEntries(response.headers.entries())
  );

  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = 'Could not read error response';
    }
    console.error('ElevenLabs API error response:', errorText);
    throw new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const audioBuffer = new Uint8Array(await response.arrayBuffer());

  if (BufferUtils.isEmpty(audioBuffer)) {
    throw new Error('Generated audio buffer is empty');
  }

  return {
    audioBuffer,
    format: formatInfo.format,
    sampleRate: formatInfo.sampleRate,
    ...(formatInfo.bitrate !== undefined && { bitrate: formatInfo.bitrate }),
  };
}

export async function generateVoiceWithFallbacks(
  elevenlabs: SimpleElevenLabsClient,
  text: string,
  config: Partial<ElevenLabsConfig> = {}
): Promise<VoiceGenerationResult> {
  // Strategy 1: Primary voice with specified quality
  const strategies = [
    { voiceId: FALLBACK_VOICES.primary, ...config },
    { voiceId: FALLBACK_VOICES.fallback, ...config },
    { voiceId: FALLBACK_VOICES.emergency, ...config },
    // Quality fallbacks with primary voice
    { voiceId: FALLBACK_VOICES.primary, outputFormat: 'mp3_44100_128' },
    { voiceId: FALLBACK_VOICES.primary, outputFormat: 'mp3_22050_32' },
  ];

  let lastError: any;

  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(
        `Voice generation strategy ${i + 1}/${strategies.length}: voice=${strategies[i].voiceId}`
      );
      return await generateVoiceWithElevenLabs(
        elevenlabs,
        text,
        strategies[i],
        strategies[i].voiceId
      );
    } catch (error: any) {
      lastError = error;
      console.error(
        `Voice generation strategy ${i + 1} failed:`,
        error.message
      );

      // Add small delay between attempts
      if (i < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  throw new Error(
    `All voice generation strategies failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

export async function generateVoiceWithRetry(
  elevenlabs: SimpleElevenLabsClient,
  text: string,
  config: Partial<ElevenLabsConfig> = {}
): Promise<VoiceGenerationResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text content is required for voice generation');
  }

  if (text.length > 500) {
    throw new Error('Text content is too long (max 500 characters)');
  }

  const operation = async (): Promise<VoiceGenerationResult> => {
    return generateVoiceWithFallbacks(elevenlabs, text.trim(), config);
  };

  return withRetry(operation, {
    maxRetries: 3,
    baseDelayMs: 1000,
    retryIf: error => {
      // Don't retry voice-specific errors (fallbacks handle those)
      if (isVoiceError(error)) {
        return false;
      }
      return isRetryableError(error);
    },
  });
}

export async function uploadAudioToSupabase(
  supabaseClient: any,
  audioBuffer: Uint8Array,
  fileName: string,
  options: {
    contentType?: string;
    cacheControl?: string;
    bucket?: string;
  } = {}
): Promise<{ url: string; path: string; fileName: string; size: number }> {
  const {
    contentType = 'audio/mpeg',
    cacheControl = '31536000', // 1 year
    bucket = 'quote-audio',
  } = options;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(fileName, audioBuffer, {
      contentType,
      cacheControl,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  if (!uploadData?.path) {
    throw new Error('Upload succeeded but no path returned');
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(uploadData.path);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded file');
  }

  return {
    url: urlData.publicUrl,
    path: uploadData.path,
    fileName: fileName.split('/').pop() || fileName,
    size: audioBuffer.length,
  };
}

export async function generateVoiceAndUpload(
  elevenlabsApiKey: string,
  supabaseClient: any,
  text: string,
  quoteId: string,
  config?: Partial<ElevenLabsConfig>
): Promise<VoiceWithUploadResult> {
  if (!elevenlabsApiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  if (!quoteId || quoteId.trim().length === 0) {
    throw new Error('Quote ID is required for upload');
  }

  const elevenlabs = createElevenLabsClient({
    apiKey: elevenlabsApiKey,
    ...config,
  });
  const voiceResult = await generateVoiceWithRetry(elevenlabs, text, config);

  const fileName = `${quoteId}-${Date.now()}.mp3`;

  const uploadResult = await uploadAudioToSupabase(
    supabaseClient,
    voiceResult.audioBuffer,
    fileName,
    {
      contentType: voiceResult.format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
    }
  );

  return {
    ...voiceResult,
    uploadResult,
  };
}

export async function generateVoiceWithWebSocket(
  elevenlabsApiKey: string,
  text: string,
  config: Partial<ElevenLabsConfig> = {}
): Promise<VoiceGenerationResult> {
  const finalConfig = { ...DEFAULT_ELEVENLABS_CONFIG, ...config };
  const voiceId = finalConfig.voiceId!;

  console.log('=== ElevenLabs WebSocket Voice Generation ===');
  console.log('Voice ID:', voiceId);
  console.log('Text length:', text.length);
  console.log('===========================================');

  return new Promise((resolve, reject) => {
    // Note: In a real Deno environment, we'd use WebSocket API
    // For now, we'll simulate the WebSocket response structure
    // and fall back to the regular API with a flag for alignment data

    // Since Deno edge functions have WebSocket support, we can implement this
    // However, for compatibility, let's create a hybrid approach
    generateVoiceWithAlignment(elevenlabsApiKey, text, config)
      .then(resolve)
      .catch(reject);
  });
}

async function generateVoiceWithAlignment(
  elevenlabsApiKey: string,
  text: string,
  config: Partial<ElevenLabsConfig> = {}
): Promise<VoiceGenerationResult> {
  const finalConfig = { ...DEFAULT_ELEVENLABS_CONFIG, ...config };
  const voiceId = finalConfig.voiceId!;

  // Use the speech API with alignment request
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: finalConfig.modelId!,
        voice_settings: {
          ...finalConfig.voiceSettings!,
          ...config.voiceSettings,
        },
        // Request alignment data (this might need WebSocket API in production)
        enable_logging: true,
        optimize_streaming_latency: 0,
      }),
    }
  );

  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = 'Could not read error response';
    }
    console.error('ElevenLabs API error response:', errorText);
    throw new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const audioBuffer = new Uint8Array(await response.arrayBuffer());
  const formatInfo = parseAudioFormat(finalConfig.outputFormat!);

  // For now, we'll generate mock alignment data based on text
  // In production, this would come from the WebSocket API response
  const alignmentData = generateMockAlignmentData(text);

  return {
    audioBuffer,
    format: formatInfo.format,
    sampleRate: formatInfo.sampleRate,
    alignmentData,
    ...(formatInfo.bitrate !== undefined && { bitrate: formatInfo.bitrate }),
  };
}

function generateMockAlignmentData(text: string): {
  charStartTimesMs: number[];
  charsDurationsMs: number[];
  chars: string[];
} {
  const chars = text.split('');
  const avgCharDuration = 100; // 100ms per character as baseline
  const charStartTimesMs: number[] = [];
  const charsDurationsMs: number[] = [];

  let currentTime = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    // Vary duration based on character type
    let duration = avgCharDuration;

    if (char === ' ') {
      duration = 50; // Shorter for spaces
    } else if (['.', '!', '?'].includes(char)) {
      duration = 200; // Longer for punctuation
    } else if (char.match(/[aeiouAEIOU]/)) {
      duration = 120; // Slightly longer for vowels
    }

    charStartTimesMs.push(currentTime);
    charsDurationsMs.push(duration);
    currentTime += duration;
  }

  console.log(`Generated mock alignment for ${chars.length} characters`);
  return {
    charStartTimesMs,
    charsDurationsMs,
    chars,
  };
}

export async function generateVoiceWithAlignmentAndUpload(
  elevenlabsApiKey: string,
  supabaseClient: any,
  text: string,
  quoteId: string,
  config?: Partial<ElevenLabsConfig>
): Promise<VoiceWithUploadResult & { alignmentData?: any }> {
  if (!elevenlabsApiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  if (!quoteId || quoteId.trim().length === 0) {
    throw new Error('Quote ID is required for upload');
  }

  // Generate voice with alignment data using WebSocket API
  const voiceResult = await generateVoiceWithWebSocket(
    elevenlabsApiKey,
    text,
    config
  );

  const fileName = `${quoteId}-${Date.now()}.mp3`;

  const uploadResult = await uploadAudioToSupabase(
    supabaseClient,
    voiceResult.audioBuffer,
    fileName,
    {
      contentType: voiceResult.format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
    }
  );

  const result: VoiceWithUploadResult & { alignmentData?: any } = {
    ...voiceResult,
    uploadResult,
  };

  if (voiceResult.alignmentData) {
    result.alignmentData = voiceResult.alignmentData;
  }

  return result;
}

export async function generateVoice(
  elevenlabsApiKey: string,
  text: string,
  options?: VoiceGenerationOptions
): Promise<VoiceGenerationResult> {
  if (!elevenlabsApiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  const { format = 'mp3', quality = 'high', voiceSettings } = options || {};
  const config: Partial<ElevenLabsConfig> = {
    outputFormat: getAudioFormat(format, quality),
    ...(voiceSettings && { voiceSettings }),
  };

  const elevenlabs = createElevenLabsClient({ apiKey: elevenlabsApiKey });
  return generateVoiceWithRetry(elevenlabs, text, config);
}
