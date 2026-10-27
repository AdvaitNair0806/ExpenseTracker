import React, { useState } from 'react';
import {
  Trash2, ShoppingBag, Utensils, Car, Home,
  Film, HeartPulse, Briefcase, Zap, GraduationCap,
  MoreHorizontal, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Food & Dining': Utensils,
  'Groceries': ShoppingBag,
  'Transportation': Car,
  'Housing & Utilities': Home,
  'Utilities': Zap,
  'Entertainment': Film,
  'Healthcare': HeartPulse,
  'Education': GraduationCap,
  'Salary': Briefcase,
  'Freelance': Briefcase,
  'Shopping': ShoppingBag,
};

function fmtINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DeleteButton({ onClick }) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (confirming) {
      onClick();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={confirming ? 'Click again to confirm delete' : 'Delete transaction'}
      className={`p-1.5 rounded-md text-xs font-medium transition-all ${
        confirming
          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2'
          : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-1">
        <Trash2 size={14} />
        {confirming && <span className="text-[11px]">Confirm?</span>}
      </div>
    </button>
  );
}

export default function RecentTransactions({ transactions = [], isLoading, onDelete }) {
  const recent = transactions.slice(0, 8);

  return (
    <div className="ui-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]/70">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Recent Transactions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLoading ? 'Fetching records...' : `${transactions.length} total entries in ledger`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b]/50 text-slate-500 font-medium">
              <th className="py-3 px-5">Type / Vendor</th>
              <th className="py-3 px-5">Category</th>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5 text-right">Amount</th>
              <th className="py-3 px-5 text-right w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/40">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-5"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                  <td className="py-3.5 px-5"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                  <td className="py-3.5 px-5"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                  <td className="py-3.5 px-5 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                  <td className="py-3.5 px-5" />
                </tr>
              ))
            ) : recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No transactions found. Add a transaction or scan a receipt to get started.
                </td>
              </tr>
            ) : (
              recent.map((tx) => {
                const isIncome = tx.type === 'income';
                const IconComponent = CATEGORY_ICONS[tx.category] || MoreHorizontal;

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Vendor & Type */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{tx.vendor || 'Untitled'}</p>
                          {tx.notes && (
                            <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{tx.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/40 text-[11px] font-medium text-slate-300">
                        <IconComponent size={12} className="text-slate-400" />
                        {tx.category || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-5 text-slate-400 tabular-nums">
                      {fmtDate(tx.date)}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-5 text-right font-semibold tabular-nums">
                      <span className={isIncome ? 'text-emerald-400' : 'text-slate-200'}>
                        {isIncome ? '+' : '-'}{fmtINR(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-5 text-right">
                      <DeleteButton onClick={() => onDelete(tx.id)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
