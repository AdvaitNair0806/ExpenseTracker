import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import {
  Search, Plus, Filter, Trash2,
  ShoppingBag, Utensils, Car, Home, Film, HeartPulse,
  Briefcase, Zap, GraduationCap, MoreHorizontal,
  ArrowUpRight, ArrowDownLeft
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

const CATEGORIES = [
  'All', 'Food & Dining', 'Groceries', 'Transportation',
  'Housing & Utilities', 'Entertainment', 'Healthcare',
  'Shopping', 'Education', 'Salary', 'Freelance', 'Miscellaneous'
];

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

export default function Expenses() {
  const { transactions, isLoading, deleteTransaction, refresh } = useDashboard();

  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const filtered = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchVendor = t.vendor?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      if (!matchVendor && !matchCat && !matchNotes) return false;
    }
    return true;
  });

  const handleDelete = (id) => {
    if (deletingId === id) {
      deleteTransaction(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full history of your logged expenses and income records
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="ui-btn-primary h-9"
        >
          <Plus size={15} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="ui-card p-3 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search vendor, category, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input pl-9 h-9 text-xs"
          />
        </div>

        {/* Type Toggle */}
        <div className="flex bg-[#090d16] border border-[#1e293b] rounded-lg p-0.5 w-full md:w-auto shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'expense', label: 'Expenses' },
            { id: 'income', label: 'Income' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className={`flex-1 md:flex-initial px-3 py-1 text-xs font-medium rounded-md transition-all ${
                typeFilter === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-48 shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="ui-input h-9 text-xs cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#0e1422] text-slate-200">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ui-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1e293b]/70 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-slate-200">{filtered.length}</strong> of {transactions.length} records</span>
          {(typeFilter !== 'all' || categoryFilter !== 'All' || search) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('All');
                setSearch('');
              }}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

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
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-5"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-5 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-3.5 px-5" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const IconComponent = CATEGORY_ICONS[tx.category] || MoreHorizontal;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
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
                              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/40 text-[11px] font-medium text-slate-300">
                          <IconComponent size={12} className="text-slate-400" />
                          {tx.category || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-slate-400 tabular-nums">
                        {fmtDate(tx.date)}
                      </td>

                      <td className="py-3 px-5 text-right font-semibold tabular-nums">
                        <span className={isIncome ? 'text-emerald-400' : 'text-slate-200'}>
                          {isIncome ? '+' : '-'}{fmtINR(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                            deletingId === tx.id
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2'
                              : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Trash2 size={14} />
                            {deletingId === tx.id && <span className="text-[11px]">Confirm?</span>}
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={refresh}
      />
    </div>
  );
}
