import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Sparkles, 
  PieChart, 
  Settings, 
  Wallet,
  Cpu,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'All Expenses', icon: Receipt, badge: 'Live' },
    { id: 'ai-insights', label: 'AI Intelligence', icon: Sparkles, badge: 'Groq' },
    { id: 'analytics', label: 'Analytics & Budgets', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/95 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Brand Logo Header */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Wallet className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Expense<span className="text-emerald-400">AI</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Finance Engine</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1.5">
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badge === 'Groq'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tech Stack Footer Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-slate-200">Groq LLM Engine</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Instant OCR receipt parsing & smart automated categorization.
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>FastAPI + Mongo / Postgres</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
