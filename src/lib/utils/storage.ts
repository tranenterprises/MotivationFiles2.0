import { supabaseAdmin } from '../api/supabase';

const AUDIO_BUCKET = 'audio';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface UploadAudioOptions {
  fileName?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface AudioUploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  if (!error) return false;

  const status = error?.status || error?.response?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function generateAudioFileName(
  quoteId: string,
  format: string = 'mp3'
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `quotes/${timestamp}-${quoteId}.${format}`;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function uploadAudioWithRetry(
  audioBuffer: Buffer,
  filePath: string,
  options: UploadAudioOptions = {},
  attempt: number = 1
): Promise<AudioUploadResult> {
  const {
    contentType = 'audio/mpeg',
    cacheControl = '3600',
    upsert = true,
  } = options;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, audioBuffer, {
        contentType,
        cacheControl,
        upsert,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('Upload succeeded but no path returned');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return {
      url: urlData.publicUrl,
      path: data.path,
      fileName: filePath.split('/').pop() || filePath,
      size: audioBuffer.length,
    };
  } catch (error: any) {
    console.error(`Audio upload attempt ${attempt} failed:`, error.message);

    if (attempt < MAX_RETRIES && isRetryableError(error)) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying audio upload in ${delay}ms...`);
      await sleep(delay);
      return uploadAudioWithRetry(audioBuffer, filePath, options, attempt + 1);
    }

    throw new Error(
      `Failed to upload audio after ${attempt} attempts: ${error.message}`
    );
  }
}

export async function uploadQuoteAudio(
  quoteId: string,
  audioBuffer: Buffer,
  options: UploadAudioOptions = {}
): Promise<AudioUploadResult> {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio buffer is required and cannot be empty');
  }

  if (!quoteId || quoteId.trim().length === 0) {
    throw new Error('Quote ID is required');
  }

  const { fileName, ...uploadOptions } = options;
  const filePath = fileName
    ? `quotes/${sanitizeFileName(fileName)}`
    : generateAudioFileName(quoteId);

  return uploadAudioWithRetry(audioBuffer, filePath, uploadOptions);
}

export async function deleteAudioFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(AUDIO_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete audio file: ${error.message}`);
    }
  } catch (error: any) {
    console.error(`Failed to delete audio file ${filePath}:`, error.message);
    throw error;
  }
}

export async function getAudioFileInfo(
  filePath: string
): Promise<{ size: number; lastModified: Date } | null> {
  try {
    const fileName = filePath.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid file path');
    }

    const { data, error } = await supabaseAdmin.storage
      .from(AUDIO_BUCKET)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: fileName,
      });

    if (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }

    const file = data?.find(f => f.name === fileName);

    if (!file) {
      return null;
    }

    return {
      size: file.metadata?.size || 0,
      lastModified: new Date(file.updated_at || file.created_at),
    };
  } catch (error: any) {
    console.error(
      `Failed to get audio file info for ${filePath}:`,
      error.message
    );
    return null;
  }
}

export async function ensureAudioBucketExists(): Promise<void> {
  try {
    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === AUDIO_BUCKET);

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        AUDIO_BUCKET,
        {
          public: true,
          allowedMimeTypes: [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
          ],
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        }
      );

      if (createError) {
        throw new Error(
          `Failed to create audio bucket: ${createError.message}`
        );
      }

      console.log(`Audio bucket '${AUDIO_BUCKET}' created successfully`);
    }
  } catch (error: any) {
    console.error('Failed to ensure audio bucket exists:', error.message);
    throw error;
  }
}

export function getAudioUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export { AUDIO_BUCKET };
