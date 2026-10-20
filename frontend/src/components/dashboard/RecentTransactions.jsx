import React, { useState } from 'react';
import {
  Trash2, ShoppingBag, Utensils, Car, Home,
  Film, HeartPulse, Briefcase, Zap, GraduationCap,
  MoreHorizontal, TrendingUp, Sparkles,
} from 'lucide-react';

const CATEGORY_META = {
  'Food & Dining':      { icon: Utensils,      color: 'text-amber-400  bg-amber-500/10  ring-amber-500/20'  },
  'Groceries':          { icon: ShoppingBag,   color: 'text-lime-400   bg-lime-500/10   ring-lime-500/20'   },
  'Transportation':     { icon: Car,           color: 'text-blue-400   bg-blue-500/10   ring-blue-500/20'   },
  'Housing & Utilities':{ icon: Home,          color: 'text-purple-400 bg-purple-500/10 ring-purple-500/20' },
  'Utilities':          { icon: Zap,           color: 'text-purple-400 bg-purple-500/10 ring-purple-500/20' },
  'Entertainment':      { icon: Film,          color: 'text-pink-400   bg-pink-500/10   ring-pink-500/20'   },
  'Healthcare':         { icon: HeartPulse,    color: 'text-rose-400   bg-rose-500/10   ring-rose-500/20'   },
  'Education':          { icon: GraduationCap, color: 'text-indigo-400 bg-indigo-500/10 ring-indigo-500/20' },
  'Salary':             { icon: TrendingUp,    color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  'Freelance':          { icon: Briefcase,     color: 'text-teal-400   bg-teal-500/10   ring-teal-500/20'   },
  'Shopping':           { icon: ShoppingBag,   color: 'text-orange-400 bg-orange-500/10 ring-orange-500/20' },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] ?? {
    icon: MoreHorizontal,
    color: 'text-slate-400 bg-slate-500/10 ring-slate-500/20',
  };
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TableSkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 rounded-full bg-slate-800 animate-pulse" style={{ width: `${50 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

function DeleteButton({ onClick }) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (confirming) { onClick(); setConfirming(false); }
    else { setConfirming(true); setTimeout(() => setConfirming(false), 2000); }
  };

  return (
    <button
      onClick={handleClick}
      title={confirming ? 'Click again to confirm delete' : 'Delete transaction'}
      className={`
        flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium
        transition-all duration-200 active:scale-95
        ${confirming
          ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
          : 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'}
      `}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {confirming && <span>Confirm?</span>}
    </button>
  );
}

export default function RecentTransactions({ transactions = [], isLoading, onDelete }) {
  const recent = transactions.slice(0, 10);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isLoading ? 'Loading…' : `${transactions.length} total record${transactions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!isLoading && transactions.length > 0 && (
          <span className="flex h-6 items-center rounded-full bg-emerald-500/10 px-2.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
            Live
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Date', 'Vendor', 'Category', 'Type', 'Amount', ''].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableSkeletonRow key={i} />)
            ) : recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="h-7 w-7 text-slate-700" />
                    <p>No transactions yet. Add one above!</p>
                  </div>
                </td>
              </tr>
            ) : (
              recent.map(tx => {
                const meta = getCategoryMeta(tx.category);
                const Icon = meta.icon;
                const isIncome = tx.type === 'income';

                return (
                  <tr
                    key={tx.id}
                    className="group transition-colors hover:bg-slate-800/40"
                  >
                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-400">
                      {fmtDate(tx.date)}
                    </td>

                    {/* Vendor */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200 leading-tight">{tx.vendor || '—'}</p>
                          {tx.notes && (
                            <p className="mt-0.5 max-w-[160px] truncate text-[10px] text-slate-500">{tx.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.color}`}>
                        {tx.category}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                        isIncome
                          ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20'
                          : 'text-rose-400   bg-rose-500/10   ring-rose-500/20'
                      }`}>
                        {isIncome ? '↑ Income' : '↓ Expense'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 tabular-nums">
                      <span className={`font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {isIncome ? '+' : '-'}{fmtCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3.5">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton onClick={() => onDelete(tx.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer total row */}
      {!isLoading && recent.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3 text-xs text-slate-400">
          <span>Showing {Math.min(10, transactions.length)} of {transactions.length} transactions</span>
          <span className="text-slate-500">Sorted by most recent</span>
        </div>
      )}
    </div>
  );
}
