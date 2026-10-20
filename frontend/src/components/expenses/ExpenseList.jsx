import React from 'react';
import { 
  ShoppingBag, 
  Utensils, 
  Car, 
  Home, 
  Film, 
  HeartPulse, 
  MoreHorizontal, 
  Trash2, 
  Clock,
  Sparkles
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Food & Dining': { icon: Utensils, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'Transportation': { icon: Car, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  'Shopping': { icon: ShoppingBag, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'Housing & Utilities': { icon: Home, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  'Entertainment': { icon: Film, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  'Healthcare': { icon: HeartPulse, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

export default function ExpenseList({ expenses, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm">Connecting to FastAPI and fetching transactions...</p>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
        <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">No expenses recorded yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Add an expense manually or use the Groq AI receipt scanner to automatically capture your spending.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/80">
      {expenses.map((expense) => {
        const categoryData = CATEGORY_CONFIG[expense.category] || {
          icon: ShoppingBag,
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
        };
        const Icon = categoryData.icon;
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between py-4 px-3 hover:bg-slate-800/40 rounded-xl transition-colors group"
          >
            {/* Left: Category Icon + Title + Meta */}
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl border ${categoryData.color}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {expense.title}
                  </h4>
                  {expense.is_recurring && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Recurring
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-medium text-slate-300">{expense.category}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                  {expense.payment_method && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">{expense.payment_method}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Amount + Actions */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-base font-bold text-white tracking-tight">
                  -₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {expense.notes && (
                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{expense.notes}</p>
                )}
              </div>

              <button
                onClick={() => onDelete(expense.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Delete expense"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
