import React, { useState } from 'react';
import { X, Sparkles, Upload, Loader2, Check, FileText } from 'lucide-react';
import { aiService } from '../../services/aiService';

const SAMPLE_RECEIPT = `TRADER JOE'S #521
San Francisco, CA
Date: 10/19/2026 18:42
--------------------------------
Organic Bananas         $2.19
Almond Milk (Unsweet)   $3.49
Dark Chocolate 72%      $2.99
Cold Brew Coffee        $4.99
Wild Sockeye Salmon    $14.99
--------------------------------
SUBTOTAL               $28.65
TAX                     $2.43
TOTAL                  $31.08
--------------------------------
Thank you for shopping at Trader Joe's!`;

export default function ReceiptScannerModal({ isOpen, onClose, onAddExpense }) {
  const [receiptText, setReceiptText] = useState(SAMPLE_RECEIPT);
  const [isScanning, setIsScanning] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!receiptText.trim()) return;
    try {
      setIsScanning(true);
      const result = await aiService.scanReceipt(receiptText);
      setParsedResult(result);
    } catch (err) {
      console.error("Failed to parse receipt:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!parsedResult) return;
    onAddExpense({
      title: parsedResult.merchant || "Scanned Receipt",
      amount: parsedResult.total_amount || 0,
      category: parsedResult.suggested_category || "Food & Dining",
      date: new Date().toISOString(),
      notes: `AI Receipt scan (${parsedResult.confidence_score ? Math.round(parsedResult.confidence_score * 100) : 95}% confidence)`,
      payment_method: "Credit Card",
      is_recurring: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Groq AI Receipt Scanner</h3>
              <p className="text-xs text-slate-400">Extracts line items, merchant, and totals instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Raw Receipt Text / OCR Data</label>
              <button
                type="button"
                onClick={() => setReceiptText(SAMPLE_RECEIPT)}
                className="text-xs text-emerald-400 hover:underline"
              >
                Reset to Sample
              </button>
            </div>
            <textarea
              rows={6}
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder="Paste raw text from a receipt, email bill, or invoice..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={handleScan}
            disabled={isScanning || !receiptText.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing receipt with Groq LLM...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse Receipt with AI</span>
              </>
            )}
          </button>

          {/* AI Extraction Result Card */}
          {parsedResult && (
            <div className="bg-slate-950/80 border border-violet-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Detected Merchant</span>
                  <h4 className="text-sm font-bold text-white">{parsedResult.merchant || "Unknown Store"}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Total</span>
                  <div className="text-base font-extrabold text-white">
                    ${parsedResult.total_amount ? parsedResult.total_amount.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {parsedResult.suggested_category || "Food & Dining"}
                </span>
                <span>•</span>
                <span>{parsedResult.date || 'Recent'}</span>
              </div>

              {parsedResult.insights && (
                <p className="text-xs text-slate-400 italic bg-violet-950/30 border border-violet-800/40 p-2.5 rounded-lg">
                  💡 {parsedResult.insights}
                </p>
              )}

              <button
                onClick={handleApply}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Add to Tracker</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
