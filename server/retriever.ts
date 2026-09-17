import { KnowledgeChunk } from './types.js';
import { KNOWLEDGE_BASE } from './knowledgeBase.js';
import { getEmbedding, cosineSimilarity } from './embedding.js';

export interface ScoredChunk {
  chunk: KnowledgeChunk;
  crossScore: number;
  semanticSim: number;
  lexicalScore: number;
  isKept: boolean;
}

export interface PruningResult {
  isApplicable: boolean;
  allCandidates: ScoredChunk[];
  keptChunks: ScoredChunk[];
  prunedChunks: ScoredChunk[];
  originalTokens: number;
  keptTokens: number;
  prunedTokens: number;
}

// Simple lexical scorer based on query token frequencies
function computeLexicalScore(query: string, text: string, title: string): number {
  const queryTerms = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return 0;

  const docText = text.toLowerCase();
  const docTitle = title.toLowerCase();

  let hits = 0;
  for (const term of queryTerms) {
    if (docTitle.includes(term)) hits += 3;
    const count = (docText.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
    hits += Math.min(count, 4);
  }

  return Math.min(1.0, hits / (queryTerms.length * 2.5));
}

export async function retrieveAndPruneContext(
  query: string,
  topK = 2,
  pool: KnowledgeChunk[] = KNOWLEDGE_BASE
): Promise<PruningResult> {
  const queryEmbedding = await getEmbedding(query);

  const scored: ScoredChunk[] = [];

  for (const chunk of pool) {
    const chunkEmbedding = await getEmbedding(`${chunk.title}. ${chunk.text}`);
    const semanticSim = cosineSimilarity(queryEmbedding, chunkEmbedding);
    const lexicalScore = computeLexicalScore(query, chunk.text, chunk.title);

    // Cross-scoring formula
    const crossScore = parseFloat((0.60 * semanticSim + 0.40 * lexicalScore).toFixed(4));

    scored.push({
      chunk,
      crossScore,
      semanticSim: parseFloat(semanticSim.toFixed(4)),
      lexicalScore: parseFloat(lexicalScore.toFixed(4)),
      isKept: false,
    });
  }

  // Sort descending by crossScore
  scored.sort((a, b) => b.crossScore - a.crossScore);

  const topMatch = scored[0];
  const isApplicable =
    !!topMatch &&
    ((topMatch.lexicalScore >= 0.15 && topMatch.semanticSim >= 0.35) ||
      topMatch.crossScore >= 0.42);

  if (!isApplicable) {
    return {
      isApplicable: false,
      allCandidates: [],
      keptChunks: [],
      prunedChunks: [],
      originalTokens: 0,
      keptTokens: 0,
      prunedTokens: 0,
    };
  }

  // Take candidate pool of top 6, then prune down to topK
  const candidatePool = scored.slice(0, 6);

  const keptChunks: ScoredChunk[] = [];
  const prunedChunks: ScoredChunk[] = [];

  candidatePool.forEach((item, index) => {
    if (index < topK) {
      item.isKept = true;
      keptChunks.push(item);
    } else {
      item.isKept = false;
      prunedChunks.push(item);
    }
  });

  const originalTokens = candidatePool.reduce((acc, c) => acc + c.chunk.tokenEstimate, 0);
  const keptTokens = keptChunks.reduce((acc, c) => acc + c.chunk.tokenEstimate, 0);
  const prunedTokens = originalTokens - keptTokens;

  return {
    isApplicable: true,
    allCandidates: candidatePool,
    keptChunks,
    prunedChunks,
    originalTokens,
    keptTokens,
    prunedTokens,
  };
}
