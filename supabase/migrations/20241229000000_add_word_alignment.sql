-- Add word_alignment column to store ElevenLabs alignment data
-- This will enable precise word-level synchronization with audio playback

ALTER TABLE quotes 
ADD COLUMN word_alignment JSONB DEFAULT NULL;

-- Add index for better query performance on word alignment data
CREATE INDEX IF NOT EXISTS idx_quotes_word_alignment 
ON quotes USING gin (word_alignment);

-- Add comment to document the column structure
COMMENT ON COLUMN quotes.word_alignment IS 'JSON array of word alignment data from ElevenLabs with character-level timestamps for precise audio synchronization';

-- Example structure for word_alignment:
-- [
--   {
--     "word": "Hello",
--     "startTime": 0,
--     "endTime": 500,
--     "characters": [
--       {"char": "H", "startTime": 0, "duration": 100},
--       {"char": "e", "startTime": 100, "duration": 80},
--       ...
--     ]
--   },
--   ...
-- ]