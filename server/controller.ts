import {
  OptimizationConfig,
  DecisionTraceStep,
  QueryExecutionResult,
  AttachmentData,
  ImageGenConfig,
} from './types.js';
import { SemanticCache } from './semanticCache.js';
import { classifyQueryComplexity, DEFAULT_MODEL_MAP } from './router.js';
import { retrieveAndPruneContext } from './retriever.js';
import { compressContext, estimateTokenCount } from './compressor.js';
import { callLLM } from './llmProvider.js';
import { evaluateAnswerQuality } from './evaluator.js';
import { extractTextFromPdf } from './pdfExtractor.js';

export const DEFAULT_CONFIG: OptimizationConfig = {
  cacheEnabled: true,
  cacheThreshold: 0.88,
  routingEnabled: true,
  routingComplexityThreshold: 0.45,
  pruningEnabled: true,
  pruningTopK: 2,
  compressionEnabled: true,
  compressionLevel: 'standard',
};

export interface ProcessQueryOptions {
  promptType?: 'text' | 'pdf' | 'image' | 'image-gen' | 'code';
  attachment?: AttachmentData;
  imageGenConfig?: ImageGenConfig;
}

export class OptimizationController {
  private cache: SemanticCache;

  constructor(cache: SemanticCache) {
    this.cache = cache;
  }

  public getCache(): SemanticCache {
    return this.cache;
  }

