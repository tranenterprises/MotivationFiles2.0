// Client-side utilities for processing word alignment data
// Used for precise audio-text synchronization in the UI

import { WordAlignment } from '@/lib/types/types';

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

export function getWordAtTime(
  wordAlignment: WordAlignment[],
  currentTimeMs: number
): { word: WordAlignment; index: number } | null {
  if (!wordAlignment || wordAlignment.length === 0) {
    return null;
  }

  for (let i = 0; i < wordAlignment.length; i++) {
    const word = wordAlignment[i];

    // Check if current time falls within word timing
    if (currentTimeMs >= word.startTime && currentTimeMs <= word.endTime) {
      return { word, index: i };
    }
  }

  return null;
}

export function getProgressThroughWords(
  wordAlignment: WordAlignment[],
  currentTimeMs: number
): number {
  if (!wordAlignment || wordAlignment.length === 0) {
    return 0;
  }

  // Find the last word that has started
  let completedWords = 0;
  let currentWordProgress = 0;

  for (let i = 0; i < wordAlignment.length; i++) {
    const word = wordAlignment[i];

    if (currentTimeMs >= word.endTime) {
      // Word is completely finished
      completedWords = i + 1;
    } else if (currentTimeMs >= word.startTime) {
      // Currently speaking this word
      const wordDuration = word.endTime - word.startTime;
      const timeIntoWord = currentTimeMs - word.startTime;
      currentWordProgress = wordDuration > 0 ? timeIntoWord / wordDuration : 0;
      break;
    } else {
      // Haven't reached this word yet
      break;
    }
  }

  const totalWords = wordAlignment.length;
  const overallProgress = (completedWords + currentWordProgress) / totalWords;

  return Math.min(Math.max(overallProgress, 0), 1); // Clamp between 0 and 1
}

export function createWordHighlightEffect(
  wordAlignment: WordAlignment[],
  currentTimeMs: number,
  effectConfig: {
    activeRange?: number;
    fadeRange?: number;
    intensityMultiplier?: number;
  } = {}
): Array<{ index: number; intensity: number; isActive: boolean }> {
  const {
    activeRange = 1,
    fadeRange = 2,
    intensityMultiplier = 1.0,
  } = effectConfig;

  if (!wordAlignment || wordAlignment.length === 0) {
    return [];
  }

  const currentWord = getWordAtTime(wordAlignment, currentTimeMs);
  const effects: Array<{
    index: number;
    intensity: number;
    isActive: boolean;
  }> = [];

  if (!currentWord) {
    return effects;
  }

  const currentIndex = currentWord.index;
  const totalRange = activeRange + fadeRange;

  // Calculate effects for surrounding words
  for (
    let i = Math.max(0, currentIndex - totalRange);
    i < Math.min(wordAlignment.length, currentIndex + totalRange + 1);
    i++
  ) {
    const distance = Math.abs(i - currentIndex);
    let intensity = 0;
    let isActive = false;

    if (distance <= activeRange) {
      // Full intensity for active words
      intensity = 1.0 * intensityMultiplier;
      isActive = true;
    } else if (distance <= activeRange + fadeRange) {
      // Fade effect for surrounding words
      const fadeDistance = distance - activeRange;
      intensity = (1 - fadeDistance / fadeRange) * 0.6 * intensityMultiplier;
      isActive = false;
    }

    if (intensity > 0) {
      effects.push({ index: i, intensity, isActive });
    }
  }

  return effects;
}

// Fallback function for quotes without alignment data
export function createSimpleHighlightEffect(
  words: string[],
  currentTimeSeconds: number,
  totalDurationSeconds: number,
  highlightRange: number = 3
): number[] {
  if (!words.length || totalDurationSeconds <= 0) {
    return [];
  }

  const progress = Math.min(currentTimeSeconds / totalDurationSeconds, 1);
  const currentWordIndex = Math.floor(progress * words.length);

  const startIndex = Math.max(0, currentWordIndex - highlightRange);
  const endIndex = Math.min(
    words.length,
    currentWordIndex + highlightRange + 1
  );

  return Array.from(
    { length: endIndex - startIndex },
    (_, i) => startIndex + i
  );
}
