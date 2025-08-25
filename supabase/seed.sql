-- Seed file for Daily Motivation Voice App
-- This file contains sample quotes for testing and development

-- Insert sample quotes with different categories
INSERT INTO quotes (date, content, category, audio_url) VALUES
  ('2024-08-25', 'Stay hard! The only person you need to be better than is who you were yesterday. Every single day, you wake up and you have a choice to make: are you going to be the person who makes excuses, or are you going to be the person who finds a way?', 'motivation', null),
  ('2024-08-24', 'Discipline equals freedom. The more disciplined you become, the more freedom you will have. It''s not about being perfect, it''s about being consistent.', 'discipline', null),
  ('2024-08-23', 'When you think you''re done, you''re only at 40% of your actual capacity. Your mind will quit a thousand times before your body will. Push through that voice in your head telling you to quit.', 'grindset', null),
  ('2024-08-22', 'Life is not about finding yourself. Life is about creating yourself. You have the power to write your own story, to become the person you want to be.', 'reflection', null),
  ('2024-08-21', 'Wisdom comes from experience, and experience comes from bad decisions. Learn from your mistakes, but don''t let them define you. Use them as fuel to become stronger.', 'wisdom', null),
  ('2024-08-20', 'The cookie jar is your past accomplishments. When life gets hard, when you want to quit, reach into that cookie jar and remind yourself of all the hard things you''ve already done.', 'motivation', null),
  ('2024-08-19', 'You can''t control what happens to you, but you can control how you react to it. Your reaction is your power. Choose to respond with strength, not weakness.', 'discipline', null),
  ('2024-08-18', 'The grind never stops. When others are sleeping, you''re working. When others are partying, you''re improving. That''s the difference between average and extraordinary.', 'grindset', null),
  ('2024-08-17', 'Take time to reflect on your journey. Where did you start? How far have you come? Sometimes we''re so focused on the destination that we forget to appreciate the progress.', 'reflection', null),
  ('2024-08-16', 'True wisdom is knowing that you know nothing. Stay humble, stay curious, and never stop learning. The moment you think you know everything is the moment you stop growing.', 'wisdom', null);

-- Insert some quotes with audio URLs to test the audio functionality
INSERT INTO quotes (date, content, category, audio_url) VALUES
  ('2024-08-15', 'I don''t stop when I''m tired. I stop when I''m done. And I''m never done getting better, never done pushing myself to the limits of what I thought was possible.', 'motivation', 'https://example.com/audio/motivation_aug15.mp3'),
  ('2024-08-14', 'Be comfortable being uncomfortable. Growth happens outside your comfort zone. Embrace the struggle, embrace the pain, because that''s where transformation begins.', 'discipline', 'https://example.com/audio/discipline_aug14.mp3');