import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Send, 
  Image as ImageIcon, 
  FileUp, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Code,
  ArrowRight
} from 'lucide-react';
import { QueryExecutionResult, OptimizationConfig, AttachmentData, ImageGenConfig } from '../types';

interface SendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OptimizationConfig | null;
  onSuccess: (result: QueryExecutionResult) => void;
}

type PromptCategory = 'text' | 'pdf' | 'image-gen' | 'image';

interface PresetItem {
  title: string;
  query: string;
  badge: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16';
}

const PRESETS: Record<PromptCategory, PresetItem[]> = {
  text: [
    {
      title: 'Common Question',
      query: 'How do I authenticate API requests with a bearer token?',
      badge: 'Instant answer',
    },
    {
      title: 'Format Data',
      query: 'Format the date 2026-09-16T22:00:00Z into a friendly readable string and return JSON.',
      badge: 'Fast answer',
    },
    {
      title: 'Detailed Reasoning',
      query: 'Explain how a rate limiter works and compare the pros and cons of token buckets vs sliding windows.',
      badge: 'Detailed answer',
    },
  ],
  pdf: [
    {
      title: 'Summarize Document',
      query: 'Summarize the main points and key takeaways from this document in 3 short bullet points.',
      badge: 'Summary',
    },
    {
      title: 'Extract Key Numbers',
      query: 'List all performance metrics, speed benchmarks, and memory numbers mentioned in this file.',
      badge: 'Key numbers',
    },
    {
      title: 'Action Items',
      query: 'What are the recommended action items and next steps in this paper?',
      badge: 'Action items',
    },
  ],
  'image-gen': [
    {
      title: 'Modern Server Room',
      query: 'Modern server racks in a clean datacenter with soft blue indicator lights.',
      badge: 'Landscape',
      aspectRatio: '16:9',
    },
    {
      title: 'Simple Architecture',
      query: 'Clean minimalist isometric diagram of a web application connected to a fast cache and database.',
      badge: 'Square',
      aspectRatio: '1:1',
    },
    {
      title: 'Dashboard Concept',
      query: 'Clean modern dashboard showing analytics charts and cost savings.',
      badge: 'Standard',
      aspectRatio: '4:3',
    },
  ],
  image: [
    {
      title: 'Explain Diagram',
      query: 'Explain what this architecture diagram shows and point out any bottlenecks.',
      badge: 'Analysis',
    },
    {
      title: 'Review Layout',
      query: 'Review the layout and readability of this screenshot and suggest simple improvements.',
      badge: 'Feedback',
    },
    {
      title: 'Read Chart',
      query: 'Summarize what this chart is showing and identify the main trends.',
      badge: 'Insights',
    },
  ],
};

const SAMPLE_PDF_DOC = `SYSTEM OVERVIEW & BENCHMARKS (v3.2)
1. SUMMARY
This document outlines performance metrics and optimization strategies for modern web services.
By caching common queries and choosing the right model size, response times drop dramatically while saving compute costs.

2. PERFORMANCE METRICS
- Response time for cached requests: Under 15 milliseconds.
- Typical uncached response time: 600 - 1,200 milliseconds.
- Overall cost savings: 40% to 75% reduction on repeated requests.
- Memory usage: Constant 128MB working buffer.

3. NEXT STEPS & RECOMMENDATIONS
- Enable automatic caching for frequent questions.
- Route simple text transformations to fast lightweight models.
- Review weekly summary reports to track savings.`;

