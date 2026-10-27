import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val ?? 0);
}

function StatCard({ label, value, subtext, icon: Icon, type = 'neutral' }) {
  const typeStyles = {
    income: {
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    expense: {
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      valueColor: 'text-rose-400',
    },
    neutral: {
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      valueColor: 'text-slate-100',
    },
  };

  const style = typeStyles[type] || typeStyles.neutral;

  return (
    <div className="ui-card p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${style.badgeBg}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight tabular-nums ${style.valueColor}`}>
          {fmtINR(value)}
        </p>
        {subtext && (
          <p className="mt-1 text-xs text-slate-500 font-normal">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ui-card p-5 animate-pulse">
            <div className="flex justify-between items-center mb-3">
              <div className="h-3 w-20 bg-slate-800 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-800" />
            </div>
            <div className="h-7 w-32 bg-slate-800 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const savingsRate =
    summary?.total_income > 0
      ? ((summary.total_balance / summary.total_income) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="Net Balance"
        value={summary?.total_balance}
        subtext={`${savingsRate}% of total income retained`}
        icon={Wallet}
        type="neutral"
      />
      <StatCard
        label="Total Income"
        value={summary?.total_income}
        subtext={`${summary?.income_count ?? 0} recorded transaction${(summary?.income_count ?? 0) !== 1 ? 's' : ''}`}
        icon={TrendingUp}
        type="income"
      />
      <StatCard
        label="Total Expenses"
        value={summary?.total_expenses}
        subtext={`${summary?.expense_count ?? 0} recorded transaction${(summary?.expense_count ?? 0) !== 1 ? 's' : ''}`}
        icon={TrendingDown}
        type="expense"
      />
    </div>
  );
}
