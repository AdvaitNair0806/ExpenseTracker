import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '../../services/aiService';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing & Utilities',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Education',
  'Miscellaneous',
];

export default function AddExpenseModal({ isOpen, onClose, onAddExpense }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);

  if (!isOpen) return null;

  const handleAiCategorize = async () => {
    if (!title.trim()) return;
    try {
      setIsAiCategorizing(true);
      const res = await aiService.suggestCategory(title);
      if (res.category) {
        setCategory(res.category);
        setAiConfidence(res.confidence ? Math.round(res.confidence * 100) : 95);
      }
    } catch (err) {
      console.error("AI Categorization error:", err);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    onAddExpense({
      title,
      amount: parseFloat(amount),
      category,
      date: new Date(date).toISOString(),
      notes,
      payment_method: paymentMethod,
      is_recurring: isRecurring,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Add New Expense</h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              FastAPI
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title & AI Assist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Expense Title / Merchant</label>
              <button
                type="button"
                onClick={handleAiCategorize}
                disabled={!title.trim() || isAiCategorizing}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium disabled:opacity-50 transition-colors"
              >
                {isAiCategorizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Auto-categorize with Groq</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks, Uber ride, Whole Foods"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Category & AI Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              {aiConfidence && (
                <span className="text-[11px] text-violet-400 font-medium">
                  AI Confidence: {aiConfidence}%
                </span>
              )}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Crypto">Crypto</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Any additional details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Recurring Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/20"
            />
            <label htmlFor="recurring" className="text-xs text-slate-300 select-none cursor-pointer">
              Mark as recurring subscription (monthly/annual)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm shadow-emerald-500/20"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
