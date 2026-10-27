import React from 'react';
import AiAdvisorChat from '../components/ai/AiAdvisorChat';
import { Sparkles, Brain, Zap, ShieldCheck } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Brain, title: 'Context-Aware', desc: 'Reads your full transaction ledger in real time' },
  { icon: Zap, title: 'Low Latency', desc: 'High-speed Groq Llama 3.3 70B inference' },
  { icon: ShieldCheck, title: 'Local Privacy', desc: 'Financial data remains stored on your host' },
];

export default function AiInsights() {
  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-5rem)]">
      {/* Header Bar */}
      <div className="ui-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Financial Advisor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query your transaction dataset, request budgeting advice, or inspect anomalies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              title={desc}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090d16] border border-[#1e293b] text-xs text-slate-300"
            >
              <Icon size={12} className="text-blue-400" />
              <span className="text-[11px] font-medium">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full height chat container */}
      <div className="flex-1 min-h-0">
        <AiAdvisorChat />
      </div>
    </div>
  );
}
