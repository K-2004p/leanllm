import { CacheEntry } from './types.js';
import { getEmbedding, cosineSimilarity } from './embedding.js';

export interface CacheLookupResult {
  hit: boolean;
  entry?: CacheEntry;
  similarity: number;
  threshold: number;
}

export class SemanticCache {
  private entries: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;

  constructor(initialEntries: CacheEntry[] = []) {
    for (const e of initialEntries) {
      this.entries.set(e.id, e);
    }
  }

  public getAll(): CacheEntry[] {
    return Array.from(this.entries.values());
  }

  public async lookup(query: string, threshold = 0.92): Promise<CacheLookupResult> {
    if (this.entries.size === 0) {
      this.misses++;
      return { hit: false, similarity: 0, threshold };
    }

    const queryEmbedding = await getEmbedding(query);
    let bestSimilarity = -1;
    let bestEntry: CacheEntry | undefined;

    for (const entry of this.entries.values()) {
      const sim = cosineSimilarity(queryEmbedding, entry.embedding);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestEntry = entry;
      }
    }

    if (bestSimilarity >= threshold && bestEntry) {
      this.hits++;
      bestEntry.hitCount++;
      return {
        hit: true,
        entry: bestEntry,
        similarity: parseFloat(bestSimilarity.toFixed(4)),
        threshold,
      };
    }

    this.misses++;
    return {
      hit: false,
      entry: bestEntry,
      similarity: parseFloat(Math.max(0, bestSimilarity).toFixed(4)),
      threshold,
    };
  }

  public async insert(
    query: string,
    answer: string,
    model: string,
    tokens: number,
    cost: number,
    promptType?: string,
    imageUrl?: string
  ): Promise<CacheEntry> {
    const embedding = await getEmbedding(query);
    const id = `cache-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: CacheEntry = {
      id,
      query,
      embedding,
      answer,
      model,
      tokens,
      cost,
      timestamp: Date.now(),
      hitCount: 0,
      promptType,
      imageUrl,
    };
    this.entries.set(id, entry);
    return entry;
  }

  public clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    return {
      size: this.entries.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: parseFloat(hitRate.toFixed(1)),
    };
  }
}
