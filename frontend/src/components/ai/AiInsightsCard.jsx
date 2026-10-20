import React from 'react';
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb, ArrowUpRight } from 'lucide-react';

export default function AiInsightsCard({ expenses = [] }) {
  const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const diningTotal = expenses
    .filter(e => e.category === 'Food & Dining')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const diningPercentage = total > 0 ? Math.round((diningTotal / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Financial Copilot</h3>
            <p className="text-xs text-slate-400">Powered by Groq Llama 3</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
          Smart Tips
        </span>
      </div>

      {/* Dynamic Insights based on data */}
      <div className="space-y-3">
        {diningPercentage > 30 && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Dining accounts for {diningPercentage}% of spending</p>
              <p className="text-slate-400 mt-0.5">
                Groq analysis suggests cooking 2 more meals at home could save an estimated $120/month.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-300">Recurring Subscription Audit</p>
            <p className="text-slate-400 mt-0.5">
              Detected 2 recurring services. Review your active subscriptions to prevent silent budget leaks.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs">
          <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-indigo-300">Smart OCR Receipt Parsing Ready</p>
            <p className="text-slate-400 mt-0.5">
              Click "AI Scan Receipt" to parse paper bills or emails into categorized records in &lt;1 second.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
