import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Zap, 
  Coins, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  FileText, 
  ChevronRight,
  MessageSquare,
  HelpCircle,
  Database
} from 'lucide-react';
import { AggregatedMetrics, QueryExecutionResult, NavTab, OptimizationConfig } from '../../types';

interface OverviewViewProps {
  metrics: AggregatedMetrics;
  recentQueries: QueryExecutionResult[];
  onSelectQuery: (query: QueryExecutionResult) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenSendRequest: () => void;
}

const SAMPLE_QUESTIONS = [
  {
    title: 'Instant Cache',
    query: 'How do I authenticate API requests with a bearer token?',
    desc: 'Instant zero-cost response',
  },
  {
    title: 'Fast Model',
    query: 'Format the date 2026-09-16T22:00:00Z into a friendly readable format and return JSON.',
    desc: 'Handled by fast lightweight model',
  },
  {
    title: 'Detailed Reasoning',
    query: 'Explain how a rate limiter works and compare token buckets with sliding windows.',
    desc: 'Handled with in-depth reasoning',
  },
  {
    title: 'Summary Question',
    query: 'What are the latency targets and caching policies in this system?',
    desc: 'Summarized cleanly',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  recentQueries,
  onSelectQuery,
  onNavigateTab,
  onOpenSendRequest,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastExecuted, setLastExecuted] = useState<QueryExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Send query directly from the dashboard
  const handleQuickRun = async (textToRun?: string) => {
    const q = (textToRun !== undefined ? textToRun : promptInput).trim();
    if (!q) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: QueryExecutionResult = await res.json();
      setLastExecuted(data);
      if (!textToRun) setPromptInput('');
      // Open trace in detail
      onSelectQuery(data);
    } catch (err: any) {
      console.error('Quick run failed:', err);
      setErrorMessage(err.message || 'Failed to execute query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute 100% genuine values (ZERO fake fallback numbers)
  const hasData = metrics.totalQueries > 0;
  const totalQueries = metrics.totalQueries;
  const callsAvoided = metrics.llmCallsAvoided;
  const tokensSaved = metrics.totalTokensSaved;
  const costSaved = metrics.totalCostSaved;
  const avgSpeed = metrics.avgLatencyOptimizedMs;
  const baseSpeed = metrics.avgLatencyBaselineMs;

  return (
    <div className="p-6 space-y-7 max-w-6xl mx-auto">
      
      {/* 1. Quick Interactive Query Box */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ask AI</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type a question or prompt. Speed and cost savings are automatically applied.
            </p>
          </div>
          <button
            onClick={onOpenSendRequest}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>PDF, Image &amp; Vision options</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmitting && promptInput.trim()) {
                handleQuickRun();
              }
            }}
            placeholder="Ask a question or enter a prompt..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={() => handleQuickRun()}
            disabled={isSubmitting || !promptInput.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Sample Quick-Start Prompts */}
        <div>
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
            Quick Examples:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SAMPLE_QUESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptInput(s.query);
                  handleQuickRun(s.query);
                }}
                disabled={isSubmitting}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>{s.title}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {s.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Row - 100% Genuine Data */}
      <section aria-label="System Metrics" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Questions Asked */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Questions Asked</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalQueries}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {hasData ? 'Processed live' : 'No queries yet'}
            </div>
          </div>
        </div>

        {/* Instant Cache Hits */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Instant Cache Hits</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {callsAvoided}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">
              {hasData ? `${metrics.cacheHitRate}% repeated queries` : 'Zero API cost on hit'}
            </div>
          </div>
        </div>

        {/* Tokens Saved */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Tokens Saved</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {tokensSaved.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">
              {hasData ? `-${metrics.overallTokenReductionPct}% token reduction` : 'Trimmed & compacted'}
            </div>
          </div>
        </div>

        {/* Money Saved */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Estimated Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              ${costSaved.toFixed(4)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">
              {hasData ? `-${metrics.overallCostReductionPct}% cheaper` : 'Actual measured delta'}
            </div>
          </div>
        </div>

        {/* Average Speed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Average Speed</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {hasData ? `${avgSpeed}ms` : '0ms'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {hasData && baseSpeed > 0 ? `Baseline was ${baseSpeed}ms` : 'Measured response time'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Side-by-Side Savings Comparison */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              Measured Savings: Regular AI vs. LeanLLM
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculated purely from real requests you run in this app.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Full report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!hasData ? (
          <div className="p-8 bg-slate-950 border border-slate-800/80 rounded-lg text-center space-y-2">
            <p className="text-sm text-slate-300 font-medium">No real queries run yet.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Type a prompt above or click one of the example buttons to run your first real query and see genuine savings!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Unoptimized */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                Without LeanLLM
              </div>
              <div className="text-lg font-bold text-slate-200">
                ${metrics.baselineTotalCost.toFixed(5)}
              </div>
              <div className="text-xs text-slate-400">
                Average Speed: <span className="text-slate-200">{metrics.avgLatencyBaselineMs}ms</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Direct expensive model calls with no cache or trimming.
              </div>
            </div>

            {/* Savings Delta */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-center space-y-2 flex flex-col justify-center">
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Total Savings
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                -${metrics.totalCostSaved.toFixed(5)}
              </div>
              <div className="text-xs text-emerald-300">
                {metrics.overallCostReductionPct}% cheaper · {tokensSaved.toLocaleString()} tokens spared
              </div>
            </div>

            {/* LeanLLM Optimized */}
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-lg space-y-2">
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                With LeanLLM
              </div>
              <div className="text-lg font-bold text-white">
                ${metrics.optimizedTotalCost.toFixed(5)}
              </div>
              <div className="text-xs text-slate-400">
                Average Speed: <span className="text-emerald-400 font-bold">{metrics.avgLatencyOptimizedMs}ms</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Accelerated with intelligent caching and model routing.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. How LeanLLM Saves You Money (Friendly Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Active Savings Features
          </h2>
          <button
            onClick={() => onNavigateTab('optimization')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Adjust settings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Smart Cache */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Instant Cache</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Detects identical or similar questions and replies instantly with zero LLM cost.
            </p>
            <div className="text-[11px] text-emerald-400 font-medium">
              {metrics.cacheHitCount} questions answered instantly
            </div>
          </div>

          {/* Model Routing */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-7 h-7 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Smart Model Routing</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Routes everyday formatting and simple tasks to fast models; saves heavy models for hard logic.
            </p>
            <div className="text-[11px] text-blue-400 font-medium">
              {metrics.modelDistribution.smallTierCount} routed to fast tier
            </div>
          </div>

          {/* Context Trimming */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-7 h-7 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Context Trimming</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Prunes irrelevant chunks from large documents so you don&apos;t pay for useless background text.
            </p>
            <div className="text-[11px] text-purple-400 font-medium">
              Top-K relevancy filter active
            </div>
          </div>

          {/* Text Compaction */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Text Compaction</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cleans unnecessary spaces, duplicate words, and filler before prompt dispatch.
            </p>
            <div className="text-[11px] text-amber-400 font-medium">
              Lossless token reduction
            </div>
          </div>
        </div>
      </section>

      {/* 5. Recent Questions History */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              Recent Questions &amp; Measured Savings
            </h2>
            <p className="text-xs text-slate-400">
              Click any question to view the full answer and optimization details.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>See all history</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentQueries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <p>No questions asked yet.</p>
            <p className="text-[11px] text-slate-400">
              Try typing a question in the box above to see your history populate!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Question</th>
                  <th className="px-4 py-2.5 font-medium">Optimization</th>
                  <th className="px-4 py-2.5 font-medium">AI Model</th>
                  <th className="px-4 py-2.5 font-medium text-right">Speed</th>
                  <th className="px-4 py-2.5 font-medium text-right">Tokens Saved</th>
                  <th className="px-4 py-2.5 font-medium text-right">Cost</th>
                  <th className="px-4 py-2.5 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentQueries.slice(0, 8).map((q) => {
                  const isCache = q.optimized.cacheHit;
                  const isSmall = q.optimized.routingDecision?.tier === 'small';

                  return (
                    <tr
                      key={q.id}
                      onClick={() => onSelectQuery(q)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 max-w-sm text-white font-medium truncate">
                        {q.query}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isCache ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Instant Cache
                          </span>
                        ) : isSmall ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Fast Model
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                            Frontier Model
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {q.optimized.model}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono">
                        {q.optimized.latencyMs}ms
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-bold font-mono">
                        +{q.savings.tokensSaved}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-mono font-medium">
                        ${q.optimized.cost.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">
                          View details
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
};
