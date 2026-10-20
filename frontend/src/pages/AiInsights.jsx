import React, { useState } from 'react';
import { Sparkles, Brain, Cpu, Zap, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function AiInsights() {
  const [testInput, setTestInput] = useState('Uber trip to downtown office');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestCategory = async () => {
    if (!testInput) return;
    try {
      setLoading(true);
      const res = await aiService.suggestCategory(testInput);
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/40 border border-violet-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Groq AI Financial Engine</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ultra-fast inference using Groq Llama 3 models for automated receipt categorization and anomaly detection.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Playground */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" />
              <span>Real-Time Model Playground</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              llama-3.3-70b-versatile
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Enter any merchant or purchase description to test the FastAPI Groq categorization endpoint:
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="e.g. AWS Cloud Services, Chipotle Burrito, Spotify Premium"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />

            <button
              onClick={handleTestCategory}
              disabled={loading || !testInput}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>{loading ? "Evaluating with Groq..." : "Run Categorization Prompt"}</span>
            </button>
          </div>

          {prediction && (
            <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/30 space-y-2 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Predicted Category:</span>
                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {prediction.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Confidence Score:</span>
                <span className="text-violet-300 font-mono font-semibold">
                  {Math.round((prediction.confidence || 0.95) * 100)}%
                </span>
              </div>
              {prediction.reasoning && (
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Model Reasoning: </span>
                  {prediction.reasoning}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI Capabilities Configured</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Zero-Shot OCR Parsing</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Converts raw text or photo OCR dumps into structured JSON with store name, taxes, and items.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Automated Tax & Tip Deduction</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Distinguishes between base costs and gratuity for seamless business expense reporting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Subscription Leak Detection</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Flags recurring charges and alerts when sudden price increases occur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
