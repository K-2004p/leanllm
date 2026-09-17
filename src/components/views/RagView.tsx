import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  RefreshCw, 
  FileText, 
  Scissors, 
  CheckCircle2 
} from 'lucide-react';
import { KnowledgeChunk } from '../../types';

export const RagView: React.FC = () => {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchKnowledgeBase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kb');
      if (res.ok) {
        const data = await res.json();
        setChunks(data);
      }
    } catch (e) {
      console.error('Failed to load KB:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const totalTokens = chunks.reduce((acc, c) => acc + (c.tokenEstimate || 150), 0);
  const avgTokens = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;

  const filtered = chunks.filter((c) => {
    const matches = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matches) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(chunks.map(c => c.category)));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Knowledge Base
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reference documents for LeanLLM. When you ask questions about LeanLLM, it automatically finds the right sections and cuts out the rest to save you money.
          </p>
        </div>

        <button
          onClick={fetchKnowledgeBase}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Documents</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-[11px]">Total Documents</div>
          <div className="text-2xl font-bold text-white mt-1">
            {chunks.length} articles
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Indexed and ready
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-[11px]">Total Word Volume</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {totalTokens.toLocaleString()} tokens
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Available reference pool
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-[11px]">Average Article Size</div>
          <div className="text-2xl font-bold text-white mt-1">
            ~{avgTokens} tokens
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Quickly scannable
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-[11px]">Smart Trimming</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            Active
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Extracts only relevant text
          </div>
        </div>
      </div>

      {/* Chunk Explorer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Document Explorer
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Read through the documents LeanLLM uses to answer user questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Topics</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search text..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {filtered.map((chunk) => (
            <div key={chunk.id} className="p-4 hover:bg-slate-800/50 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {chunk.title}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {chunk.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  ~{chunk.tokenEstimate} tokens
                </span>
              </div>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                {chunk.text}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
