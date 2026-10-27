import React from 'react';
import { Database, Key, Server, Coins, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Environment & Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Local configuration for AI inference, persistent data store, and runtime parameters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Groq Cloud */}
        <div className="ui-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Key size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Groq LLM Engine</h2>
              <p className="text-[11px] text-slate-500">Inference provider credentials</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            API key is stored in your private backend environment file <code className="text-blue-400 bg-[#090d16] px-1.5 py-0.5 rounded border border-[#1e293b]">backend/.env</code>:
          </p>
          <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-500"># Groq API Configuration</div>
            <div>GROQ_API_KEY=gsk_********************</div>
            <div className="text-slate-400">GROQ_MODEL=llama-3.3-70b-versatile</div>
          </div>
        </div>

        {/* Currency & Locale */}
        <div className="ui-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Coins size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Currency & Formatting</h2>
              <p className="text-[11px] text-slate-500">Ledger display localization</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All ledger transactions, budget projections, and charts are formatted in Indian Rupee standard format:
          </p>
          <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] font-mono text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Locale:</span>
              <span className="text-slate-200">en-IN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Currency Code:</span>
              <span className="text-slate-200">INR (₹)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Number Grouping:</span>
              <span className="text-slate-200">Lakhs & Crores</span>
            </div>
          </div>
        </div>

        {/* Storage Adapter */}
        <div className="ui-card p-5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Data Storage</h2>
              <p className="text-[11px] text-slate-500">Local JSON store or external database adapter</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Currently persisting data to <code className="text-blue-400 bg-[#090d16] px-1.5 py-0.5 rounded border border-[#1e293b]">backend/transactions.json</code>. Optional enterprise adapters can be toggled in <code className="text-blue-400 bg-[#090d16] px-1.5 py-0.5 rounded border border-[#1e293b]">backend/.env</code>:
          </p>
          <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] font-mono text-xs text-slate-300">
            DATABASE_TYPE=json # Supported options: json | mongodb | postgresql
          </div>
        </div>
      </div>
    </div>
  );
}
