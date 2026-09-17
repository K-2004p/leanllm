import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  Coins 
} from 'lucide-react';
import { AggregatedMetrics, CacheEntry, OptimizationConfig } from '../../types';

interface CacheViewProps {
  metrics: AggregatedMetrics;
  config: OptimizationConfig;
  onClearCache: () => Promise<void>;
  onUpdateConfig: (newConfig: Partial<OptimizationConfig>) => Promise<void>;
}

export const CacheView: React.FC<CacheViewProps> = ({
  metrics,
  config,
  onClearCache,
}) => {
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const fetchCacheEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cache');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error('Failed to fetch cache entries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheEntries();
  }, []);

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all cached answers? Next time these questions are asked, they will be sent to the AI.')) {
      return;
    }
    setIsClearing(true);
    try {
      await onClearCache();
      await fetchCacheEntries();
    } catch (e) {
      console.error('Failed to flush cache:', e);
    } finally {
      setIsClearing(false);
    }
  };

  const filtered = entries.filter((e) =>
    e.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Fast Answer Cache
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Stores answers to previous questions. When someone asks the same or similar question, LeanLLM replies in milliseconds for 100% free.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCacheEntries}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClear}
            disabled={isClearing || entries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Clearing...' : 'Clear Cache'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-[11px]">Cached Questions Saved</div>
          <div className="text-2xl font-bold text-white mt-1">
            {entries.length}
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Ready for instant match
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-[11px]">Cache Hit Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {metrics.cacheHitRate}%
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            {metrics.cacheHitCount} questions answered with zero cost
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-[11px]">Speed on Cache Hit</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            &lt; 15ms
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Zero API wait time
          </div>
        </div>
      </div>

      {/* Cached Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Stored Answers in Memory
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              These pre-computed answers are served automatically when a matching question arrives.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved answers..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Zap className="w-6 h-6 mx-auto text-slate-600" />
            <div className="text-sm font-medium text-slate-300">Cache is currently empty</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Whenever you ask a question via the Dashboard, its answer is automatically saved here so future identical asks are answered for free.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-800/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    &ldquo;{item.query}&rdquo;
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Used {item.hitCount} {item.hitCount === 1 ? 'time' : 'times'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Saved {item.tokensSaved} tokens
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed line-clamp-3">
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
