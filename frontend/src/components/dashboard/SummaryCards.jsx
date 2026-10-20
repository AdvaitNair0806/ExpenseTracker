import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from 'lucide-react';

const CARD_CONFIG = {
  balance: {
    label: 'Total Balance',
    icon: Wallet,
    gradient: 'from-emerald-500/15 to-teal-500/5',
    border: 'border-emerald-500/25',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    valueColor: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  income: {
    label: 'Total Income',
    icon: TrendingUp,
    gradient: 'from-cyan-500/15 to-blue-500/5',
    border: 'border-cyan-500/25',
    iconBg: 'bg-cyan-500/15 text-cyan-400',
    valueColor: 'text-cyan-400',
    ring: 'ring-cyan-500/20',
  },
  expenses: {
    label: 'Total Expenses',
    icon: TrendingDown,
    gradient: 'from-rose-500/15 to-pink-500/5',
    border: 'border-rose-500/25',
    iconBg: 'bg-rose-500/15 text-rose-400',
    valueColor: 'text-rose-400',
    ring: 'ring-rose-500/20',
  },
};

function Skeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-28 bg-slate-800 rounded-full" />
        <div className="h-9 w-9 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-8 w-36 bg-slate-800 rounded-lg mt-2" />
      <div className="h-3 w-20 bg-slate-800 rounded-full mt-3" />
    </div>
  );
}

function SummaryCard({ type, value, subLabel, isLoading }) {
  const cfg = CARD_CONFIG[type];
  const Icon = cfg.icon;

  if (isLoading) return <Skeleton />;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value ?? 0);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border p-6
        bg-gradient-to-br ${cfg.gradient} ${cfg.border}
        backdrop-blur-sm
        transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
        hover:ring-2 ${cfg.ring}
        group cursor-default
      `}
    >
      {/* Glow orb */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-current opacity-5 blur-2xl" />

      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {cfg.label}
        </span>
        <span className={`p-2 rounded-xl ${cfg.iconBg} ring-1 ${cfg.ring}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className={`mt-4 text-3xl font-extrabold tracking-tight ${cfg.valueColor} tabular-nums`}>
        {formatted}
      </p>

      {subLabel && (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <ArrowUpRight className="h-3 w-3 text-slate-500" />
          {subLabel}
        </p>
      )}
    </div>
  );
}

export default function SummaryCards({ summary, isLoading }) {
  const savingsRate = summary?.total_income > 0
    ? ((summary.total_balance / summary.total_income) * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard
        type="balance"
        value={summary?.total_balance}
        subLabel={`${savingsRate}% savings rate`}
        isLoading={isLoading}
      />
      <SummaryCard
        type="income"
        value={summary?.total_income}
        subLabel={`${summary?.income_count ?? 0} income sources`}
        isLoading={isLoading}
      />
      <SummaryCard
        type="expenses"
        value={summary?.total_expenses}
        subLabel={`${summary?.expense_count ?? 0} transactions`}
        isLoading={isLoading}
      />
    </div>
  );
}
