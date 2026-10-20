import React from 'react';
import { DollarSign, Wallet, Sparkles, Repeat, ArrowUpRight, TrendingUp } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import ExpenseList from '../components/expenses/ExpenseList';
import AiInsightsCard from '../components/ai/AiInsightsCard';

export default function Dashboard({ 
  expenses, 
  onDeleteExpense, 
  isLoading, 
  onOpenAddExpense, 
  onOpenScanner 
}) {
  const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const monthlyBudget = 2500.00;
  const budgetRemaining = Math.max(0, monthlyBudget - totalSpent);
  const recurringTotal = expenses
    .filter(e => e.is_recurring)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  // Group by category for visual distribution
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount || 0);
    return acc;
  }, {});

  const categoriesSorted = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Financial Overview</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Tracker
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time expense monitoring powered by FastAPI and Groq AI Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>AI Receipt Scan</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spending"
          amount={`$${totalSpent.toFixed(2)}`}
          change="+8.4% vs last mo"
          changeType="negative"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Budget Remaining"
          amount={`$${budgetRemaining.toFixed(2)}`}
          change={`${Math.round((budgetRemaining / monthlyBudget) * 100)}% left`}
          changeType="positive"
          icon={Wallet}
          color="cyan"
        />
        <StatCard
          title="AI Savings Target"
          amount="$145.00"
          change="Groq recommendation"
          changeType="positive"
          icon={Sparkles}
          color="violet"
        />
        <StatCard
          title="Active Subscriptions"
          amount={`$${recurringTotal.toFixed(2)}/mo`}
          change={`${expenses.filter(e => e.is_recurring).length} services`}
          changeType="positive"
          icon={Repeat}
          color="amber"
        />
      </div>

      {/* Main Grid: Transactions & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Transactions */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Synced directly with FastAPI backend</p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {expenses.length} records
            </span>
          </div>

          <ExpenseList
            expenses={expenses}
            onDelete={onDeleteExpense}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: AI Insights & Category Breakdown */}
        <div className="space-y-6">
          <AiInsightsCard expenses={expenses} />

          {/* Category Breakdown Widget */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-1">Category Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Highest expenditure areas</p>

            <div className="space-y-3.5">
              {categoriesSorted.slice(0, 5).map(([category, amt]) => {
                const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-300">{category}</span>
                      <span className="font-semibold text-slate-100">${amt.toFixed(2)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
