export interface OptimizationConfig {
  cacheEnabled: boolean;
  cacheThreshold: number;
  routingEnabled: boolean;
  routingComplexityThreshold: number;
  pruningEnabled: boolean;
  pruningTopK: number;
  compressionEnabled: boolean;
  compressionLevel: 'aggressive' | 'standard';
}

export interface AttachmentData {
  name: string;
  mimeType: string;
  size: number;
  base64?: string;
  previewUrl?: string;
  textExtract?: string;
  pageCount?: number;
  tokenEstimate?: number;
}

export interface ImageGenConfig {
  aspectRatio: '1:1' | '16:9' | '4:3' | '9:16';
  style?: string;
  prompt?: string;
}

export interface DecisionTraceStep {
  step: 'CACHE_CHECK' | 'MODEL_ROUTING' | 'RAG_RETRIEVAL' | 'CONTEXT_PRUNING' | 'CONTEXT_COMPRESSION' | 'INFERENCE' | 'QUALITY_EVALUATION' | 'MULTIMODAL_PARSING' | 'IMAGE_GENERATION';
  action: string;
  detail: string;
  timestamp: number;
  tokensSaved?: number;
  costSaved?: number;
  metadata?: Record<string, any>;
}

export interface QueryExecutionResult {
  id: string;
  query: string;
  timestamp: number;
  config: OptimizationConfig;
  promptType?: 'text' | 'pdf' | 'image' | 'image-gen' | 'code';
  attachment?: AttachmentData;
  imageGenConfig?: ImageGenConfig;
  optimized: {
    answer: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
    cacheHit: boolean;
    cacheSimilarity?: number;
    cachedQuery?: string;
    imageUrl?: string;
    routingDecision?: {
      score: number;
      model: string;
      tier: 'small' | 'strong';
      reason: string;
      features: string[];
    };
    ragDetails?: {
      candidatesRetrieved: number;
      chunksKept: number;
      chunksPruned: number;
      originalRagTokens: number;
      prunedRagTokens: number;
      keptChunkTitles: string[];
    };
    compressionDetails?: {
      preCompressionTokens: number;
      postCompressionTokens: number;
      tokensSaved: number;
      reductionPct: number;
    };
    decisionTrace: DecisionTraceStep[];
  };
  baseline: {
    answer: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
    contextTokens: number;
    imageUrl?: string;
  };
  savings: {
    tokensSaved: number;
    tokenReductionPct: number;
    costSaved: number;
    costReductionPct: number;
    latencyDeltaMs: number;
    llmCallsAvoided: number;
  };
  qualityScore: number;
  qualityExplanation: string;
  isSimulated: boolean;
}

export interface AggregatedMetrics {
  totalQueries: number;
  totalTokensSaved: number;
  totalCostSaved: number;
  baselineTotalCost: number;
  optimizedTotalCost: number;
  overallCostReductionPct: number;
  overallTokenReductionPct: number;
  avgLatencyBaselineMs: number;
  avgLatencyOptimizedMs: number;
  avgLatencyReductionPct: number;
  cacheHitCount: number;
  cacheHitRate: number;
  llmCallsAvoided: number;
  modelDistribution: {
    smallTierCount: number;
    strongTierCount: number;
    cacheBypassedCount: number;
  };
  avgQualityScore: number;
  activeCacheEntries: number;
}

export interface SeedQueryItem {
  id: string;
  query: string;
  category: 'simple' | 'complex' | 'near-duplicate' | 'rag-intensive';
  description: string;
  expectedBehavior: string;
}

export interface KnowledgeChunk {
  id: string;
  title: string;
  category: string;
  text: string;
  tokenEstimate: number;
}

export interface CacheEntry {
  id: string;
  query: string;
  embedding: number[];
  answer: string;
  model: string;
  tokensSaved: number;
  hitCount: number;
  timestamp: number;
}

export type NavTab = 'overview' | 'requests' | 'optimization' | 'models' | 'cache' | 'rag' | 'analytics' | 'settings';

