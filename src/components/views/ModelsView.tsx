import React from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AggregatedMetrics, QueryExecutionResult } from '../../types';

interface ModelsViewProps {
  metrics: AggregatedMetrics;
  queries: QueryExecutionResult[];
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  metrics,
}) => {
  const smallCount = metrics.modelDistribution.smallTierCount;
  const strongCount = metrics.modelDistribution.strongTierCount;
  const cacheCount = metrics.modelDistribution.cacheBypassedCount;
  const total = metrics.totalQueries || 1;

  const smallShare = ((smallCount / total) * 100).toFixed(0);
  const strongShare = ((strongCount / total) * 100).toFixed(0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Dual AI Model Tiers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            LeanLLM balances high speed and low cost by automatically matching each question to the best model.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Both Models Active &amp; Ready
        </span>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tier 1: Fast Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Tier 1 · Fast &amp; Affordable
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    gemini-3.1-flash-lite
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Your Usage</div>
                <div className="text-lg font-bold text-emerald-400">{smallShare}%</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Designed for everyday tasks like formatting text, extracting JSON, simple answers, and quick queries. It costs 50% less and responds roughly 2x faster.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Input Cost</div>
                <div className="text-white font-bold">$0.075 / 1M tokens</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Output Cost</div>
                <div className="text-white font-bold">$0.300 / 1M tokens</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Typical Speed</div>
                <div className="text-emerald-400 font-bold">~350ms</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Questions Handled</div>
                <div className="text-white font-bold">{smallCount} questions</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-200">Best for:</span> Summary, basic extraction, translation, sentiment check, and short Q&amp;A.
          </div>
        </div>

        {/* Tier 2: Frontier Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Tier 2 · Deep Reasoning
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    gemini-3.8-flash
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Your Usage</div>
                <div className="text-lg font-bold text-blue-400">{strongShare}%</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Reserved for complex mathematical derivations, multi-step code generation, and ambiguous technical logic where deep intelligence is required.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Input Cost</div>
                <div className="text-white font-bold">$0.150 / 1M tokens</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Output Cost</div>
                <div className="text-white font-bold">$0.600 / 1M tokens</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Typical Speed</div>
                <div className="text-white font-bold">~900ms</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Questions Handled</div>
                <div className="text-white font-bold">{strongCount} questions</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-200">Best for:</span> Software architecture, multi-stage math, complex reasoning, and ambiguous prompts.
          </div>
        </div>

      </div>

    </div>
  );
};
