import fs from 'fs';
import path from 'path';
import {
  QueryExecutionResult,
  CacheEntry,
  OptimizationConfig,
  AggregatedMetrics,
} from './types.js';
import { DEFAULT_CONFIG } from './controller.js';

interface DBState {
  queries: QueryExecutionResult[];
  cacheEntries: CacheEntry[];
  config: OptimizationConfig;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'leanllm_db.json');

export class Database {
  private state: DBState;

  constructor() {
    this.state = this.load();
  }

  private load(): DBState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading database file, initializing fresh state:', e);
    }

    return {
      queries: [],
      cacheEntries: [],
      config: { ...DEFAULT_CONFIG },
    };
  }

  private persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  public getConfig(): OptimizationConfig {
    return { ...this.state.config };
  }

  public updateConfig(newConfig: Partial<OptimizationConfig>): OptimizationConfig {
    this.state.config = { ...this.state.config, ...newConfig };
    this.persist();
    return this.getConfig();
  }

  public getQueries(page = 1, limit = 50, search = ''): { queries: QueryExecutionResult[]; total: number } {
    let filtered = this.state.queries;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.query.toLowerCase().includes(q) ||
        item.optimized.answer.toLowerCase().includes(q) ||
        item.optimized.model.toLowerCase().includes(q)
      );
    }
    // Return newest first
    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    const startIndex = (page - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);
    return {
      queries: paginated,
      total: sorted.length,
    };
  }

  public getQueryById(id: string): QueryExecutionResult | undefined {
    return this.state.queries.find(q => q.id === id);
  }

  public saveQuery(queryResult: QueryExecutionResult): void {
    this.state.queries.unshift(queryResult);
    // Cap memory query log to 500
    if (this.state.queries.length > 500) {
      this.state.queries = this.state.queries.slice(0, 500);
    }
    this.persist();
  }

  public getCacheEntries(): CacheEntry[] {
    return this.state.cacheEntries;
  }

  public saveCacheEntries(entries: CacheEntry[]): void {
    this.state.cacheEntries = entries;
    this.persist();
  }

  public clearCache(): void {
    this.state.cacheEntries = [];
    this.persist();
  }

  public resetAll(): void {
    this.state.queries = [];
    this.state.cacheEntries = [];
    this.persist();
  }

  public getAggregatedMetrics(): AggregatedMetrics {
    const queries = this.state.queries;
    const totalQueries = queries.length;

    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        totalTokensSaved: 0,
        totalCostSaved: 0,
        baselineTotalCost: 0,
        optimizedTotalCost: 0,
        overallCostReductionPct: 0,
        overallTokenReductionPct: 0,
        avgLatencyBaselineMs: 0,
        avgLatencyOptimizedMs: 0,
        avgLatencyReductionPct: 0,
        cacheHitCount: 0,
        cacheHitRate: 0,
        llmCallsAvoided: 0,
        modelDistribution: {
          smallTierCount: 0,
          strongTierCount: 0,
          cacheBypassedCount: 0,
        },
        avgQualityScore: 0,
        activeCacheEntries: this.state.cacheEntries.length,
      };
    }

    let baselineTotalTokens = 0;
    let optimizedTotalTokens = 0;
    let baselineTotalCost = 0;
    let optimizedTotalCost = 0;
    let baselineTotalLatency = 0;
    let optimizedTotalLatency = 0;
    let cacheHitCount = 0;
    let smallTierCount = 0;
    let strongTierCount = 0;
    let qualityScoreSum = 0;

    for (const q of queries) {
      baselineTotalTokens += q.baseline.totalTokens;
      optimizedTotalTokens += q.optimized.totalTokens;
      baselineTotalCost += q.baseline.cost;
      optimizedTotalCost += q.optimized.cost;
      baselineTotalLatency += q.baseline.latencyMs;
      optimizedTotalLatency += q.optimized.latencyMs;
      qualityScoreSum += q.qualityScore;

      if (q.optimized.cacheHit) {
        cacheHitCount++;
      } else {
        if (q.optimized.routingDecision?.tier === 'small') {
          smallTierCount++;
        } else {
          strongTierCount++;
        }
      }
    }

    const totalTokensSaved = Math.max(0, baselineTotalTokens - optimizedTotalTokens);
    const overallTokenReductionPct = baselineTotalTokens > 0
      ? parseFloat(((totalTokensSaved / baselineTotalTokens) * 100).toFixed(1))
      : 0;

    const totalCostSaved = Math.max(0, baselineTotalCost - optimizedCost(optimizedTotalCost));
    function optimizedCost(c: number) { return c; }
    const overallCostReductionPct = baselineTotalCost > 0
      ? parseFloat(((totalCostSaved / baselineTotalCost) * 100).toFixed(1))
      : 0;

    const avgLatencyBaselineMs = Math.round(baselineTotalLatency / totalQueries);
    const avgLatencyOptimizedMs = Math.round(optimizedTotalLatency / totalQueries);
    const avgLatencyReductionPct = avgLatencyBaselineMs > 0
      ? parseFloat((((avgLatencyBaselineMs - avgLatencyOptimizedMs) / avgLatencyBaselineMs) * 100).toFixed(1))
      : 0;

    const cacheHitRate = parseFloat(((cacheHitCount / totalQueries) * 100).toFixed(1));
    const avgQualityScore = parseFloat((qualityScoreSum / totalQueries).toFixed(1));

    return {
      totalQueries,
      totalTokensSaved,
      totalCostSaved: parseFloat(totalCostSaved.toFixed(5)),
      baselineTotalCost: parseFloat(baselineTotalCost.toFixed(5)),
      optimizedTotalCost: parseFloat(optimizedTotalCost.toFixed(5)),
      overallCostReductionPct,
      overallTokenReductionPct,
      avgLatencyBaselineMs,
      avgLatencyOptimizedMs,
      avgLatencyReductionPct,
      cacheHitCount,
      cacheHitRate,
      llmCallsAvoided: cacheHitCount,
      modelDistribution: {
        smallTierCount,
        strongTierCount,
        cacheBypassedCount: cacheHitCount,
      },
      avgQualityScore,
      activeCacheEntries: this.state.cacheEntries.length,
    };
  }
}
