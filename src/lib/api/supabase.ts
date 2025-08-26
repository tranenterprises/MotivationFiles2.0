import { createClient } from '@supabase/supabase-js'
import { Quote } from '../types/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Database utility functions

/**
 * Get today's quote
 */
export async function getTodaysQuote(): Promise<Quote | null> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('date_created', today)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No quote found for today
      return null
    }
    throw new Error(`Failed to fetch today's quote: ${error.message}`)
  }

  return data
}

/**
 * Get all quotes in chronological order (newest first)
 */
export async function getAllQuotes(limit?: number, offset?: number): Promise<Quote[]> {
  let query = supabase
    .from('quotes')
    .select('*')
    .order('date_created', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  if (offset) {
    query = query.range(offset, offset + (limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch quotes: ${error.message}`)
  }

  return data || []
}

/**
 * Get quotes by category
 */
export async function getQuotesByCategory(category: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('category', category)
    .order('date_created', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch quotes by category: ${error.message}`)
  }

  return data || []
}

/**
 * Get quote by date
 */
export async function getQuoteByDate(date: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('date_created', date)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch quote by date: ${error.message}`)
  }

  return data
}

/**
 * Create a new quote (admin only - uses service role)
 */
export async function createQuote(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>): Promise<Quote> {
  const { data, error } = await supabaseAdmin
    .from('quotes')
    .insert(quote)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create quote: ${error.message}`)
  }

  return data
}

/**
 * Update an existing quote (admin only - uses service role)
 */
export async function updateQuote(id: string, updates: Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>>): Promise<Quote> {
  const { data, error } = await supabaseAdmin
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update quote: ${error.message}`)
  }

  return data
}

/**
 * Update quote audio URL (admin only - uses service role)
 */
export async function updateQuoteAudioUrl(id: string, audioUrl: string): Promise<Quote> {
  return updateQuote(id, { audio_url: audioUrl })
}

/**
 * Delete a quote (admin only - uses service role)
 */
export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('quotes')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete quote: ${error.message}`)
  }
}

/**
 * Check if quote exists for date
 */
export async function quoteExistsForDate(date: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('quotes')
    .select('id')
    .eq('date_created', date)
    .single()

  if (error && error.code === 'PGRST116') {
    return false
  }

  if (error) {
    throw new Error(`Failed to check quote existence: ${error.message}`)
  }

  return !!data
}

/**
 * Get total quote count
 */
export async function getQuoteCount(): Promise<number> {
  const { count, error } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw new Error(`Failed to get quote count: ${error.message}`)
  }

  return count || 0
}

/**
 * Get quotes within date range
 */
export async function getQuotesByDateRange(startDate: string, endDate: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .gte('date_created', startDate)
    .lte('date_created', endDate)
    .order('date_created', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch quotes by date range: ${error.message}`)
  }

  return data || []
}