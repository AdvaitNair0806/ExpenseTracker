import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown';
import TrendChart from '../components/dashboard/TrendChart';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export default function Analytics() {
  const { transactions, summary, isLoading } = useDashboard();

  const total = summary?.total_expenses ?? 0;
  const budget = 2500;
  const pct = Math.min(100, Math.round((total / budget) * 100));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Analytics & Budgets</h1>
        <p className="text-sm text-slate-400 mt-0.5">Visualize burn rate, monthly savings, and budget allocations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart transactions={transactions} isLoading={isLoading} />
        </div>
        <SpendingBreakdown summary={summary} isLoading={isLoading} />
      </div>

      {/* Budget tracker */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Monthly Budget Tracker</h3>
            <p className="text-[11px] text-slate-400">${budget.toLocaleString()} monthly limit</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Spent</span>
            <span className="font-semibold text-slate-100">${total.toFixed(2)} / ${budget.toLocaleString()}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct > 85 ? 'bg-rose-500' : pct > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">{pct}% of monthly budget used</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Daily Avg</p>
            <p className="text-sm font-bold text-white mt-1">${(total / 30).toFixed(2)}/day</p>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Projected Month-End</p>
            <p className="text-sm font-bold text-white mt-1">${(total * 1.15).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