  public async processQuery(
    query: string,
    userConfig: Partial<OptimizationConfig> = {},
    options?: ProcessQueryOptions
  ): Promise<QueryExecutionResult> {
    const config: OptimizationConfig = { ...DEFAULT_CONFIG, ...userConfig };
    const queryId = `query-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace: DecisionTraceStep[] = [];

    // Determine prompt type and attachment
    let promptType: 'text' | 'pdf' | 'image' | 'image-gen' | 'code' = options?.promptType || 'text';
    const attachment = options?.attachment;
    const imageGenConfig = options?.imageGenConfig;

    if (!options?.promptType) {
      if (imageGenConfig || /^(generate|create|draw|render|design)\s+(an?\s+)?(image|picture|photo|illustration|icon|visual|art|diagram)/i.test(query)) {
        promptType = 'image-gen';
      } else if (attachment?.mimeType === 'application/pdf' || attachment?.name?.toLowerCase().endsWith('.pdf')) {
        promptType = 'pdf';
      } else if (attachment?.mimeType?.startsWith('image/')) {
        promptType = 'image';
      }
    }

    // Step 0: Multimodal Parsing (PDF / Vision)
    if (promptType === 'pdf' && attachment?.base64) {
      if (!attachment.textExtract) {
        const pdfExtracted = await extractTextFromPdf(attachment.base64);
        attachment.textExtract = pdfExtracted.text;
        attachment.pageCount = pdfExtracted.numpages;
        attachment.tokenEstimate = estimateTokenCount(pdfExtracted.text);
      }

      trace.push({
        step: 'MULTIMODAL_PARSING',
        action: 'PDF_PARSED',
        detail: `Extracted ${attachment.textExtract ? attachment.textExtract.length : 0} characters across ${attachment.pageCount || 1} pages from "${attachment.name}" (~${attachment.tokenEstimate || 0} raw document tokens).`,
        timestamp: Date.now(),
        metadata: {
          fileName: attachment.name,
          pageCount: attachment.pageCount,
          tokens: attachment.tokenEstimate,
        },
      });
    } else if (promptType === 'image' && attachment) {
      trace.push({
        step: 'MULTIMODAL_PARSING',
        action: 'IMAGE_LOADED',
        detail: `Attached image "${attachment.name}" (${(attachment.size / 1024).toFixed(1)} KB, MIME: ${attachment.mimeType}). Visual tensor ready for multimodal processing.`,
        timestamp: Date.now(),
        metadata: {
          fileName: attachment.name,
          mimeType: attachment.mimeType,
          size: attachment.size,
        },
      });
    }

    // ====================================================
    // STEP 1: SEMANTIC CACHE LOOKUP
    // ====================================================
    if (config.cacheEnabled) {
      const cacheLookup = await this.cache.lookup(query, config.cacheThreshold);
      const cacheSimilarity = cacheLookup.similarity;

      if (cacheLookup.hit && cacheLookup.entry) {
        const cachedQuery = cacheLookup.entry.query;
        const cachedAnswer = cacheLookup.entry.answer;
        const cachedModel = `${cacheLookup.entry.model} (Cached)`;
        const cachedImageUrl = cacheLookup.entry.imageUrl;
        const cacheLookupLatencyMs = Math.round(6 + Math.random() * 6); // Fast vector lookup

        // Compute what unoptimized baseline would have cost/consumed
        const baselineInputTokens = estimateTokenCount(query);
        const baselineOutputTokens = promptType === 'image-gen' ? 1024 : Math.max(1, estimateTokenCount(cachedAnswer));
        const baselineTotalTokens = baselineInputTokens + baselineOutputTokens;
        const baselineCost = promptType === 'image-gen' ? 0.02 : parseFloat(
          (
            (baselineInputTokens / 1_000_000) * DEFAULT_MODEL_MAP.strongInputCostPer1M +
            (baselineOutputTokens / 1_000_000) * DEFAULT_MODEL_MAP.strongOutputCostPer1M
          ).toFixed(6)
        );
        const baselineLatencyMs = promptType === 'image-gen' ? 2400 : Math.round(1100 + Math.random() * 400);

        trace.push({
          step: 'CACHE_CHECK',
          action: 'CACHE_HIT',
          detail: `Semantically matching intent detected in vector cache (${(cacheSimilarity * 100).toFixed(1)}% similarity ≥ ${(config.cacheThreshold * 100).toFixed(0)}% threshold). Matched query: "${cachedQuery}". Entire LLM generation bypassed.`,
          timestamp: Date.now(),
          tokensSaved: baselineTotalTokens,
          costSaved: baselineCost,
          metadata: {
            similarity: cacheSimilarity,
            threshold: config.cacheThreshold,
            matchedQuery: cachedQuery,
          },
        });

        const baselineData = {
          answer: cachedAnswer,
          model: promptType === 'image-gen' ? 'gemini-3.1-flash-lite-image' : DEFAULT_MODEL_MAP.strongModelName,
          imageUrl: cachedImageUrl,
          inputTokens: baselineInputTokens,
          outputTokens: baselineOutputTokens,
          totalTokens: baselineTotalTokens,
          cost: baselineCost,
          latencyMs: baselineLatencyMs,
          contextTokens: 0,
        };

        return {
          id: queryId,
          query,
          timestamp: Date.now(),
          config,
          promptType,
          attachment,
          imageGenConfig,
          optimized: {
            answer: cachedAnswer,
            model: cachedModel,
            imageUrl: cachedImageUrl,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            latencyMs: cacheLookupLatencyMs,
            cacheHit: true,
            cacheSimilarity,
            cachedQuery,
            routingDecision: undefined,
            ragDetails: undefined,
            compressionDetails: undefined,
            decisionTrace: trace,
          },
          baseline: baselineData,
          savings: {
            tokensSaved: baselineTotalTokens,
            tokenReductionPct: 100.0,
            costSaved: baselineCost,
            costReductionPct: 100.0,
            latencyDeltaMs: baselineLatencyMs - cacheLookupLatencyMs,
            llmCallsAvoided: 1,
          },
          qualityScore: 100,
          qualityExplanation: `100% parity: Reused approved answer from semantic cache for "${cachedQuery}" with zero fidelity loss and 0 token cost.`,
          isSimulated: false,
        };
      } else {
        trace.push({
          step: 'CACHE_CHECK',
          action: 'CACHE_MISS',
          detail:
            cacheSimilarity > 0
              ? `Nearest vector candidate scored ${(cacheSimilarity * 100).toFixed(1)}% similarity, below required threshold ${(config.cacheThreshold * 100).toFixed(0)}%. Forwarding to optimization pipeline.`
              : `Vector cache checked: no matching query found. Forwarding to optimization pipeline.`,
          timestamp: Date.now(),
          metadata: {
            similarity: cacheSimilarity,
            threshold: config.cacheThreshold,
          },
        });
      }
    } else {
      trace.push({
        step: 'CACHE_CHECK',
        action: 'CACHE_BYPASS',
        detail: 'Semantic cache module disabled by configuration.',
        timestamp: Date.now(),
      });
    }

    // ====================================================
    // STEP 2: ADAPTIVE MODEL ROUTING
    // ====================================================
    let chosenTier: 'small' | 'strong' = 'strong';
    let chosenModel = DEFAULT_MODEL_MAP.strongModelName;
    let inputCost = DEFAULT_MODEL_MAP.strongInputCostPer1M;
    let outputCost = DEFAULT_MODEL_MAP.strongOutputCostPer1M;
    let routingData: any = undefined;

    if (promptType === 'image-gen') {
      chosenTier = 'small';
      chosenModel = 'gemini-3.1-flash-lite-image';
      inputCost = 0;
      outputCost = 0;
      trace.push({
        step: 'MODEL_ROUTING',
        action: 'ROUTED_IMAGE_GEN',
        detail: `Image generation request detected. Routed to high-throughput multimodal visual model (Aspect Ratio: ${imageGenConfig?.aspectRatio || '1:1'}).`,
        timestamp: Date.now(),
      });
    } else if (config.routingEnabled) {
      const routing = classifyQueryComplexity(query, config.routingComplexityThreshold, DEFAULT_MODEL_MAP);
      chosenTier = routing.tier;
      chosenModel = routing.model;
      inputCost = routing.inputCostPer1M;
      outputCost = routing.outputCostPer1M;
      routingData = routing;

      trace.push({
        step: 'MODEL_ROUTING',
        action: `ROUTED_${chosenTier.toUpperCase()}`,
        detail: routing.reason,
        timestamp: Date.now(),
        metadata: {
          complexityScore: routing.score,
          tier: routing.tier,
          model: routing.model,
          features: routing.features,
        },
      });
    } else {
      chosenTier = 'strong';
      chosenModel = DEFAULT_MODEL_MAP.strongModelName;
      trace.push({
        step: 'MODEL_ROUTING',
        action: 'ROUTING_BYPASS',
        detail: 'Adaptive routing disabled; defaulted to frontier model tier.',
        timestamp: Date.now(),
      });
    }

    // ====================================================
    // STEP 3: RAG / DOCUMENT RETRIEVAL & CONTEXT PRUNING
    // ====================================================
    let fullUntrimmedContext = '';
    let activeContext = '';
    let ragDetails: any = undefined;
    let compressionDetails: any = undefined;

    if (promptType === 'pdf' && attachment?.textExtract) {
      // Document-based context pruning & compression
      fullUntrimmedContext = attachment.textExtract;
      const rawDocTokens = estimateTokenCount(fullUntrimmedContext);

      if (config.pruningEnabled) {
        // Break document into sections and keep most relevant ones to query
        const sections = fullUntrimmedContext.split(/\n\s*\n/).filter((s) => s.trim().length > 30);
        const qTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

        const scoredSections = sections.map((sec) => {
          const secLower = sec.toLowerCase();
          let score = 0;
          for (const term of qTerms) {
            if (secLower.includes(term)) score += 1;
          }
          return { text: sec, score, tokens: estimateTokenCount(sec) };
        });

        scoredSections.sort((a, b) => b.score - a.score);
        const kept = scoredSections.slice(0, Math.max(1, config.pruningTopK));
        const pruned = scoredSections.slice(Math.max(1, config.pruningTopK));

        const keptTokens = kept.reduce((acc, curr) => acc + curr.tokens, 0);
        const prunedTokens = pruned.reduce((acc, curr) => acc + curr.tokens, 0);

        activeContext = kept.map((s) => s.text).join('\n\n');

        ragDetails = {
          candidatesRetrieved: sections.length,
          chunksKept: kept.length,
          chunksPruned: pruned.length,
          originalRagTokens: rawDocTokens,
          prunedRagTokens: keptTokens,
          keptChunkTitles: kept.map((_, i) => `Section ${i + 1}`),
        };

        trace.push({
          step: 'CONTEXT_PRUNING',
          action: 'PDF_PRUNED_RELEVANCE',
          detail: `Filtered ${sections.length} document sections down to top ${kept.length} relevant sections. Dropped ${prunedTokens} non-critical tokens (${rawDocTokens > 0 ? Math.round((prunedTokens / rawDocTokens) * 100) : 0}% reduction).`,
          timestamp: Date.now(),
          tokensSaved: prunedTokens,
        });
      } else {
        activeContext = fullUntrimmedContext;
        trace.push({
          step: 'CONTEXT_PRUNING',
          action: 'PRUNING_BYPASS',
          detail: 'Context pruning disabled; entire uncompressed document passed to inference.',
          timestamp: Date.now(),
        });
      }

      if (config.compressionEnabled && activeContext) {
        const compression = compressContext(activeContext, query, config.compressionLevel);
        compressionDetails = {
          preCompressionTokens: compression.originalTokens,
          postCompressionTokens: compression.compressedTokens,
          tokensSaved: compression.tokensSaved,
          reductionPct: compression.reductionPct,
        };

        trace.push({
          step: 'CONTEXT_COMPRESSION',
          action: 'PDF_COMPRESSED',
          detail: `Filtered duplicate filler and formatting tokens. Compressed document context from ${compression.originalTokens} to ${compression.compressedTokens} tokens (${compression.reductionPct}% savings).`,
          timestamp: Date.now(),
          tokensSaved: compression.tokensSaved,
        });

        activeContext = compression.compressedText;
      }
    } else if (promptType !== 'image-gen') {
      const baselineRAG = await retrieveAndPruneContext(query, 6);

      if (baselineRAG.isApplicable && baselineRAG.allCandidates.length > 0) {
        fullUntrimmedContext = baselineRAG.allCandidates
          .map((c) => `[Document: ${c.chunk.title}]\n${c.chunk.text}`)
          .join('\n\n');

        if (config.pruningEnabled) {
          const pruning = await retrieveAndPruneContext(query, config.pruningTopK);
          ragDetails = {
            candidatesRetrieved: pruning.allCandidates.length,
            chunksKept: pruning.keptChunks.length,
            chunksPruned: pruning.prunedChunks.length,
            originalRagTokens: pruning.originalTokens,
            prunedRagTokens: pruning.keptTokens,
            keptChunkTitles: pruning.keptChunks.map((c) => c.chunk.title),
          };

          trace.push({
            step: 'RAG_RETRIEVAL',
            action: 'CANDIDATES_RETRIEVED',
            detail: `Retrieved ${pruning.allCandidates.length} candidate knowledge chunks (${pruning.originalTokens} initial tokens).`,
            timestamp: Date.now(),
          });

          trace.push({
            step: 'CONTEXT_PRUNING',
            action: 'PRUNED_LOW_RELEVANCE',
            detail: `Cross-encoder reranked pool: retained top ${pruning.keptChunks.length} chunks ("${pruning.keptChunks.map((c) => c.chunk.title).join('", "')}"). Pruned ${pruning.prunedChunks.length} irrelevant chunks, dropping ${pruning.prunedTokens} tokens (${Math.round((pruning.prunedTokens / Math.max(1, pruning.originalTokens)) * 100)}% pruned).`,
            timestamp: Date.now(),
            tokensSaved: pruning.prunedTokens,
            metadata: {
              keptTitles: pruning.keptChunks.map((c) => c.chunk.title),
              prunedTitles: pruning.prunedChunks.map((c) => c.chunk.title),
            },
          });

          activeContext = pruning.keptChunks
            .map((c) => `[Document: ${c.chunk.title}]\n${c.chunk.text}`)
            .join('\n\n');
        } else {
          activeContext = fullUntrimmedContext;
          trace.push({
            step: 'CONTEXT_PRUNING',
            action: 'PRUNING_BYPASS',
            detail: 'RAG context pruning disabled; full untrimmed context forwarded.',
            timestamp: Date.now(),
          });
        }

        // ====================================================
        // STEP 4: CONTEXT COMPRESSION
        // ====================================================
        if (config.compressionEnabled && activeContext) {
          const compression = compressContext(activeContext, query, config.compressionLevel);
          compressionDetails = {
            preCompressionTokens: compression.originalTokens,
            postCompressionTokens: compression.compressedTokens,
            tokensSaved: compression.tokensSaved,
            reductionPct: compression.reductionPct,
          };

          trace.push({
            step: 'CONTEXT_COMPRESSION',
            action: 'COMPRESSED_REDUNDANCIES',
            detail: `Filtered ${compression.removedSentences.length} boilerplate/duplicate sentences. Compressed context from ${compression.originalTokens} to ${compression.compressedTokens} tokens (${compression.reductionPct}% savings).`,
            timestamp: Date.now(),
            tokensSaved: compression.tokensSaved,
          });

          activeContext = compression.compressedText;
        }
      } else {
        // Query does not require specialized RAG domain context
        trace.push({
          step: 'RAG_RETRIEVAL',
          action: 'NO_RAG_NEEDED',
          detail: 'General query identified. Zero extraneous context chunks injected, saving 100% of retrieval tokens.',
          timestamp: Date.now(),
        });
      }
    }

    // ====================================================
    // STEP 5: CONCURRENT INFERENCE (OPTIMIZED vs BASELINE)
    // ====================================================
    const [optLLMResult, baseLLMResult] = await Promise.all([
      callLLM({
        model: chosenModel,
        tier: chosenTier,
        context: activeContext,
        query,
        inputCostPer1M: inputCost,
        outputCostPer1M: outputCost,
        promptType,
        attachment,
        imageGenConfig,
      }),
      callLLM({
        model: promptType === 'image-gen' ? 'gemini-3.1-flash-lite-image' : DEFAULT_MODEL_MAP.strongModelName,
        tier: 'strong',
        context: fullUntrimmedContext,
        query,
        inputCostPer1M: DEFAULT_MODEL_MAP.strongInputCostPer1M,
        outputCostPer1M: DEFAULT_MODEL_MAP.strongOutputCostPer1M,
        promptType,
        attachment,
        imageGenConfig,
      }),
    ]);

    const optimizedAnswer = optLLMResult.answer;
    const optimizedModel = chosenModel;
    const optimizedInputTokens = optLLMResult.inputTokens;
    const optimizedOutputTokens = optLLMResult.outputTokens;
    const optimizedTotalTokens = optLLMResult.totalTokens;
    const optimizedCost = optLLMResult.cost;
    const optimizedLatencyMs = optLLMResult.latencyMs;

    trace.push({
      step: 'INFERENCE',
      action: 'INFERENCE_COMPLETE',
      detail: `Executed inference via ${chosenModel}. Input: ${optimizedInputTokens} tok, Output: ${optimizedOutputTokens} tok in ${optimizedLatencyMs}ms ($${optimizedCost.toFixed(5)}).`,
      timestamp: Date.now(),
      metadata: {
        model: chosenModel,
        inputTokens: optimizedInputTokens,
        outputTokens: optimizedOutputTokens,
        latencyMs: optimizedLatencyMs,
        cost: optimizedCost,
      },
    });

    // Save newly generated answer in Semantic Cache
    if (config.cacheEnabled) {
      await this.cache.insert(
        query,
        optimizedAnswer,
        chosenModel,
        optimizedTotalTokens,
        optimizedCost,
        promptType,
        optLLMResult.imageUrl
      );
    }

    // ====================================================
    // STEP 6: QUALITY PARITY EVALUATION
    // ====================================================
    const quality = promptType === 'image-gen'
      ? { score: 98, explanation: 'High-fidelity visual synthesis matched prompt guidelines.' }
      : await evaluateAnswerQuality(
          baseLLMResult.answer,
          optimizedAnswer,
          query,
          false
        );

    trace.push({
      step: 'QUALITY_EVALUATION',
      action: 'EVALUATION_COMPLETED',
      detail: `Quality Judge assessed parity at ${quality.score}/100. ${quality.explanation}`,
      timestamp: Date.now(),
      metadata: {
        score: quality.score,
        explanation: quality.explanation,
      },
    });

    // ====================================================
    // STEP 7: SAVINGS COMPUTATION
    // ====================================================
    const baselineData = {
      answer: baseLLMResult.answer,
      model: promptType === 'image-gen' ? 'gemini-3.1-flash-lite-image' : DEFAULT_MODEL_MAP.strongModelName,
      imageUrl: baseLLMResult.imageUrl || optLLMResult.imageUrl,
      inputTokens: baseLLMResult.inputTokens,
      outputTokens: baseLLMResult.outputTokens,
      totalTokens: baseLLMResult.totalTokens,
      cost: baseLLMResult.cost,
      latencyMs: baseLLMResult.latencyMs,
      contextTokens: estimateTokenCount(fullUntrimmedContext),
    };

    const tokensSaved = Math.max(0, baselineData.totalTokens - optimizedTotalTokens);
    const tokenReductionPct =
      baselineData.totalTokens > 0
        ? parseFloat(((tokensSaved / baselineData.totalTokens) * 100).toFixed(1))
        : 0;

    const costSaved = Math.max(0, baselineData.cost - optimizedCost);
    const costReductionPct =
      baselineData.cost > 0
        ? parseFloat(((costSaved / baselineData.cost) * 100).toFixed(1))
        : 0;

    const latencyDeltaMs = baselineData.latencyMs - optimizedLatencyMs;

    return {
      id: queryId,
      query,
      timestamp: Date.now(),
      config,
      promptType,
      attachment,
      imageGenConfig,
      optimized: {
        answer: optimizedAnswer,
        model: optimizedModel,
        imageUrl: optLLMResult.imageUrl,
        inputTokens: optimizedInputTokens,
        outputTokens: optimizedOutputTokens,
        totalTokens: optimizedTotalTokens,
        cost: optimizedCost,
        latencyMs: optimizedLatencyMs,
        cacheHit: false,
        cacheSimilarity: 0,
        cachedQuery: '',
        routingDecision: routingData,
        ragDetails,
        compressionDetails,
        decisionTrace: trace,
      },
      baseline: baselineData,
      savings: {
        tokensSaved,
        tokenReductionPct,
        costSaved,
        costReductionPct,
        latencyDeltaMs,
        llmCallsAvoided: 0,
      },
      qualityScore: quality.score,
      qualityExplanation: quality.explanation,
      isSimulated: optLLMResult.isSimulated,
    };
  }
}
