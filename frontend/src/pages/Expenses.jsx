import React, { useState } from 'react';
import { Search, Filter, Plus, Sparkles } from 'lucide-react';
import ExpenseList from '../components/expenses/ExpenseList';

export default function Expenses({ 
  expenses, 
  onDeleteExpense, 
  isLoading, 
  onOpenAddExpense, 
  onOpenScanner 
}) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = expenses.filter(e => {
    const matchesCat = filterCategory === 'All' || e.category === filterCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const categories = ['All', ...new Set(expenses.map(e => e.category))];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Expense History</h1>
          <p className="text-xs text-slate-400 mt-1">Full transaction register with AI insights</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>AI Receipt Scan</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <ExpenseList
          expenses={filtered}
          onDelete={onDeleteExpense}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
