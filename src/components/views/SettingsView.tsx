import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  RotateCcw, 
  Server,
  Code2,
  ShieldCheck
} from 'lucide-react';
import { OptimizationConfig } from '../../types';

interface SettingsViewProps {
  config: OptimizationConfig;
  onResetAll: () => Promise<void>;
  onClearCache: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetAll,
  onClearCache,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'node'>('curl');
  const [isResetting, setIsResetting] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlSnippet = `curl -X POST http://localhost:3000/api/query \\
  -H "Content-Type: application/json" \\
  -d '{"query": "How do database indexes work?"}'`;

  const pythonSnippet = `import requests

url = "http://localhost:3000/api/query"
response = requests.post(url, json={
    "query": "How do database indexes work?"
})
data = response.json()
print("Answer:", data["optimized"]["answer"])
print("Tokens Saved:", data["savings"]["tokensSaved"])`;

  const nodeSnippet = `const response = await fetch('http://localhost:3000/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'How do database indexes work?' }),
});

const data = await response.json();
console.log('Answer:', data.optimized.answer);
console.log('Tokens Saved:', data.savings.tokensSaved);`;

  const activeSnippet = activeLang === 'curl' 
    ? curlSnippet 
    : activeLang === 'python' 
    ? pythonSnippet 
    : nodeSnippet;

  const handleReset = async () => {
    if (!confirm('This will delete all past questions and reset your dashboard counters back to 0. Do you want to continue?')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetAll();
    } finally {
      setIsResetting(false);
    }
  };

  const handleFlushCache = async () => {
    if (!confirm('Clear all stored answers from memory?')) {
      return;
    }
    setIsFlushing(true);
    try {
      await onClearCache();
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Status Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                LeanLLM Gateway Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your AI optimization server is running locally on port 3000.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Online &amp; Healthy
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <div>
            <div className="text-slate-400 text-[11px]">API Address</div>
            <div className="text-white font-medium mt-0.5">http://localhost:3000/api/query</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">AI Engine</div>
            <div className="text-emerald-400 font-medium mt-0.5">Google Gemini API</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px]">Active Features</div>
            <div className="text-white font-medium mt-0.5">Cache, Routing, Trimming</div>
          </div>
        </div>
      </section>

      {/* Code Snippet for Integration */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Connect Your App to LeanLLM</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Send your queries to LeanLLM instead of raw LLM APIs to automatically get caching and savings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setActiveLang('curl')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeLang === 'curl' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveLang('python')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeLang === 'python' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setActiveLang('node')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeLang === 'node' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Node.js
              </button>
            </div>

            <button
              onClick={() => copyCode(activeSnippet, activeLang)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg cursor-pointer transition-colors"
            >
              {copiedCode === activeLang ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === activeLang ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{activeSnippet}</pre>
        </div>
      </section>

      {/* Maintenance Controls */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Data &amp; System Management
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Reset past questions or clear the memory cache at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Flush Cache */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-sm font-bold text-white">
                Clear Answer Cache
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Deletes all stored answers so that subsequent identical questions are sent to the AI anew.
              </p>
            </div>
            <button
              onClick={handleFlushCache}
              disabled={isFlushing}
              className="w-fit flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isFlushing ? 'Clearing...' : 'Clear Answer Cache'}</span>
            </button>
          </div>

          {/* Reset All */}
          <div className="bg-slate-950 border border-rose-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-sm font-bold text-rose-300">
                Reset All History &amp; Numbers
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Clears all past questions and sets your dashboard numbers back to 0. Useful for fresh tests and demonstrations.
              </p>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="w-fit flex items-center gap-2 px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetting ? 'Resetting...' : 'Reset All to 0'}</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
