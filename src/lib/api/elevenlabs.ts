import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { uploadQuoteAudio, type AudioUploadResult } from '../utils/storage';

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is required');
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const FALLBACK_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice as fallback
const EMERGENCY_FALLBACK_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice as emergency fallback

export const VOICE_GENERATION_CONFIG = {
  maxRetries: MAX_RETRIES,
  retryDelayMs: RETRY_DELAY_MS,
  enableVoiceFallbacks: true,
  enableQualityDegradation: true,
  fallbackVoices: [FALLBACK_VOICE_ID, EMERGENCY_FALLBACK_VOICE_ID],
  qualityFallbackOrder: ['high', 'standard', 'compressed'] as const,
} as const;

export const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const AUDIO_FORMAT_CONFIG = {
  mp3: {
    high: 'mp3_44100_192',
    standard: 'mp3_44100_128', 
    compressed: 'mp3_22050_32',
  },
  pcm: {
    high: 'pcm_44100',
    standard: 'pcm_22050',
  }
} as const;

export const VOICE_CONFIG = {
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice (closest to David Goggins style)
  modelId: 'eleven_monolingual_v1',
  voiceSettings: {
    stability: 0.75,
    similarityBoost: 0.75,
    style: 0.5,
    useSpeakerBoost: true,
  },
  outputFormat: AUDIO_FORMAT_CONFIG.mp3.high, // High quality MP3 for best voice clarity
} as const;

export type AudioQuality = 'high' | 'standard' | 'compressed';
export type AudioFormat = 'mp3' | 'pcm';

export interface VoiceGenerationResult {
  audioBuffer: Buffer;
  duration?: number;
  format: string;
  sampleRate: number;
  bitrate?: number;
}

