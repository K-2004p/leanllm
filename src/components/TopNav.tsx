import React from 'react';
import { RefreshCw, Play } from 'lucide-react';
import { NavTab } from '../types';

interface TopNavProps {
  currentTab: NavTab;
  timeRange: string;
  setTimeRange: (range: string) => void;
  environment: string;
  setEnvironment: (env: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSendRequest: () => void;
}

const TAB_METADATA: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard',
    subtitle: 'Track genuine AI savings, speed improvements, and active optimizations',
  },
  requests: {
    title: 'Query History',
    subtitle: 'Detailed logs of every question processed and its measured savings',
  },
  optimization: {
    title: 'Savings Features',
    subtitle: 'Easily turn on or adjust smart caching, model routing, and context cleanup',
  },
  models: {
    title: 'AI Models',
    subtitle: 'Smart routing between fast lightweight models and powerful reasoning models',
  },
  cache: {
    title: 'Fast Cache',
    subtitle: 'Instantly answered repeated queries with 0 wait time and 0 API cost',
  },
  rag: {
    title: 'Knowledge Base',
    subtitle: 'Organized documents trimmed intelligently before being sent to the AI',
  },
  analytics: {
    title: 'Savings Report',
    subtitle: 'Side-by-side comparison of costs and response times with and without LeanLLM',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Connect your app, reset data, or manage your system',
  },
};

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onRefresh,
  isRefreshing,
  onOpenSendRequest,
}) => {
  const meta = TAB_METADATA[currentTab] || {
    title: 'Dashboard',
    subtitle: 'Track your AI savings and speed',
  };

  return (
    <header className="h-16 border-b border-[#334155]/60 bg-[#0f172a] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div>
        <h1 className="text-base font-bold text-white tracking-tight">
          {meta.title}
        </h1>
        <p className="text-xs text-slate-400">
          {meta.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh Action */}
        <button
          id="btn-refresh-dashboard"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh metrics"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh</span>
        </button>

        {/* Try a Query Button */}
        <button
          id="btn-send-test-request"
          onClick={onOpenSendRequest}
          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Ask AI / Prompt</span>
        </button>
      </div>
    </header>
  );
};
