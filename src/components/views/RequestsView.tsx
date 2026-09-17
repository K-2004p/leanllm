import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Play, 
  Download,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Eye,
  Code
} from 'lucide-react';
import { QueryExecutionResult } from '../../types';

interface RequestsViewProps {
  queries: QueryExecutionResult[];
  onSelectQuery: (query: QueryExecutionResult) => void;
  onOpenSendRequest: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  queries,
  onSelectQuery,
  onOpenSendRequest,
}) => {
  const [search, setSearch] = useState('');
  const [filterOpt, setFilterOpt] = useState<'all' | 'cache' | 'fast-tier' | 'frontier' | 'pdf' | 'image-gen'>('all');

  const filtered = queries.filter((q) => {
    const term = search.toLowerCase();
    const matchText = 
      q.query.toLowerCase().includes(term) ||
      q.id.toLowerCase().includes(term) ||
      q.optimized.model.toLowerCase().includes(term);

    if (!matchText) return false;

    if (filterOpt === 'cache') return q.optimized.cacheHit;
    if (filterOpt === 'fast-tier') return !q.optimized.cacheHit && q.optimized.routingDecision?.tier === 'small';
    if (filterOpt === 'frontier') return !q.optimized.cacheHit && q.optimized.routingDecision?.tier === 'strong';
    if (filterOpt === 'pdf') return q.promptType === 'pdf';
    if (filterOpt === 'image-gen') return q.promptType === 'image-gen' || !!q.optimized.imageUrl;

    return true;
  });

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(queries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `leanllm_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, models, or IDs..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Badges & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs overflow-x-auto">
            <button
              onClick={() => setFilterOpt('all')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOpt === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({queries.length})
            </button>
            <button
              onClick={() => setFilterOpt('cache')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOpt === 'cache' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cache
            </button>
            <button
              onClick={() => setFilterOpt('fast-tier')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOpt === 'fast-tier' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fast Model
            </button>
            <button
              onClick={() => setFilterOpt('frontier')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOpt === 'frontier' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Frontier
            </button>
            <button
              onClick={() => setFilterOpt('pdf')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOpt === 'pdf' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              PDFs
            </button>
            <button
              onClick={() => setFilterOpt('image-gen')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOpt === 'image-gen' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Images
            </button>
          </div>

          <button
            onClick={exportJson}
            disabled={queries.length === 0}
            title="Download history as JSON"
            className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSendRequest}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ask AI / Prompt</span>
          </button>
        </div>
      </div>

      {/* Observability Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <div className="text-sm font-medium text-slate-300">No requests found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {queries.length === 0 
                ? 'You have not sent any requests yet. Click "Ask AI / Prompt" to run text, PDF, or image generation!' 
                : 'No requests matched your current search filters.'}
            </p>
            {queries.length === 0 && (
              <button
                onClick={onOpenSendRequest}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Send first request</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Prompt / Task</th>
                  <th className="px-4 py-3 font-medium">Optimization</th>
                  <th className="px-4 py-3 font-medium">Model Used</th>
                  <th className="px-4 py-3 font-medium text-right">Speed</th>
                  <th className="px-4 py-3 font-medium text-right">Tokens Saved</th>
                  <th className="px-4 py-3 font-medium text-right">Actual Cost</th>
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((q) => {
                  const isCache = q.optimized.cacheHit;
                  const isSmall = q.optimized.routingDecision?.tier === 'small';
                  const promptType = q.promptType || 'text';

                  return (
                    <tr
                      key={q.id}
                      onClick={() => onSelectQuery(q)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {promptType === 'pdf' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                        ) : promptType === 'image-gen' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            <ImageIcon className="w-3 h-3" /> Image
                          </span>
                        ) : promptType === 'image' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Eye className="w-3 h-3" /> Vision
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                            <Code className="w-3 h-3" /> Text
                          </span>
                        )}
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
                            Fast Model Tier
                          </span>
                        ) : promptType === 'image-gen' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            Visual Synthesis
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
                        <span className="text-emerald-400 hover:text-emerald-300 text-xs font-medium inline-flex items-center gap-1">
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
