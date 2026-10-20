import React, { useState } from 'react';
import { Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCards     from '../components/dashboard/SummaryCards';
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown';
import TrendChart        from '../components/dashboard/TrendChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';

export default function Dashboard() {
  const {
    transactions,
    summary,
    isLoading,
    isBackendOnline,
    addTransaction,
    deleteTransaction,
    refresh,
  } = useDashboard();

  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleAdded = () => refresh();

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Financial Dashboard
            </h1>
            {/* Backend status pill */}
            <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
              isBackendOnline
                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25'
                : 'bg-amber-500/10  text-amber-400  ring-amber-500/25'
            }`}>
              {isBackendOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
              {isBackendOnline ? 'API Connected' : 'Demo Mode'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-400">
            {isBackendOnline
              ? 'Live data from your FastAPI backend · /api/transactions'
              : 'Backend offline — showing demo data'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            title="Refresh data"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Add transaction */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────── */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* ── Charts row ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend chart — spans 2 cols */}
        <div className="lg:col-span-2">
          <TrendChart transactions={transactions} isLoading={isLoading} />
        </div>

        {/* Donut + breakdown — 1 col */}
        <SpendingBreakdown summary={summary} isLoading={isLoading} />
      </div>

      {/* ── Transactions table ──────────────────────── */}
      <RecentTransactions
        transactions={transactions}
        isLoading={isLoading}
        onDelete={deleteTransaction}
      />

      {/* ── Modal ───────────────────────────────────── */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleAdded}
      />
    </div>
  );
}
