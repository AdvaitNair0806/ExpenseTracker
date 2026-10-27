import React, { useState } from 'react';
import { Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCards from '../components/dashboard/SummaryCards';
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown';
import TrendChart from '../components/dashboard/TrendChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';

export default function Dashboard() {
  const {
    transactions,
    summary,
    isLoading,
    isBackendOnline,
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Financial Overview
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isBackendOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isBackendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isBackendOnline ? 'Online' : 'Local Demo'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Summary of income, expenses, and cash flow trends
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            title="Refresh Ledger"
            className="ui-btn-secondary p-2 h-9 w-9"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="ui-btn-primary h-9"
          >
            <Plus size={15} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* Analytics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TrendChart transactions={transactions} isLoading={isLoading} />
        </div>
        <div>
          <SpendingBreakdown summary={summary} isLoading={isLoading} />
        </div>
      </div>

      {/* Recent Ledger */}
      <RecentTransactions
        transactions={transactions}
        isLoading={isLoading}
        onDelete={deleteTransaction}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={refresh}
      />
    </div>
  );
}
