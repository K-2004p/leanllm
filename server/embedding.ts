import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch {
      geminiClient = null;
    }
  }
  return geminiClient;
}

const VECTOR_DIM = 256;

// Deterministic hash to bucket
function hashString(str: string, seed = 0): number {
  let h = seed ^ 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
    h ^= h >>> 15;
  }
  return Math.abs(h);
}

// Stop words for semantic focus
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'can', 'could', 'should', 'would', 'may', 'might', 'must', 'will',
  'you', 'your', 'i', 'me', 'my', 'we', 'our', 'it', 'its', 'tell',
  'give', 'explain', 'please', 'what', 'how', 'why', 'who', 'when',
  'where', 'which', 'can', 'you', 'briefly', 'summarize', 'detail'
]);

/**
 * High-precision semantic vector generation.
 * Uses stemming-like normalization, word n-grams, character 3-grams, and semantic weighting.
 */
export function generateLocalSemanticEmbedding(text: string): number[] {
  const vec = new Float64Array(VECTOR_DIM);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const rawWords = normalized.split(/\s+/).filter(Boolean);
  
  if (rawWords.length === 0) {
    return Array.from(vec);
  }

  // 1. Content words (boosted weight)
  const contentWords = rawWords.filter(w => !STOP_WORDS.has(w) && w.length > 2);
  const wordsToUse = contentWords.length > 0 ? contentWords : rawWords;

  // Unigrams
  for (const word of wordsToUse) {
    // Normalization/stemming approximation
    const stem = word.endsWith('ing') ? word.slice(0, -3) :
                 word.endsWith('tion') ? word.slice(0, -4) :
                 word.endsWith('ed') ? word.slice(0, -2) :
                 word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word;

    const idx = hashString(stem, 101) % VECTOR_DIM;
    const sign = (hashString(stem, 202) % 2 === 0) ? 1 : -1;
    const weight = STOP_WORDS.has(word) ? 0.3 : 1.8;
    vec[idx] += sign * weight;

    // Character 3-grams for typo tolerance and near-matches
    for (let i = 0; i <= word.length - 3; i++) {
      const tri = word.slice(i, i + 3);
      const triIdx = hashString(tri, 303) % VECTOR_DIM;
      const triSign = (hashString(tri, 404) % 2 === 0) ? 1 : -1;
      vec[triIdx] += triSign * 0.45;
    }
  }

  // Bigrams for sequential phrase matching
  for (let i = 0; i < wordsToUse.length - 1; i++) {
    const bi = `${wordsToUse[i]}_${wordsToUse[i + 1]}`;
    const biIdx = hashString(bi, 505) % VECTOR_DIM;
    const biSign = (hashString(bi, 606) % 2 === 0) ? 1 : -1;
    vec[biIdx] += biSign * 2.2;
  }

  // Key domain concept boosts
  const domainConcepts = [
    'flashattention', 'pagedattention', 'quantization', 'awq', 'gptq',
    'speculative decoding', 'kv cache', 'compression', 'reranking',
    'continuous batching', 'rope', 'memory', 'hbm', 'sram', 'latency',
    'throughput', 'tokens', 'cost'
  ];

  for (const concept of domainConcepts) {
    if (normalized.includes(concept)) {
      const cIdx = hashString(concept, 707) % VECTOR_DIM;
      vec[cIdx] += 3.5;
    }
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 1e-9) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

const embeddingMemoryCache = new Map<string, number[]>();

export async function getEmbedding(text: string): Promise<number[]> {
  const normalized = text.trim();
  if (embeddingMemoryCache.has(normalized)) {
    return embeddingMemoryCache.get(normalized)!;
  }

  const client = getGeminiClient();
  if (client) {
    try {
      const result = await client.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: normalized,
      });
      // Return values if available
      const values = (result as any)?.embeddings?.[0]?.values || (result as any)?.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        embeddingMemoryCache.set(normalized, values);
        return values;
      }
    } catch (e: any) {
      console.warn('Embedding API fallback to local vectorizer:', e?.message || e);
    }
  }
  const localVec = generateLocalSemanticEmbedding(normalized);
  embeddingMemoryCache.set(normalized, localVec);
  return localVec;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-9) return 0;
  const sim = dot / denom;
  // Bound to [0, 1]
  return Math.max(0, Math.min(1, sim));
}
