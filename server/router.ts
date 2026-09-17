export interface RoutingDecision {
  score: number; // 0.0 to 1.0
  tier: 'small' | 'strong';
  model: string;
  reason: string;
  features: string[];
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export interface ModelMapConfig {
  smallModelName: string;
  strongModelName: string;
  smallInputCostPer1M: number;
  smallOutputCostPer1M: number;
  strongInputCostPer1M: number;
  strongOutputCostPer1M: number;
}

export const DEFAULT_MODEL_MAP: ModelMapConfig = {
  smallModelName: 'gemini-3.1-flash-lite (Fast Tier)',
  strongModelName: 'gemini-3.8-flash (Frontier Tier)',
  smallInputCostPer1M: 0.075,
  smallOutputCostPer1M: 0.30,
  strongInputCostPer1M: 0.35,
  strongOutputCostPer1M: 1.05,
};

const REASONING_KEYWORDS = [
  'analyze', 'compare', 'contrast', 'tradeoff', 'trade-off', 'derive', 'prove',
  'architect', 'architecture', 'evaluate', 'benchmark', 'critique', 'implications',
  'under the hood', 'deep dive', 'internals', 'mechanism', 'dissect'
];

const MULTISTEP_MARKERS = [
  'step by step', 'step-by-step', 'first', 'second', 'pipeline', 'workflow',
  'phases', 'stages', 'in detail', 'process of'
];

const CODE_MARKERS = [
  'code', 'function', 'class', 'cuda', 'kernel', 'algorithm', 'tensor',
  'pytorch', 'implementation', 'pseudocode', 'regex', 'sql', 'python', 'c++'
];

const MATH_MARKERS = [
  'o(n', 'o(1', 'flops', 'matrix', 'linear algebra', 'complexity', 'equation',
  'formula', 'hessian', 'derivative', 'calculate', 'compute', 'ratio'
];

const SIMPLE_FACTOID_PATTERNS = [
  /^what is\b/i,
  /^define\b/i,
  /^what does .* stand for/i,
  /^who invented\b/i,
  /^brief overview\b/i,
  /^what's\b/i,
  /^quick summary\b/i
];

export function classifyQueryComplexity(
  query: string,
  threshold = 0.45,
  modelMap: ModelMapConfig = DEFAULT_MODEL_MAP
): RoutingDecision {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(Boolean);
  const detectedFeatures: string[] = [];

  let score = 0.15; // baseline prior

  // 1. Length feature
  if (words.length > 35) {
    score += 0.22;
    detectedFeatures.push(`Long query (${words.length} words)`);
  } else if (words.length > 20) {
    score += 0.12;
    detectedFeatures.push(`Medium length (${words.length} words)`);
  } else if (words.length < 8) {
    score -= 0.08;
    detectedFeatures.push(`Short query (${words.length} words)`);
  }

  // 2. Reasoning indicators
  const matchedReasoning = REASONING_KEYWORDS.filter(k => q.includes(k));
  if (matchedReasoning.length > 0) {
    const boost = Math.min(0.35, matchedReasoning.length * 0.15);
    score += boost;
    detectedFeatures.push(`Reasoning intent: [${matchedReasoning.join(', ')}]`);
  }

  // 3. Multi-step indicators
  const matchedMulti = MULTISTEP_MARKERS.filter(k => q.includes(k));
  if (matchedMulti.length > 0) {
    score += 0.20;
    detectedFeatures.push(`Multi-step instructions: [${matchedMulti.join(', ')}]`);
  }

  // 4. Code / Technical implementation
  const matchedCode = CODE_MARKERS.filter(k => q.includes(k));
  if (matchedCode.length > 0) {
    score += 0.20;
    detectedFeatures.push(`Code/System level: [${matchedCode.join(', ')}]`);
  }

  // 5. Math / Complexity
  const matchedMath = MATH_MARKERS.filter(k => q.includes(k));
  if (matchedMath.length > 0) {
    score += 0.20;
    detectedFeatures.push(`Math/Formal complexity: [${matchedMath.join(', ')}]`);
  }

  // 6. Simple factoid deduction
  for (const pat of SIMPLE_FACTOID_PATTERNS) {
    if (pat.test(q) && words.length < 15 && matchedReasoning.length === 0 && matchedCode.length === 0) {
      score -= 0.18;
      detectedFeatures.push('Factoid/Definition inquiry pattern');
      break;
    }
  }

  // Clamp 0.05 to 0.98
  score = Math.max(0.05, Math.min(0.98, parseFloat(score.toFixed(3))));

  const isStrong = score >= threshold;
  const tier: 'small' | 'strong' = isStrong ? 'strong' : 'small';
  const model = isStrong ? modelMap.strongModelName : modelMap.smallModelName;
  const inputCost = isStrong ? modelMap.strongInputCostPer1M : modelMap.smallInputCostPer1M;
  const outputCost = isStrong ? modelMap.strongOutputCostPer1M : modelMap.smallOutputCostPer1M;

  const reason = isStrong
    ? `Complexity score (${score.toFixed(2)} ≥ ${threshold}) warrants frontier reasoning: ${detectedFeatures.join('; ')}`
    : `Complexity score (${score.toFixed(2)} < ${threshold}) suitable for high-throughput fast tier: ${detectedFeatures.join('; ')}`;

  return {
    score,
    tier,
    model,
    reason,
    features: detectedFeatures,
    inputCostPer1M: inputCost,
    outputCostPer1M: outputCost,
  };
}
