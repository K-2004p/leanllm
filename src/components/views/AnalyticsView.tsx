import React from 'react';
import { 
  TrendingUp, 
  Coins, 
  DollarSign, 
  Clock, 
  Zap, 
  Cpu, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AggregatedMetrics, QueryExecutionResult } from '../../types';

interface AnalyticsViewProps {
  metrics: AggregatedMetrics;
  queries: QueryExecutionResult[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  queries,
}) => {
  // Sort queries chronologically
  const sortedQueries = [...queries].sort((a, b) => a.timestamp - b.timestamp);
  const hasData = sortedQueries.length > 0;

  // Real chart points (ONLY genuine values)
  const chartPoints = sortedQueries.slice(-12).map((q, idx) => ({
    label: `#${queries.length - sortedQueries.slice(-12).length + idx + 1}`,
    baselineTokens: q.baseline.totalTokens,
    optimizedTokens: q.optimized.totalTokens,
    baselineCost: q.baseline.cost,
    optimizedCost: q.optimized.cost,
    latencyBaseline: q.baseline.latencyMs,
    latencyOptimized: q.optimized.latencyMs,
    isCache: q.optimized.cacheHit,
  }));

  const maxTokens = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.baselineTokens), 10) : 10;
  const maxLatency = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.latencyBaseline), 100) : 100;

  // Model distribution stats
  const smallCount = metrics.modelDistribution.smallTierCount;
  const strongCount = metrics.modelDistribution.strongTierCount;
  const cacheCount = metrics.modelDistribution.cacheBypassedCount;
  const total = Math.max(1, metrics.totalQueries);

  const smallPct = Math.round((smallCount / total) * 100);
  const strongPct = Math.round((strongCount / total) * 100);
  const cachePct = Math.round((cacheCount / total) * 100);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      
      {/* 1. Clear Savings Summary Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              Real Savings Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Factual measurement of standard AI versus your LeanLLM gateway.
            </p>
          </div>
          {hasData && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              {metrics.overallCostReductionPct}% Total Cost Reduction
            </span>
          )}
        </div>

        {!hasData ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-slate-600" />
            <div className="text-sm font-medium text-slate-300">No data to report yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run a few queries from the Dashboard to see your savings report update with genuine measurements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium text-right text-rose-400">Standard AI</th>
                  <th className="px-5 py-3 font-medium text-right text-emerald-400">With LeanLLM</th>
                  <th className="px-5 py-3 font-medium text-right">Your Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="px-5 py-3.5 text-white font-medium">Total Cost (USD)</td>
                  <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                    ${metrics.baselineTotalCost.toFixed(5)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-white font-bold font-mono">
                    ${metrics.optimizedTotalCost.toFixed(5)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-400 font-bold font-mono">
                    -${metrics.totalCostSaved.toFixed(5)} ({metrics.overallCostReductionPct}% saved)
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-white font-medium">Average Response Speed</td>
                  <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                    {metrics.avgLatencyBaselineMs}ms
                  </td>
                  <td className="px-5 py-3.5 text-right text-white font-bold font-mono">
                    {metrics.avgLatencyOptimizedMs}ms
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-400 font-bold font-mono">
                    -{metrics.avgLatencyReductionPct}% faster
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-white font-medium">Tokens Used</td>
                  <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                    {queries.reduce((acc, q) => acc + q.baseline.totalTokens, 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-white font-bold font-mono">
                    {queries.reduce((acc, q) => acc + q.optimized.totalTokens, 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-400 font-bold font-mono">
                    -{metrics.totalTokensSaved.toLocaleString()} tokens saved
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-white font-medium">Paid AI Invocations</td>
                  <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                    {metrics.totalQueries} calls
                  </td>
                  <td className="px-5 py-3.5 text-right text-white font-bold font-mono">
                    {Math.max(0, metrics.totalQueries - metrics.llmCallsAvoided)} calls
                  </td>
                  <td className="px-5 py-3.5 text-right text-blue-400 font-bold font-mono">
                    {metrics.llmCallsAvoided} instant cache hits (100% free)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2. Charts Section (Only rendered with genuine data) */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Chart 1: Token Usage per Query */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Tokens per Query (Last {chartPoints.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Green shows the reduced tokens after trimming and compaction.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  Standard
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  LeanLLM
                </span>
              </div>
            </div>

            <div className="h-44 w-full flex items-end gap-2 pt-3 px-1">
              {chartPoints.map((pt, i) => {
                const baseHeight = Math.min(100, Math.max(10, Math.round((pt.baselineTokens / maxTokens) * 100)));
                const optHeight = Math.min(100, Math.max(4, Math.round((pt.optimizedTokens / maxTokens) * 100)));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div 
                        className="w-1/2 bg-rose-500/40 hover:bg-rose-500 rounded-t transition-all"
                        style={{ height: `${baseHeight}%` }}
                        title={`Standard: ${pt.baselineTokens} tokens`}
                      />
                      <div 
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${optHeight}%` }}
                        title={`LeanLLM: ${pt.optimizedTokens} tokens`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Chart 2: Speed / Latency Profile */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Response Speed in Milliseconds
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lower is faster. Cache hits return in under 15ms.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  Standard
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  LeanLLM
                </span>
              </div>
            </div>

            <div className="h-44 w-full flex items-end gap-2 pt-3 px-1">
              {chartPoints.map((pt, i) => {
                const baseH = Math.min(100, Math.max(12, Math.round((pt.latencyBaseline / maxLatency) * 100)));
                const optH = Math.min(100, Math.max(4, Math.round((pt.latencyOptimized / maxLatency) * 100)));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div 
                        className="w-1/2 bg-slate-700 rounded-t transition-all"
                        style={{ height: `${baseH}%` }}
                        title={`Standard: ${pt.latencyBaseline}ms`}
                      />
                      <div 
                        className="w-1/2 bg-amber-400 rounded-t transition-all"
                        style={{ height: `${optH}%` }}
                        title={`LeanLLM: ${pt.latencyOptimized}ms`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Chart 3: Model & Cache Traffic Distribution */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm lg:col-span-2">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Traffic Breakdown Across Tiers
              </h3>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-emerald-400">Instant Cache (Free zero-token answer)</span>
                  <span className="text-white font-bold">{cachePct}% ({cacheCount} questions)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${cachePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-blue-400">Fast Model Tier (gemini-3.1-flash-lite)</span>
                  <span className="text-white font-bold">{smallPct}% ({smallCount} questions)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${smallPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-medium">
                  <span className="text-slate-300">Frontier Tier (gemini-3.8-flash)</span>
                  <span className="text-white font-bold">{strongPct}% ({strongCount} questions)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-slate-600 transition-all" style={{ width: `${strongPct}%` }} />
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

    </div>
  );
};
