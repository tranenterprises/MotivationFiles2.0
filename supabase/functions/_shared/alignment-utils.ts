// Alignment utilities for processing ElevenLabs WebSocket response data
// Converts character-level alignment to word-level alignment for UI synchronization

export interface ElevenLabsAlignment {
  charStartTimesMs: number[];
  charsDurationsMs: number[];
  chars: string[];
}

export interface WordAlignment {
  word: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  characters: {
    char: string;
    startTime: number;
    duration: number;
  }[];
}

export function processAlignmentData(
  text: string,
  alignmentData: ElevenLabsAlignment
): WordAlignment[] {
  const { charStartTimesMs, charsDurationsMs, chars } = alignmentData;

  if (!charStartTimesMs || !charsDurationsMs || !chars) {
    console.warn('Invalid alignment data provided');
    return [];
  }

  if (
    charStartTimesMs.length !== charsDurationsMs.length ||
    charStartTimesMs.length !== chars.length
  ) {
    console.warn('Alignment data arrays have mismatched lengths');
    return [];
  }

  const words: WordAlignment[] = [];
  let currentWordChars: {
    char: string;
    startTime: number;
    duration: number;
  }[] = [];
  let currentWord = '';
  let wordStartTime = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const startTime = charStartTimesMs[i];
    const duration = charsDurationsMs[i];

    // Start new word if this is the first character or if we hit a space
    if (currentWord === '' && char.trim() !== '') {
      wordStartTime = startTime;
      currentWord = char;
      currentWordChars = [{ char, startTime, duration }];
    }
    // Continue building current word
    else if (char.trim() !== '' && char !== ' ') {
      currentWord += char;
      currentWordChars.push({ char, startTime, duration });
    }
    // End current word when we hit a space or punctuation
    else if (currentWord !== '') {
      const wordEndTime =
        currentWordChars[currentWordChars.length - 1].startTime +
        currentWordChars[currentWordChars.length - 1].duration;

      words.push({
        word: currentWord.trim(),
        startTime: wordStartTime,
        endTime: wordEndTime,
        characters: [...currentWordChars],
      });

      // Reset for next word
      currentWord = '';
      currentWordChars = [];
    }
  }

  // Handle the last word if text doesn't end with space
  if (currentWord !== '') {
    const wordEndTime =
      currentWordChars[currentWordChars.length - 1].startTime +
      currentWordChars[currentWordChars.length - 1].duration;

    words.push({
      word: currentWord.trim(),
      startTime: wordStartTime,
      endTime: wordEndTime,
      characters: [...currentWordChars],
    });
  }

  console.log(`Processed ${words.length} words from alignment data`);
  return words;
}

export function findWordsAtTime(
  wordAlignment: WordAlignment[],
  currentTimeMs: number,
  highlightRange: number = 2
): number[] {
  if (!wordAlignment || wordAlignment.length === 0) {
    return [];
  }

  const highlightedWordIndices: number[] = [];

  for (let i = 0; i < wordAlignment.length; i++) {
    const word = wordAlignment[i];

    // Check if current time falls within word timing
    if (currentTimeMs >= word.startTime && currentTimeMs <= word.endTime) {
      // Add the current word and surrounding words for wave effect
      const startIndex = Math.max(0, i - highlightRange);
      const endIndex = Math.min(wordAlignment.length, i + highlightRange + 1);

      for (let j = startIndex; j < endIndex; j++) {
        if (!highlightedWordIndices.includes(j)) {
          highlightedWordIndices.push(j);
        }
      }
      break;
    }
  }

  return highlightedWordIndices.sort((a, b) => a - b);
}

export function validateAlignmentData(
  alignmentData: any
): alignmentData is ElevenLabsAlignment {
  return (
    alignmentData &&
    Array.isArray(alignmentData.charStartTimesMs) &&
    Array.isArray(alignmentData.charsDurationsMs) &&
    Array.isArray(alignmentData.chars) &&
    alignmentData.charStartTimesMs.length ===
      alignmentData.charsDurationsMs.length &&
    alignmentData.charStartTimesMs.length === alignmentData.chars.length
  );
}
