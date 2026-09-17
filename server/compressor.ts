export interface CompressionResult {
  originalText: string;
  compressedText: string;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  reductionPct: number;
  removedSentences: string[];
  keptSentences: string[];
}

// Low signal boilerplate phrases to drop
const BOILERPLATE_PATTERNS = [
  /in this (overview|document|article|section|summary)/i,
  /as mentioned (earlier|above|previously)/i,
  /we will explore/i,
  /it is important to note that/i,
  /note that/i,
  /furthermore,/i,
  /it should be emphasized that/i,
];

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Standard approximation: ~4 characters per token or words * 1.3
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  return Math.max(1, Math.round((words * 0.75 + (chars / 4) * 0.25) * 1.15));
}

export function compressContext(
  text: string,
  query: string,
  level: 'standard' | 'aggressive' = 'standard'
): CompressionResult {
  if (!text || text.trim().length === 0) {
    return {
      originalText: '',
      compressedText: '',
      originalTokens: 0,
      compressedTokens: 0,
      tokensSaved: 0,
      reductionPct: 0,
      removedSentences: [],
      keptSentences: [],
    };
  }

  const originalTokens = estimateTokenCount(text);
  
  // Split into sentences
  const rawSentences = text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const queryTerms = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  const seenHashes = new Set<string>();
  const keptSentences: string[] = [];
  const removedSentences: string[] = [];

  for (const sentence of rawSentences) {
    // 1. Deduplication check (normalized representation)
    const norm = sentence.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortHash = norm.slice(0, 40);
    if (seenHashes.has(shortHash)) {
      removedSentences.push(`Duplicate: "${sentence.slice(0, 60)}..."`);
      continue;
    }
    seenHashes.add(shortHash);

    // 2. Boilerplate removal
    const isBoilerplate = BOILERPLATE_PATTERNS.some(p => p.test(sentence));
    if (isBoilerplate && sentence.length < 80) {
      removedSentences.push(`Filler/Boilerplate: "${sentence.slice(0, 60)}..."`);
      continue;
    }

    // 3. Sentence-level relevance filtering
    const sentLower = sentence.toLowerCase();
    let termMatches = 0;
    for (const term of queryTerms) {
      if (sentLower.includes(term)) termMatches++;
    }

    // In aggressive mode, prune sentences with 0 query term matches unless very informative
    if (level === 'aggressive') {
      if (termMatches === 0 && sentence.length < 90 && queryTerms.length > 0) {
        removedSentences.push(`Low relevance: "${sentence.slice(0, 60)}..."`);
        continue;
      }
    }

    // Clean inline filler words
    let cleanedSentence = sentence
      .replace(/^(additionally|furthermore|moreover|in fact|specifically),\s*/i, '')
      .replace(/it is worth noting that\s*/i, '');

    keptSentences.push(cleanedSentence);
  }

  const compressedText = keptSentences.join(' ');
  const compressedTokens = estimateTokenCount(compressedText);
  const tokensSaved = Math.max(0, originalTokens - compressedTokens);
  const reductionPct = originalTokens > 0
    ? parseFloat(((tokensSaved / originalTokens) * 100).toFixed(1))
    : 0;

  return {
    originalText: text,
    compressedText,
    originalTokens,
    compressedTokens,
    tokensSaved,
    reductionPct,
    removedSentences,
    keptSentences,
  };
}
