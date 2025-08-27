// Supabase database utilities for edge functions
// Adapted from src/lib/api/supabase.ts for edge runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { QuoteCategory } from './category-utils.ts';

export interface Quote {
  id: string;
  date_created: string;
  content: string;
  category: string;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuoteData {
  content: string;
  category: QuoteCategory;
  date_created: string;
  audio_url?: string | null;
  audio_duration?: number | null;
}

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export function createSupabaseClient(config: SupabaseConfig) {
  return createClient(config.url, config.serviceRoleKey);
}

export async function getTodaysQuote(
  supabaseClient: any,
  date?: string
): Promise<Quote | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseClient
    .from('quotes')
    .select('*')
    .eq('date_created', targetDate)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No quote found for the date
      return null;
    }
    throw new Error(
      `Failed to fetch quote for ${targetDate}: ${error.message}`
    );
  }

  return data;
}

export async function quoteExistsForDate(
  supabaseClient: any,
  date: string
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('quotes')
    .select('id')
    .eq('date_created', date)
    .single();

  if (error && error.code === 'PGRST116') {
    return false;
  }

  if (error) {
    throw new Error(`Failed to check quote existence: ${error.message}`);
  }

  return !!data;
}

export async function createQuote(
  supabaseClient: any,
  quoteData: CreateQuoteData
): Promise<Quote> {
  const { data, error } = await supabaseClient
    .from('quotes')
    .insert(quoteData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create quote: ${error.message}`);
  }

  if (!data) {
    throw new Error('Quote creation succeeded but no data returned');
  }

  return data;
}

export async function updateQuote(
  supabaseClient: any,
  id: string,
  updates: Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>>
): Promise<Quote> {
  const { data, error } = await supabaseClient
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update quote: ${error.message}`);
  }

  if (!data) {
    throw new Error('Quote update succeeded but no data returned');
  }

  return data;
}

export async function updateQuoteAudioUrl(
  supabaseClient: any,
  id: string,
  audioUrl: string,
  audioDuration?: number
): Promise<Quote> {
  const updates: any = { audio_url: audioUrl };
  if (audioDuration !== undefined) {
    updates.audio_duration = audioDuration;
  }

  return updateQuote(supabaseClient, id, updates);
}

export async function getQuotesByDateRange(
  supabaseClient: any,
  startDate: string,
  endDate: string
): Promise<Quote[]> {
  const { data, error } = await supabaseClient
    .from('quotes')
    .select('*')
    .gte('date_created', startDate)
    .lte('date_created', endDate)
    .order('date_created', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch quotes by date range: ${error.message}`);
  }

  return data || [];
}

export async function getAllQuotes(
  supabaseClient: any,
  limit?: number,
  offset?: number
): Promise<Quote[]> {
  let query = supabaseClient
    .from('quotes')
    .select('*')
    .order('date_created', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.range(offset, offset + (limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch quotes: ${error.message}`);
  }

  return data || [];
}

export async function getQuotesByCategory(
  supabaseClient: any,
  category: QuoteCategory
): Promise<Quote[]> {
  const { data, error } = await supabaseClient
    .from('quotes')
    .select('*')
    .eq('category', category)
    .order('date_created', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch quotes by category: ${error.message}`);
  }

  return data || [];
}

export async function deleteQuote(
  supabaseClient: any,
  id: string
): Promise<void> {
  const { error } = await supabaseClient.from('quotes').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete quote: ${error.message}`);
  }
}

export async function getQuoteCount(supabaseClient: any): Promise<number> {
  const { count, error } = await supabaseClient
    .from('quotes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get quote count: ${error.message}`);
  }

  return count || 0;
}

export async function validateSupabaseConnection(
  supabaseClient: any
): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('quotes').select('id').limit(1);

    return !error;
  } catch (error) {
    return false;
  }
}

export interface DatabaseHealthCheck {
  connected: boolean;
  quotesTableExists: boolean;
  totalQuotes: number;
  error?: string;
}

export async function checkDatabaseHealth(
  supabaseClient: any
): Promise<DatabaseHealthCheck> {
  try {
    const connected = await validateSupabaseConnection(supabaseClient);

    if (!connected) {
      return {
        connected: false,
        quotesTableExists: false,
        totalQuotes: 0,
        error: 'Failed to connect to database',
      };
    }

    const totalQuotes = await getQuoteCount(supabaseClient);

    return {
      connected: true,
      quotesTableExists: true,
      totalQuotes,
    };
  } catch (error: any) {
    return {
      connected: false,
      quotesTableExists: false,
      totalQuotes: 0,
      error: error.message,
    };
  }
}
