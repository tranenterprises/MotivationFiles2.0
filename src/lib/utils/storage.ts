import { supabase } from '../api/supabase';

const AUDIO_BUCKET = 'audio';

// Client-side storage utilities - READ-ONLY operations only
// All admin operations (upload, delete, bucket management) moved to server-side
// See src/lib/utils/storage-server.ts for admin functions

export function getAudioUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export { AUDIO_BUCKET };
