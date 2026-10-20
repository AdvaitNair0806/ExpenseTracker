/**
 * Custom React hook: useDashboard
 * Fetches summary + transactions from the FastAPI backend and manages local state.
 */
import { useState, useEffect, useCallback } from 'react';
import { transactionApi } from '../services/api';

const FALLBACK_TRANSACTIONS = [
  { id: 'demo_1', amount: 75000, category: 'Salary',         vendor: 'Acme Tech India',    date: '2026-10-15', notes: 'Monthly salary',      type: 'income'  },
  { id: 'demo_2', amount: 15000, category: 'Freelance',      vendor: 'Design Client',      date: '2026-10-10', notes: 'Consulting milestone',type: 'income'  },
  { id: 'demo_3', amount: 2850,  category: 'Groceries',      vendor: 'Blinkit / Nature',   date: '2026-10-18', notes: 'Weekly groceries',    type: 'expense' },
  { id: 'demo_4', amount: 650,   category: 'Food & Dining',  vendor: "Haldiram's",         date: '2026-10-20', notes: 'Dinner with friends', type: 'expense' },
  { id: 'demo_5', amount: 1200,  category: 'Utilities',      vendor: 'Jio Fiber',          date: '2026-10-14', notes: 'Broadband internet',  type: 'expense' },
  { id: 'demo_6', amount: 649,   category: 'Entertainment',  vendor: 'Netflix India',      date: '2026-10-09', notes: 'Monthly premium',     type: 'expense' },
];

const FALLBACK_SUMMARY = {
  total_balance: 84651.00,
  total_income:  90000.00,
  total_expenses: 5349.00,
  category_breakdown: { 'Groceries': 2850, 'Utilities': 1200, 'Food & Dining': 650, 'Entertainment': 649 },
  category_details: [
    { category: 'Groceries', amount: 2850, percentage: 53.28, count: 1 },
    { category: 'Utilities', amount: 1200, percentage: 22.43, count: 1 },
    { category: 'Food & Dining', amount: 650, percentage: 12.15, count: 1 },
    { category: 'Entertainment', amount: 649, percentage: 12.13, count: 1 },
  ],
  transaction_count: 6,
  income_count: 2,
  expense_count: 4,
};

export function useDashboard() {
  const [transactions, setTransactions] = useState(FALLBACK_TRANSACTIONS);
  const [summary, setSummary]           = useState(FALLBACK_SUMMARY);
  const [isLoading, setIsLoading]       = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [error, setError]               = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [txns, summ] = await Promise.all([
        transactionApi.getAll(),
        transactionApi.getSummary(),
      ]);
      setTransactions(txns);
      setSummary(summ);
      setIsBackendOnline(true);
    } catch (err) {
      console.warn('Backend unavailable – using demo data.', err.message);
      setIsBackendOnline(false);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addTransaction = useCallback(async (payload, mode = 'manual') => {
    try {
      let saved;
      if (isBackendOnline) {
        if (mode === 'ai-text') {
          saved = await transactionApi.addFromText(payload.note);
        } else if (mode === 'ai-receipt') {
          saved = await transactionApi.addFromReceipt(payload.file);
        } else {
          saved = await transactionApi.addManual(payload);
        }
        // Refresh after save so summary totals stay accurate
        await loadData();
      } else {
        const mock = { id: `local_${Date.now()}`, ...payload };
        setTransactions(prev => [mock, ...prev]);
      }
      return saved;
    } catch (err) {
      console.error('addTransaction failed:', err);
      throw err;
    }
  }, [isBackendOnline, loadData]);

  const deleteTransaction = useCallback(async (id) => {
    // Optimistic remove
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      if (isBackendOnline) {
        await transactionApi.delete(id);
        // Re-fetch summary counts
        const summ = await transactionApi.getSummary();
        setSummary(summ);
      }
    } catch (err) {
      console.error('deleteTransaction failed:', err);
      // Re-load to restore state
      await loadData();
    }
  }, [isBackendOnline, loadData]);

  return {
    transactions,
    summary,
    isLoading,
    isBackendOnline,
    error,
    addTransaction,
    deleteTransaction,
    refresh: loadData,
  };
}
