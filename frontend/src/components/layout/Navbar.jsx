import React from 'react';
import { Search, Sparkles, Plus, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ onOpenAddExpense, onOpenScanner, isBackendOnline }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="relative w-80 hidden md:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search expenses, merchants, tags..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Backend Status Indicator */}
        <div 
          title={isBackendOnline ? "FastAPI Backend is online" : "FastAPI Backend offline (Check http://localhost:8000)"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isBackendOnline 
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
              : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="hidden sm:inline">{isBackendOnline ? 'API Connected' : 'API Offline'}</span>
        </div>

        {/* AI Receipt Scanner Trigger */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-200" />
          <span>AI Scan Receipt</span>
        </button>

        {/* Add Expense Button */}
        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>

        {/* Notifications & Profile */}
        <div className="w-[1px] h-6 bg-slate-800 mx-1 hidden sm:block"></div>

        <button className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-slate-950 ring-2 ring-emerald-500/20">
            AN
          </div>
        </div>
      </div>
    </header>
  );
}
