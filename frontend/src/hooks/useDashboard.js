/**
 * Custom React hook: useDashboard
 * Fetches summary + transactions from the FastAPI backend and manages local state.
 */
import { useState, useEffect, useCallback } from 'react';
import { transactionApi } from '../services/api';

const FALLBACK_TRANSACTIONS = [
  { id: 'demo_1', amount: 78.45, category: 'Food & Dining', vendor: 'Whole Foods Market', date: '2026-10-18', notes: 'Weekly groceries', type: 'expense' },
  { id: 'demo_2', amount: 3200,  category: 'Salary',         vendor: 'Acme Corp',          date: '2026-10-15', notes: 'Bi-weekly pay',   type: 'income'  },
  { id: 'demo_3', amount: 34.20, category: 'Transportation', vendor: 'Uber',                date: '2026-10-12', notes: 'Airport ride',    type: 'expense' },
  { id: 'demo_4', amount: 450,   category: 'Freelance',      vendor: 'Client Project',      date: '2026-10-10', notes: 'Consulting fee', type: 'income'  },
  { id: 'demo_5', amount: 24.00, category: 'Utilities',      vendor: 'DigitalOcean',        date: '2026-10-09', notes: 'VPS hosting',    type: 'expense' },
  { id: 'demo_6', amount: 19.99, category: 'Entertainment',  vendor: 'Netflix',             date: '2026-10-08', notes: 'Subscription',   type: 'expense' },
];

const FALLBACK_SUMMARY = {
  total_balance: 3522.36,
  total_income:  3650.00,
  total_expenses: 127.64,
  category_breakdown: { 'Food & Dining': 78.45, Transportation: 34.20, Utilities: 24.00, Entertainment: 19.99 },
  category_details: [
    { category: 'Food & Dining', amount: 78.45, percentage: 61.47, count: 1 },
    { category: 'Transportation', amount: 34.20, percentage: 26.80, count: 1 },
    { category: 'Utilities', amount: 24.00, percentage: 18.80, count: 1 },
    { category: 'Entertainment', amount: 19.99, percentage: 15.66, count: 1 },
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
