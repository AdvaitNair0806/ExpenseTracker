import React from 'react';
import { LayoutDashboard, Receipt, Sparkles, PieChart, Settings, Wallet } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'expenses',    label: 'Expenses',    icon: Receipt },
  { id: 'ai-insights', label: 'AI Advisor',  icon: Sparkles },
  { id: 'analytics',   label: 'Analytics',   icon: PieChart },
  { id: 'settings',    label: 'Settings',    icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-56 h-screen sticky top-0 flex flex-col bg-[#0e1422] border-r border-[#1e293b]/70 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1e293b]/60">
        <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
          <Wallet size={16} />
        </div>
        <div className="leading-tight">
          <h1 className="font-semibold text-sm text-slate-100 tracking-tight">ExpenseAI</h1>
          <p className="text-[11px] text-slate-500">Personal Ledger</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Platform
        </div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-3 border-t border-[#1e293b]/60">
        <div className="p-3 rounded-lg bg-[#141c2e] border border-[#1e293b]/80">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-xs font-medium text-slate-200">Groq Engine</span>
          </div>
          <p className="text-[11px] text-slate-400">Llama 3.3 · Local Ledger</p>
        </div>
      </div>
    </aside>
  );
}
