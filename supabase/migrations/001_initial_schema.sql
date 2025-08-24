-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the date column for faster queries
CREATE INDEX idx_quotes_date ON quotes(date DESC);

-- Create an index on the category column for filtering
CREATE INDEX idx_quotes_category ON quotes(category);

-- Add a constraint to ensure content is not empty
ALTER TABLE quotes ADD CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0);

-- Add a constraint to ensure category is not empty
ALTER TABLE quotes ADD CONSTRAINT check_category_not_empty CHECK (LENGTH(TRIM(category)) > 0);

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all quotes (for the app's public nature)
CREATE POLICY "Allow public read access" ON quotes
FOR SELECT USING (true);

-- Policy: Allow service role to insert/update quotes (for automated content generation)
CREATE POLICY "Allow service role full access" ON quotes
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Prevent public insert/update/delete (only service role can modify)
CREATE POLICY "Prevent public modifications" ON quotes
FOR INSERT WITH CHECK (false);

CREATE POLICY "Prevent public updates" ON quotes
FOR UPDATE USING (false);

CREATE POLICY "Prevent public deletes" ON quotes
FOR DELETE USING (false);