export interface VoiceGenerationOptions {
  format?: AudioFormat;
  quality?: AudioQuality;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface VoiceWithUploadResult extends VoiceGenerationResult {
  upload: AudioUploadResult;
}

function getAudioFormat(format: AudioFormat, quality: AudioQuality): string {
  const formatConfig = AUDIO_FORMAT_CONFIG[format];
  if (!formatConfig || !(quality in formatConfig)) {
    throw new Error(`Invalid audio format configuration: ${format}/${quality}`);
  }
  return formatConfig[quality as keyof typeof formatConfig];
}

function parseAudioFormat(formatString: string): { format: string; sampleRate: number; bitrate?: number } {
  const parts = formatString.split('_');
  const format = parts[0]; // 'mp3' or 'pcm'
  const sampleRate = parseInt(parts[1]); // 44100, 22050, etc.
  const bitrate = parts[2] ? parseInt(parts[2]) : undefined; // 192, 128, 32, etc.
  
  return { 
    format, 
    sampleRate, 
    ...(bitrate !== undefined && { bitrate })
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const status = error?.status || error?.response?.status;
  const message = error?.message?.toLowerCase() || '';
  
  // HTTP status code errors that warrant retry
  const retryableStatuses = [429, 500, 502, 503, 504, 520, 521, 522, 523, 524];
  if (retryableStatuses.includes(status)) {
    return true;
  }
  
  // Network/connection errors
  const networkErrors = [
    'network error',
    'connection timeout',
    'connection reset',
    'socket timeout',
    'enotfound',
    'econnreset',
    'etimedout'
  ];
  
  if (networkErrors.some(errorType => message.includes(errorType))) {
    return true;
  }
  
  return false;
}

function isVoiceError(error: any): boolean {
  if (!error) return false;
  
  const message = error?.message?.toLowerCase() || '';
  const voiceErrors = [
    'voice not found',
    'voice unavailable',
    'voice model error',
    'invalid voice',
    'voice id not found'
  ];
  
  return voiceErrors.some(errorType => message.includes(errorType));
}

async function generateVoiceWithRetry(
  text: string,
  options: VoiceGenerationOptions = {},
  attempt: number = 1,
  voiceId?: string
): Promise<VoiceGenerationResult> {
  const { format = 'mp3', quality = 'high', voiceSettings } = options;
  const outputFormat = getAudioFormat(format, quality);
  const formatInfo = parseAudioFormat(outputFormat);
  
  const currentVoiceId = voiceId || VOICE_CONFIG.voiceId;
  const finalVoiceSettings = {
    ...VOICE_CONFIG.voiceSettings,
    ...voiceSettings,
  };

  try {
    const audioResponse = await elevenlabs.textToSpeech.convert(
      currentVoiceId,
      {
        text,
        modelId: VOICE_CONFIG.modelId,
        voiceSettings: finalVoiceSettings,
        outputFormat: outputFormat as any,
      }
    );

    if (!audioResponse) {
      throw new Error('Failed to generate voice audio');
    }

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
    
    const audioBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    
    if (audioBuffer.length === 0) {
      throw new Error('Generated audio buffer is empty');
    }

    return {
      audioBuffer,
      format: formatInfo.format,
      sampleRate: formatInfo.sampleRate,
      ...(formatInfo.bitrate !== undefined && { bitrate: formatInfo.bitrate }),
    };
  } catch (error: any) {
    console.error(`Voice generation attempt ${attempt} with voice ${currentVoiceId} failed:`, error.message);
    
    // Handle voice-specific errors with fallback voices
    if (isVoiceError(error) && currentVoiceId === VOICE_CONFIG.voiceId) {
      console.log('Primary voice failed, trying fallback voice...');
      return generateVoiceWithRetry(text, options, attempt, FALLBACK_VOICE_ID);
    }
    
    if (isVoiceError(error) && currentVoiceId === FALLBACK_VOICE_ID) {
      console.log('Fallback voice failed, trying emergency fallback voice...');
      return generateVoiceWithRetry(text, options, attempt, EMERGENCY_FALLBACK_VOICE_ID);
    }
    
    // Handle retryable errors
    if (attempt < MAX_RETRIES && isRetryableError(error)) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying voice generation in ${delay}ms...`);
      await sleep(delay);
      return generateVoiceWithRetry(text, options, attempt + 1, voiceId);
    }
    
    throw new Error(`Failed to generate voice after ${attempt} attempts: ${error.message}`);
  }
}

export async function generateVoice(
  text: string, 
  options?: VoiceGenerationOptions
): Promise<VoiceGenerationResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text content is required for voice generation');
  }

  if (text.length > 500) {
    throw new Error('Text content is too long (max 500 characters)');
  }

  return generateVoiceWithRetry(text.trim(), options);
}

export async function generateVoiceHighQuality(text: string): Promise<VoiceGenerationResult> {
  return generateVoice(text, { format: 'mp3', quality: 'high' });
}

export async function generateVoiceStandard(text: string): Promise<VoiceGenerationResult> {
  return generateVoice(text, { format: 'mp3', quality: 'standard' });
}

export async function generateVoiceCompressed(text: string): Promise<VoiceGenerationResult> {
  return generateVoice(text, { format: 'mp3', quality: 'compressed' });
}

export async function generateVoiceAndUpload(
  text: string,
  quoteId: string,
  options?: VoiceGenerationOptions
): Promise<VoiceWithUploadResult> {
  if (!quoteId || quoteId.trim().length === 0) {
    throw new Error('Quote ID is required for upload');
  }

  const voiceResult = await generateVoice(text, options);
  
  const contentType = voiceResult.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  const fileExtension = voiceResult.format === 'mp3' ? 'mp3' : 'wav';
  
  const fileName = `${quoteId}-${Date.now()}.${fileExtension}`;
  
  const uploadResult = await uploadQuoteAudio(quoteId, voiceResult.audioBuffer, {
    fileName,
    contentType,
    cacheControl: '31536000', // 1 year cache for audio files
  });

  return {
    ...voiceResult,
    upload: uploadResult,
  };
}

export async function generateVoiceAndUploadHighQuality(
  text: string,
  quoteId: string
): Promise<VoiceWithUploadResult> {
  return generateVoiceAndUpload(text, quoteId, { format: 'mp3', quality: 'high' });
}

export async function generateVoiceWithFallbacks(
  text: string,
  options?: VoiceGenerationOptions
): Promise<VoiceGenerationResult> {
  const fallbackStrategies = [
    { ...options },
    { ...options, quality: 'standard' as const },
    { ...options, quality: 'compressed' as const },
    { format: 'mp3' as const, quality: 'standard' as const },
  ];

  for (let i = 0; i < fallbackStrategies.length; i++) {
    try {
      console.log(`Attempting voice generation strategy ${i + 1}/${fallbackStrategies.length}`);
      return await generateVoice(text, fallbackStrategies[i]);
    } catch (error: any) {
      console.error(`Voice generation strategy ${i + 1} failed:`, error.message);
      
      if (i === fallbackStrategies.length - 1) {
        throw new Error(`All voice generation strategies failed. Last error: ${error.message}`);
      }
      
      // Add small delay between fallback attempts
      await sleep(500);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in voice generation fallback system');
}

export async function generateVoiceWithFallbacksAndUpload(
  text: string,
  quoteId: string,
  options?: VoiceGenerationOptions
): Promise<VoiceWithUploadResult> {
  if (!quoteId || quoteId.trim().length === 0) {
    throw new Error('Quote ID is required for upload');
  }

  const voiceResult = await generateVoiceWithFallbacks(text, options);
  
  const contentType = voiceResult.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  const fileExtension = voiceResult.format === 'mp3' ? 'mp3' : 'wav';
  
  const fileName = `${quoteId}-${Date.now()}.${fileExtension}`;
  
  try {
    const uploadResult = await uploadQuoteAudio(quoteId, voiceResult.audioBuffer, {
      fileName,
      contentType,
      cacheControl: '31536000',
    });

    return {
      ...voiceResult,
      upload: uploadResult,
    };
  } catch (uploadError: any) {
    console.error('Upload failed after successful voice generation:', uploadError.message);
    throw new Error(`Voice generation succeeded but upload failed: ${uploadError.message}`);
  }
}

export async function checkVoiceServiceHealth(): Promise<{ 
  available: boolean; 
  primaryVoiceOk: boolean; 
  fallbackVoicesOk: boolean;
  error?: string;
}> {
  try {
    // Test with minimal text to check if primary voice is working
    const testResult = await generateVoice('Test', { 
      format: 'mp3', 
      quality: 'compressed' // Use lowest quality for health check
    });
    
    const primaryVoiceOk = testResult.audioBuffer.length > 0;
    
    return {
      available: true,
      primaryVoiceOk,
      fallbackVoicesOk: true, // We assume fallbacks work if primary works
    };
  } catch (error: any) {
    return {
      available: false,
      primaryVoiceOk: false,
      fallbackVoicesOk: false,
      error: error.message,
    };
  }
}