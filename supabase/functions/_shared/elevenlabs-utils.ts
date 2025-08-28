// ElevenLabs utilities for edge functions
// Adapted from src/lib/api/elevenlabs.ts for Deno runtime

import { ElevenLabsClient } from 'https://esm.sh/@elevenlabs/elevenlabs-js@0.8.0';
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

export function createElevenLabsClient(
  config: ElevenLabsConfig
): ElevenLabsClient {
  return new ElevenLabsClient({ apiKey: config.apiKey });
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
  elevenlabs: ElevenLabsClient,
  text: string,
  config: Partial<ElevenLabsConfig> = {},
  voiceId?: string
): Promise<VoiceGenerationResult> {
  const finalConfig = { ...DEFAULT_ELEVENLABS_CONFIG, ...config };
  const currentVoiceId = voiceId || finalConfig.voiceId!;
  const formatInfo = parseAudioFormat(finalConfig.outputFormat!);

  const audioResponse = await elevenlabs.textToSpeech.convert(currentVoiceId, {
    text,
    modelId: finalConfig.modelId!,
    voiceSettings: {
      ...finalConfig.voiceSettings!,
      ...config.voiceSettings,
    },
    outputFormat: finalConfig.outputFormat as any,
  });

  if (!audioResponse) {
    throw new Error('ElevenLabs returned empty audio response');
  }

  const audioBuffer = await BufferUtils.streamToUint8Array(audioResponse);

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
  elevenlabs: ElevenLabsClient,
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
  elevenlabs: ElevenLabsClient,
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
    voiceSettings,
  };

  const elevenlabs = createElevenLabsClient({ apiKey: elevenlabsApiKey });
  return generateVoiceWithRetry(elevenlabs, text, config);
}
