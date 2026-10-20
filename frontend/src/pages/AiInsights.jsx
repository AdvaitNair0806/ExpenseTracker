/**
 * AiInsights page  —  dedicated full-screen AI Advisor experience
 * Accessible from the sidebar nav item "AI Intelligence"
 */
import React from 'react';
import AiAdvisorChat from '../components/ai/AiAdvisorChat';
import { Sparkles, Brain, Zap, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Brain,       title: 'Context-Aware',   desc: 'Reads your full transaction ledger before every answer.' },
  { icon: Zap,         title: 'Instant',          desc: 'Groq inference — sub-second responses via Llama 3.3.' },
  { icon: ShieldCheck, title: 'Private',           desc: 'Data stays local on your machine. Nothing is sent to third-party storage.' },
];

export default function AiInsights() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      {/* Header strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg ring-1 ring-violet-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">AI Financial Advisor</h1>
            <p className="text-xs text-slate-400">Powered by Groq Cloud · Llama 3.3 · Live transaction context</p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              title={desc}
              className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-2.5 py-1 cursor-default hover:border-violet-500/30 transition-colors"
            >
              <Icon className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] font-semibold text-slate-300">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel — fills remaining height */}
      <div className="relative flex-1 min-h-0">
        <AiAdvisorChat />
      </div>
    </div>
  );
}