export const SendRequestModal: React.FC<SendRequestModalProps> = ({
  isOpen,
  onClose,
  config,
  onSuccess,
}) => {
  const [activeCategory, setActiveCategory] = useState<PromptCategory>('text');
  const [queryText, setQueryText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '9:16'>('1:1');
  const [attachment, setAttachment] = useState<AttachmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setError(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setError('Please upload a PDF document (.pdf) or image (.png, .jpg, .webp).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be under 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachment({
        name: file.name,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
        size: file.size,
        base64,
        pageCount: isPdf ? 3 : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePdf = () => {
    setError(null);
    const base64Fake = 'data:application/pdf;base64,' + btoa(unescape(encodeURIComponent(SAMPLE_PDF_DOC)));
    setAttachment({
      name: 'sample_benchmarks.pdf',
      mimeType: 'application/pdf',
      size: 14500,
      base64: base64Fake,
      textExtract: SAMPLE_PDF_DOC,
      pageCount: 3,
    });
    if (!queryText) {
      setQueryText('Summarize the main points and key takeaways from this document in 3 short bullet points.');
    }
  };

  const handleExecute = async () => {
    if (!queryText.trim()) {
      setError('Please enter a prompt or question.');
      return;
    }

    if ((activeCategory === 'pdf' || activeCategory === 'image') && !attachment) {
      setError(`Please upload ${activeCategory === 'pdf' ? 'a PDF document' : 'an image'} or click "Use sample PDF".`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        query: queryText.trim(),
        config,
        promptType: activeCategory,
      };

      if (attachment) {
        payload.attachment = attachment;
      }

      if (activeCategory === 'image-gen') {
        payload.imageGenConfig = {
          aspectRatio,
          prompt: queryText.trim(),
        };
      }

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const result: QueryExecutionResult = await res.json();
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err.message || 'Unable to complete request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-request-title"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl flex flex-col shadow-2xl overflow-hidden my-auto max-h-[92vh]"
      >
        {/* Header - Clean and Minimal */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h3 id="send-request-title" className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ask AI</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask a question, analyze a document or image, or create a picture.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Mode Selector - 4 Clear Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveCategory('text')}
              className={`py-2 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeCategory === 'text'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('pdf');
                if (!attachment) {
                  fileInputRef.current?.click();
                }
              }}
              className={`py-2 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeCategory === 'pdf'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('image-gen')}
              className={`py-2 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeCategory === 'image-gen'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Create Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('image');
                if (!attachment) {
                  fileInputRef.current?.click();
                }
              }}
              className={`py-2 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeCategory === 'image'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Analyze Image</span>
            </button>
          </div>

          {/* Prompt Input Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {activeCategory === 'image-gen' ? 'Describe the image' : 'Your question or instructions'}
            </label>
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={
                activeCategory === 'image-gen'
                  ? 'e.g. Modern server racks with soft blue lights in a quiet data center...'
                  : activeCategory === 'pdf'
                  ? 'e.g. Summarize the main points from this document...'
                  : activeCategory === 'image'
                  ? 'e.g. What does this diagram show and what can be improved?...'
                  : 'e.g. How do I authenticate API requests with a bearer token?...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Aspect Ratio (Only when Create Image is active) */}
          {activeCategory === 'image-gen' && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Image Shape</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { ratio: '1:1', label: 'Square (1:1)' },
                  { ratio: '16:9', label: 'Wide (16:9)' },
                  { ratio: '4:3', label: 'Standard (4:3)' },
                  { ratio: '9:16', label: 'Portrait (9:16)' },
                ].map((item) => (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() => setAspectRatio(item.ratio as any)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center ${
                      aspectRatio === item.ratio
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Upload (Only when PDF or Analyze Image is active) */}
          {(activeCategory === 'pdf' || activeCategory === 'image') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {activeCategory === 'pdf' ? 'PDF File' : 'Image File'}
                </span>
                {!attachment && activeCategory === 'pdf' && (
                  <button
                    type="button"
                    onClick={handleUseSamplePdf}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] underline cursor-pointer"
                  >
                    Use sample PDF
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={activeCategory === 'pdf' ? '.pdf,application/pdf' : 'image/*'}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {attachment ? (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      {attachment.mimeType === 'application/pdf' ? (
                        <FileText className="w-4 h-4 text-red-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {attachment.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>{(attachment.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                    isDragOver 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <FileUp className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-slate-300">
                    Click to browse or drop your {activeCategory === 'pdf' ? 'PDF' : 'image'} here
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Max 25MB
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Example Suggestions */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Examples
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {PRESETS[activeCategory].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQueryText(p.query);
                    if (p.aspectRatio) {
                      setAspectRatio(p.aspectRatio);
                    }
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-200 group-hover:text-emerald-400">
                    <span>{p.title}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {p.query}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer - Minimalist */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Speed and cost optimization enabled
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={isLoading || !queryText.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>{activeCategory === 'image-gen' ? 'Create Image' : 'Send'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
