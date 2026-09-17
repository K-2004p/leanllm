import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Zap, 
  Cpu, 
  FileText, 
  Coins, 
  Clock, 
  DollarSign, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Image as ImageIcon,
  Download,
  Eye,
  FileUp,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QueryExecutionResult } from '../types';

interface RequestDetailModalProps {
  query: QueryExecutionResult | null;
  onClose: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  query,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'steps' | 'diff' | 'json'>('summary');
  const [showExtractedText, setShowExtractedText] = useState(false);

  if (!query) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = (url: string, filename = 'generated-image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isCacheHit = query.optimized.cacheHit;
  const routing = query.optimized.routingDecision;
  const rag = query.optimized.ragDetails;
  const compression = query.optimized.compressionDetails;
  const promptType = query.promptType || 'text';
  const imageUrl = query.optimized.imageUrl;
  const attachment = query.attachment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-xl flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id="detail-modal-title" className="text-base font-bold text-white">
                Request &amp; Optimization Trace
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isCacheHit
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}>
                {isCacheHit ? 'Instant Cache Hit' : 'LeanLLM Optimized'}
              </span>

              {/* Modality Tag */}
              {promptType === 'pdf' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1 font-medium">
                  <FileText className="w-3 h-3" /> PDF Document
                </span>
              )}
              {promptType === 'image-gen' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1 font-medium">
                  <ImageIcon className="w-3 h-3" /> Image Generation
                </span>
              )}
              {promptType === 'image' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-medium">
                  <Eye className="w-3 h-3" /> Vision Analysis
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Executed {new Date(query.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • ID: <span className="font-mono text-slate-500">{query.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'summary' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'steps' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Step-by-Step
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'diff' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'json' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900">
          
          {/* TAB 1: SUMMARY (DEFAULT) */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Savings Highlights Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[11px] text-slate-400">Tokens Saved</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    +{query.savings.tokensSaved.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">
                    {query.savings.tokenReductionPct}% token cut
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[11px] text-slate-400">Cost Saved</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    ${query.savings.costSaved.toFixed(5)}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">
                    {query.savings.costReductionPct}% cheaper
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[11px] text-slate-400">Response Speed</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {query.optimized.latencyMs}ms
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Baseline was {query.baseline.latencyMs}ms
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[11px] text-slate-400">Model Selected</div>
                  <div className="text-sm font-bold text-blue-400 mt-1.5 font-mono truncate">
                    {query.optimized.model}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {promptType === 'image-gen' 
                      ? 'Multimodal Image Engine'
                      : query.optimized.routingDecision?.tier === 'small' 
                      ? 'Fast Tier (50% cheaper)' 
                      : 'Frontier Reasoning'}
                  </div>
                </div>
              </div>

              {/* Attachment Preview (if any) */}
              {attachment && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <FileUp className="w-4 h-4 text-emerald-400" />
                      <span>Input Attachment: {attachment.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                    </span>
                  </div>

                  {attachment.mimeType.startsWith('image/') && attachment.base64 && (
                    <div className="mt-2 rounded-lg overflow-hidden max-h-48 border border-slate-800 bg-black/40 flex items-center justify-center">
                      <img src={attachment.base64} alt="Attached input" className="max-h-48 object-contain" />
                    </div>
                  )}

                  {attachment.textExtract && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowExtractedText(!showExtractedText)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showExtractedText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{showExtractedText ? 'Hide extracted text' : 'View extracted document text'}</span>
                      </button>

                      {showExtractedText && (
                        <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono max-h-40 overflow-y-auto leading-relaxed">
                          {attachment.textExtract}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Generated Image Showcase (if any) */}
              {imageUrl && (
                <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>Generated Visual Output</span>
                    </div>
                    <button
                      onClick={() => handleDownloadImage(imageUrl, `leanllm-${query.id}.png`)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Image</span>
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                    <img 
                      src={imageUrl} 
                      alt={query.query} 
                      className="max-h-96 w-auto object-contain rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* The User Question */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Prompt
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white">
                  &ldquo;{query.query}&rdquo;
                </div>
              </div>

              {/* The AI Answer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    AI Response
                  </div>
                  <button
                    onClick={() => handleCopy(query.optimized.answer)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy response'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {query.optimized.answer}
                </div>
              </div>

              {/* How it was handled */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  How This Request Was Handled
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      1
                    </span>
                    <div>
                      <span className="font-semibold text-white">Cache Check: </span>
                      {isCacheHit ? (
                        <span className="text-emerald-400">Found instant match in cache! Delivered in {query.optimized.latencyMs}ms with $0 cost.</span>
                      ) : (
                        <span>New question; processed with active speed and cost savings.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      2
                    </span>
                    <div>
                      <span className="font-semibold text-white">Model Selection: </span>
                      {promptType === 'image-gen' ? (
                        <span>Created via image generation engine (<span className="text-purple-400 font-mono">gemini-3.1-flash-lite-image</span>).</span>
                      ) : query.optimized.routingDecision?.tier === 'small' ? (
                        <span>Fast model selected (<span className="text-blue-400 font-mono">gemini-3.1-flash-lite</span>), saving 50% on cost.</span>
                      ) : (
                        <span>Standard model selected (<span className="text-blue-400 font-mono">gemini-3.8-flash</span>) for detailed reasoning.</span>
                      )}
                    </div>
                  </div>

                  {rag && rag.chunksPruned > 0 && (
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        3
                      </span>
                      <div>
                        <span className="font-semibold text-white">Document Cleanup: </span>
                        <span>Trimmed {rag.chunksPruned} unnecessary sections, saving {rag.originalRagTokens - rag.prunedRagTokens} tokens before sending to the model.</span>
                      </div>
                    </div>
                  )}

                  {compression && compression.tokensSaved > 0 && (
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        4
                      </span>
                      <div>
                        <span className="font-semibold text-white">Context Compaction: </span>
                        <span>Stripped duplicate filler and formatting tokens, saving an additional {compression.tokensSaved} tokens.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP TRACE */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              {query.optimized.decisionTrace.map((step, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Step {idx + 1}: {step.step.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {step.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SIDE-BY-SIDE DIFF */}
          {activeTab === 'diff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Without LeanLLM (Unoptimized Baseline)
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Model: <span className="text-white font-mono">{query.baseline.model}</span></div>
                  <div>Input Tokens: <span className="text-white font-mono">{query.baseline.inputTokens}</span></div>
                  <div>Output Tokens: <span className="text-white font-mono">{query.baseline.outputTokens}</span></div>
                  <div>Cost: <span className="text-rose-400 font-bold font-mono">${query.baseline.cost.toFixed(5)}</span></div>
                  <div>Speed: <span className="text-white font-mono">{query.baseline.latencyMs}ms</span></div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
                  {query.baseline.answer}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  With LeanLLM (Optimized)
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Model: <span className="text-emerald-400 font-mono">{query.optimized.model}</span></div>
                  <div>Input Tokens: <span className="text-white font-mono">{query.optimized.inputTokens}</span></div>
                  <div>Output Tokens: <span className="text-white font-mono">{query.optimized.outputTokens}</span></div>
                  <div>Cost: <span className="text-emerald-400 font-bold font-mono">${query.optimized.cost.toFixed(5)}</span></div>
                  <div>Speed: <span className="text-emerald-400 font-bold font-mono">{query.optimized.latencyMs}ms</span></div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
                  {query.optimized.answer}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW DATA JSON */}
          {activeTab === 'json' && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(JSON.stringify(query, null, 2))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[60vh]">
                {JSON.stringify(query, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
