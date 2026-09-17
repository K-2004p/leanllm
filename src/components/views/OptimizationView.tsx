import React, { useState } from 'react';
import { 
  Zap, 
  Cpu, 
  FileText, 
  Coins, 
  Save, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { OptimizationConfig, QueryExecutionResult } from '../../types';

interface OptimizationViewProps {
  config: OptimizationConfig;
  onUpdateConfig: (newConfig: Partial<OptimizationConfig>) => Promise<void>;
  queries: QueryExecutionResult[];
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  config,
  onUpdateConfig,
  queries,
}) => {
  const [localConfig, setLocalConfig] = useState<OptimizationConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Derive empirical statistics from real queries
  const total = queries.length;

  // 1. Semantic Cache stats
  const cacheHitCount = queries.filter(q => q.optimized.cacheHit).length;
  const cacheTokens = queries.filter(q => q.optimized.cacheHit).reduce((sum, q) => sum + q.savings.tokensSaved, 0);
  const cacheCost = queries.filter(q => q.optimized.cacheHit).reduce((sum, q) => sum + q.savings.costSaved, 0);

  // 2. Model Routing stats
  const routedSmall = queries.filter(q => !q.optimized.cacheHit && q.optimized.routingDecision?.tier === 'small').length;
  const routingTokens = queries.filter(q => !q.optimized.cacheHit && q.optimized.routingDecision?.tier === 'small')
    .reduce((sum, q) => sum + q.savings.tokensSaved, 0);
  const routingCost = queries.filter(q => !q.optimized.cacheHit && q.optimized.routingDecision?.tier === 'small')
    .reduce((sum, q) => sum + q.savings.costSaved, 0);

  // 3. RAG Pruning stats
  const prunedQueries = queries.filter(q => q.optimized.ragDetails && q.optimized.ragDetails.chunksPruned > 0);
  const prunedTokens = prunedQueries.reduce((sum, q) => {
    const rag = q.optimized.ragDetails;
    return sum + (rag ? rag.originalRagTokens - rag.prunedRagTokens : 0);
  }, 0);
  const prunedCost = prunedTokens * 0.00000015;

  // 4. Context Compression stats
  const compressedQueries = queries.filter(q => q.optimized.compressionDetails && q.optimized.compressionDetails.tokensSaved > 0);
  const compressedTokens = compressedQueries.reduce((sum, q) => sum + (q.optimized.compressionDetails?.tokensSaved || 0), 0);
  const compressedCost = compressedTokens * 0.00000015;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner with Save action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white">
            Savings Controls
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turn features on or off and tweak sensitivity to optimize your speed and cost.
          </p>
        </div>

        <button
          id="btn-save-optimization-config"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </>
          )}
        </button>
      </div>

      {/* 4 User-Friendly Optimization Feature Cards */}
      <div className="space-y-4">

        {/* 1. Semantic Vector Cache */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    1. Instant Answer Cache
                  </h3>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    localConfig.cacheEnabled 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {localConfig.cacheEnabled ? 'Active' : 'Turned Off'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  If someone asks a question similar to an earlier one, returns the answer instantly without calling the AI.
                </p>
              </div>
            </div>

            {/* Enable/Disable Toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
              <span>Enable Cache</span>
              <input
                type="checkbox"
                checked={localConfig.cacheEnabled}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, cacheEnabled: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Real Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs">
            <div>
              <div className="text-[11px] text-slate-400">Cache Hits</div>
              <div className="text-white font-bold mt-1 text-sm">{cacheHitCount} questions</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Tokens Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">{cacheTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Money Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">+${cacheCost.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Response Latency</div>
              <div className="text-white font-bold mt-1 text-sm">&lt; 15ms</div>
            </div>
          </div>

          {/* Friendly Sensitivity Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Match Strictness</span>
              <span className="text-emerald-400 font-bold">
                {localConfig.cacheThreshold >= 0.95 ? 'Strict (Near identical only)' : localConfig.cacheThreshold >= 0.90 ? 'Balanced (Recommended)' : 'Relaxed (Catches similar phrasing)'}
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="0.99"
              step="0.01"
              value={localConfig.cacheThreshold}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, cacheThreshold: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </section>

        {/* 2. Adaptive Model Routing */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    2. Smart Model Routing
                  </h3>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    localConfig.routingEnabled 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {localConfig.routingEnabled ? 'Active' : 'Turned Off'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sends straightforward questions to a super-fast, affordable model, and automatically upgrades tricky questions to the frontier model.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
              <span>Enable Routing</span>
              <input
                type="checkbox"
                checked={localConfig.routingEnabled}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, routingEnabled: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Real Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs">
            <div>
              <div className="text-[11px] text-slate-400">Fast Model Runs</div>
              <div className="text-white font-bold mt-1 text-sm">{routedSmall} runs</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Tokens Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">{routingTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Money Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">+${routingCost.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Cost Discount</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">-50% per token</div>
            </div>
          </div>

          {/* Friendly Sensitivity Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Difficulty Routing Threshold</span>
              <span className="text-blue-400 font-bold">
                {localConfig.routingComplexityThreshold >= 0.65 ? 'Aggressive (Uses fast model for most questions)' : localConfig.routingComplexityThreshold <= 0.35 ? 'Cautious (Uses large model often)' : 'Balanced (Recommended)'}
              </span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.80"
              step="0.05"
              value={localConfig.routingComplexityThreshold}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, routingComplexityThreshold: parseFloat(e.target.value) }))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </section>

        {/* 3. Context Trimming */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    3. Context Trimming
                  </h3>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    localConfig.pruningEnabled 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {localConfig.pruningEnabled ? 'Active' : 'Turned Off'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filters out irrelevant document paragraphs so the AI only reads what actually matters.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
              <span>Enable Trimming</span>
              <input
                type="checkbox"
                checked={localConfig.pruningEnabled}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, pruningEnabled: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Real Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs">
            <div>
              <div className="text-[11px] text-slate-400">Queries Optimized</div>
              <div className="text-white font-bold mt-1 text-sm">{prunedQueries.length} questions</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Tokens Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">{prunedTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Money Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">+${prunedCost.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Max Documents Kept</div>
              <div className="text-white font-bold mt-1 text-sm">Top {localConfig.pruningTopK}</div>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Keep Top Most Relevant Passages</span>
              <span className="text-purple-400 font-bold">{localConfig.pruningTopK} passages</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={localConfig.pruningTopK}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, pruningTopK: parseInt(e.target.value) }))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </section>

        {/* 4. Text Compaction */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    4. Text Compaction
                  </h3>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    localConfig.compressionEnabled 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {localConfig.compressionEnabled ? 'Active' : 'Turned Off'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Removes redundant whitespace, repeated words, and unnecessary filler before calling the AI model.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
              <span>Enable Compaction</span>
              <input
                type="checkbox"
                checked={localConfig.compressionEnabled}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Real Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs">
            <div>
              <div className="text-[11px] text-slate-400">Queries Cleaned</div>
              <div className="text-white font-bold mt-1 text-sm">{compressedQueries.length} questions</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Tokens Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">{compressedTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Money Saved</div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">+${compressedCost.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Compaction Mode</div>
              <div className="text-white font-bold mt-1 text-sm capitalize">{localConfig.compressionLevel}</div>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
};
