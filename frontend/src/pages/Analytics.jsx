import React from 'react';
import { PieChart, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';

export default function Analytics({ expenses }) {
  const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        <h1 className="text-2xl font-extrabold text-white">Analytics & Budgets</h1>
        <p className="text-xs text-slate-400 mt-1">Visualize burn rate, monthly savings, and budget allocations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Monthly Budget Allocation</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-400">$2,500 Budget</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Total Spent</span>
                <span className="text-white font-semibold">${total.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (total / 2500) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500">Daily Average</span>
                <p className="text-sm font-bold text-white mt-1">${(total / 30).toFixed(2)}/day</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500">Projected Month-End</span>
                <p className="text-sm font-bold text-white mt-1">${(total * 1.15).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <span>Top Categories Distribution</span>
          </h3>

          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs text-slate-300 font-medium">Interactive Chart Ready</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports Recharts / Chart.js for interactive visualizations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
