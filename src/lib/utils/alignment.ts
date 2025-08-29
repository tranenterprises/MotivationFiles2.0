// Client-side utilities for processing word alignment data
// Used for precise audio-text synchronization in the UI

import { WordAlignment } from '@/lib/types/types';

// Map alignment word indices to display word indices
// This handles cases where punctuation is attached in alignment but separate in display
export function createWordIndexMapping(
  displayWords: string[],
  alignmentWords: WordAlignment[]
): number[] {
  const mapping: number[] = [];
  let displayIndex = 0;

  // Safety check to prevent infinite loops
  const maxIterations =
    Math.max(alignmentWords.length, displayWords.length) * 2;
  let iterations = 0;

  for (
    let alignmentIndex = 0;
    alignmentIndex < alignmentWords.length;
    alignmentIndex++
  ) {
    iterations++;
    if (iterations > maxIterations) {
      console.error('🚨 Breaking out of mapping loop - too many iterations');
      break;
    }

    const alignmentWord = alignmentWords[alignmentIndex].word;

    if (displayIndex >= displayWords.length) {
      mapping.push(-1); // No more display words
      continue;
    }

    const displayWord = displayWords[displayIndex];
    // Direct match
    if (alignmentWord === displayWord) {
      mapping.push(displayIndex);
      displayIndex++;
    }
    // Alignment word might include punctuation
    else if (alignmentWord.replace(/[.,!?;:]$/, '') === displayWord) {
      mapping.push(displayIndex);
      displayIndex++;
    }
    // Handle contractions and special cases
    else if (alignmentWord.includes("'") && displayWord.includes("'")) {
      mapping.push(displayIndex);
      displayIndex++;
    } else {
      // Word mismatch - try to proceed gracefully
      mapping.push(displayIndex < displayWords.length ? displayIndex : -1);
      displayIndex++;
    }
  }

  return mapping;
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

// Enhanced version that maps alignment indices to display indices
export function findDisplayWordsAtTime(
  wordAlignment: WordAlignment[],
  displayWords: string[],
  currentTimeMs: number,
  highlightRange: number = 2
): number[] {
  if (!wordAlignment || wordAlignment.length === 0) {
    return [];
  }

  // Create mapping between alignment words and display words
  const indexMapping = createWordIndexMapping(displayWords, wordAlignment);

  // Find active alignment word indices
  const alignmentIndices = findWordsAtTime(
    wordAlignment,
    currentTimeMs,
    highlightRange
  );

  // Map to display indices
  const displayIndices = alignmentIndices
    .map(alignmentIndex => indexMapping[alignmentIndex])
    .filter(
      displayIndex => displayIndex >= 0 && displayIndex < displayWords.length
    );

  return displayIndices.sort((a, b) => a - b);
}

// New phrase-based highlighting with aggressive early highlighting - single phrase only
export function findDisplayPhrasesAtTime(
  wordAlignment: WordAlignment[],
  displayWords: string[],
  currentTimeMs: number,
  options: {
    bufferMs?: number;
    lookAheadMs?: number;
  } = {}
): number[] {
  const { bufferMs = 800, lookAheadMs = 200 } = options; // More aggressive timing

  if (!wordAlignment || wordAlignment.length === 0) {
    return [];
  }

  // Create mapping between alignment words and display words
  const indexMapping = createWordIndexMapping(displayWords, wordAlignment);

  // Very aggressive early start - begin highlighting well before speech
  const adjustedTimeMs = Math.max(0, currentTimeMs - bufferMs);

  // Find the word that will be active soonest (including future words)
  let targetWordIndex = -1;
  let earliestStartTime = Infinity;

  for (let i = 0; i < wordAlignment.length; i++) {
    const word = wordAlignment[i];

    // Look for words that are currently active or will be active soon
    if (
      word.endTime >= adjustedTimeMs &&
      word.startTime <= currentTimeMs + lookAheadMs
    ) {
      // Prioritize words that start earliest (including future ones)
      if (word.startTime < earliestStartTime) {
        earliestStartTime = word.startTime;
        targetWordIndex = i;
      }
    }
  }

  // If no upcoming word found, try to find the very first word if we're at the beginning
  if (targetWordIndex === -1 && currentTimeMs < 1000) {
    targetWordIndex = 0;
  }

  if (targetWordIndex === -1) {
    return [];
  }

  // Find the complete phrase boundaries around the target word
  const phraseIndices = getCurrentPhrase(
    wordAlignment,
    targetWordIndex,
    indexMapping,
    displayWords
  );

  return phraseIndices.sort((a, b) => a - b);
}

// Helper function to get only the current phrase (no overlaps) - optimized for better boundaries
function getCurrentPhrase(
  wordAlignment: WordAlignment[],
  activeIndex: number,
  indexMapping: number[],
  displayWords: string[]
): number[] {
  // Ensure valid activeIndex
  if (activeIndex < 0 || activeIndex >= wordAlignment.length) {
    return [];
  }

  // Find the start of the current phrase - look backwards until sentence/phrase boundary
  let phraseStart = activeIndex;
  for (let i = activeIndex - 1; i >= 0; i--) {
    const word = wordAlignment[i].word.toLowerCase().trim();
    // Stop at major sentence endings (but continue through commas for better flow)
    if (
      word.match(/[.!?]$/) ||
      word.match(/^(and|but|so|because|however|therefore|meanwhile)$/)
    ) {
      break;
    }
    phraseStart = i;
  }

  // Find the end of the current phrase - look forwards to natural pause points
  let phraseEnd = activeIndex;
  for (let i = activeIndex; i < wordAlignment.length; i++) {
    const word = wordAlignment[i].word.toLowerCase().trim();
    phraseEnd = i;

    // Stop after natural pause points (periods, exclamations, questions)
    // Include commas but don't stop there for more natural phrases
    if (word.match(/[.!?]$/)) {
      break;
    }

    // Stop at conjunctions that start new clauses (but include the current word)
    if (
      i > activeIndex &&
      word.match(/^(and|but|so|because|however|therefore|meanwhile)$/)
    ) {
      phraseEnd = i - 1;
      break;
    }

    // Limit phrase length to prevent very long highlights (max 15 words)
    if (i - phraseStart >= 14) {
      break;
    }
  }

  // Map alignment indices to display indices
  const displayIndices: number[] = [];
  for (let i = phraseStart; i <= phraseEnd; i++) {
    if (i >= 0 && i < indexMapping.length) {
      const displayIndex = indexMapping[i];
      if (displayIndex >= 0 && displayIndex < displayWords.length) {
        displayIndices.push(displayIndex);
      }
    }
  }

  // Remove duplicates and sort
  return [...new Set(displayIndices)].sort((a, b) => a - b);
}

// Removed unused expandToPhrases function

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
