import React, { useState } from 'react';
import { Sparkles, X, RefreshCw, CheckCircle2, ShieldAlert, TrendingUp, Layers } from 'lucide-react';
import { Department } from '../types';
import { api } from '../lib/api';

interface AiInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDepartment: Department | 'all';
}

export const AiInsightModal: React.FC<AiInsightModalProps> = ({
  isOpen,
  onClose,
  currentDepartment,
}) => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('Executive health check & risk mitigations');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.getAiDepartmentInsight(currentDepartment, topic);
      setAnalysis(res.analysis);
      setSource(res.source);
    } catch (err: any) {
      setAnalysis('Failed to generate briefing. Please ensure server is operational.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Department Intelligence & Risk Briefing
              </h3>
              <p className="text-[11px] text-slate-400">
                Scope: <strong className="text-indigo-600 uppercase">{currentDepartment}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Select Analysis Priority</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value="Executive health check & risk mitigations">Executive health check & risk mitigations</option>
              <option value="Pipeline velocity & revenue closure projections">Pipeline velocity & revenue closure projections</option>
              <option value="Client churn prevention & support SLA bottlenecks">Client churn prevention & support SLA bottlenecks</option>
              <option value="Cross-department operational handoff friction">Cross-department operational handoff friction</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing live database records...' : 'Run Department Analysis'}</span>
          </button>

          {analysis && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-700">Analysis Output</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                  Engine: {source}
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                {analysis}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
