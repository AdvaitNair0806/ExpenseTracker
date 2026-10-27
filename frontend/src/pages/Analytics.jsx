import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown';
import TrendChart from '../components/dashboard/TrendChart';
import { BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val ?? 0);
}

export default function Analytics() {
  const { transactions, summary, isLoading } = useDashboard();

  const totalExpenses = summary?.total_expenses ?? 0;
  const totalIncome = summary?.total_income ?? 0;
  const monthlyBudget = 60000;
  const budgetPercent = Math.min(100, Math.round((totalExpenses / monthlyBudget) * 100));
  const dailyAverage = totalExpenses > 0 ? totalExpenses / 30 : 0;
  const projectedTotal = dailyAverage * 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Analytics & Budget Health
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Spending velocity, category distribution, and monthly threshold tracking
        </p>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TrendChart transactions={transactions} isLoading={isLoading} />
        </div>
        <div>
          <SpendingBreakdown summary={summary} isLoading={isLoading} />
        </div>
      </div>

      {/* Monthly Budget Card */}
      <div className="ui-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Monthly Budget Threshold</h2>
              <p className="text-xs text-slate-400">Target allocation cap for current billing period</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Target: </span>
            <span className="text-sm font-semibold text-slate-200 tabular-nums">{fmtINR(monthlyBudget)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Used: <strong className="text-slate-200 tabular-nums">{fmtINR(totalExpenses)}</strong>
            </span>
            <span className="font-semibold text-slate-300 tabular-nums">{budgetPercent}%</span>
          </div>
          <div className="h-2 w-full bg-[#090d16] border border-[#1e293b] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPercent > 90
                  ? 'bg-rose-500'
                  : budgetPercent > 70
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        {/* Velocity Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1e293b]/70">
          <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b]/80">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Daily Burn Rate</p>
            <p className="text-base font-bold text-slate-100 mt-1 tabular-nums">{fmtINR(dailyAverage)}/day</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Based on 30-day window</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b]/80">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Projected Spend</p>
            <p className="text-base font-bold text-slate-100 mt-1 tabular-nums">{fmtINR(projectedTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">At current burn rate</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b]/80">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Remaining Buffer</p>
            <p className={`text-base font-bold mt-1 tabular-nums ${
              monthlyBudget - totalExpenses >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {fmtINR(Math.max(0, monthlyBudget - totalExpenses))}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Until threshold limit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
