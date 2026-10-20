import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import { Search, Plus, Sparkles, Filter } from 'lucide-react';

const TYPE_FILTERS = ['all', 'expense', 'income'];
const CATEGORY_OPTIONS = [
  'All', 'Food & Dining', 'Groceries', 'Transportation',
  'Housing & Utilities', 'Utilities', 'Entertainment', 'Healthcare',
  'Shopping', 'Travel', 'Education', 'Salary', 'Freelance', 'Miscellaneous',
];

export default function Expenses() {
  const { transactions, isLoading, deleteTransaction, refresh } = useDashboard();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [catFilter, setCatFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');

  const filtered = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (catFilter !== 'All' && t.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.vendor?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">All Transactions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Full ledger from transactions.json</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search vendor, category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                typeFilter === f
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <RecentTransactions
        transactions={filtered}
        isLoading={isLoading}
        onDelete={deleteTransaction}
      />

      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={refresh}
      />
    </div>
  );
}
