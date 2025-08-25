export interface Quote {
  id: string
  date_created: string
  content: string
  category: string
  audio_url: string | null
  audio_duration: number | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      quotes: {
        Row: Quote
        Insert: Omit<Quote, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}