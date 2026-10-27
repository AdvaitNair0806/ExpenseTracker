import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#64748b', // slate
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div className="bg-[#141c2e] border border-[#1e293b] p-2.5 rounded-lg shadow-xl text-xs">
      <div className="font-semibold text-slate-200 mb-1">{name}</div>
      <div className="text-slate-400">
        ₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        <span className="ml-1 text-slate-500">({inner.percentage?.toFixed(1) ?? 0}%)</span>
      </div>
    </div>
  );
};

export default function SpendingBreakdown({ summary, isLoading }) {
  const total = summary?.total_expenses ?? 0;

  // Handle both category_details (array) and category_breakdown (dict or array)
  let rawList = [];
  if (Array.isArray(summary?.category_details) && summary.category_details.length > 0) {
    rawList = summary.category_details.map(item => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage ?? (total > 0 ? (item.amount / total) * 100 : 0),
      count: item.count ?? 1,
    }));
  } else if (summary?.category_breakdown && typeof summary.category_breakdown === 'object') {
    if (Array.isArray(summary.category_breakdown)) {
      rawList = summary.category_breakdown.map(item => ({
        name: item.category || item.name,
        value: item.total_amount || item.amount || item.value || 0,
        percentage: total > 0 ? ((item.total_amount || item.amount || 0) / total) * 100 : 0,
        count: item.transaction_count || item.count || 1,
      }));
    } else {
      rawList = Object.entries(summary.category_breakdown).map(([cat, amt]) => ({
        name: cat,
        value: Number(amt),
        percentage: total > 0 ? (Number(amt) / total) * 100 : 0,
        count: 1,
      }));
    }
  }

  const data = rawList.map((entry, idx) => ({
    ...entry,
    color: PALETTE[idx % PALETTE.length],
  }));

  return (
    <div className="ui-card p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Spending Breakdown</h2>
        <p className="text-xs text-slate-500 mt-0.5">Top expenditure categories</p>
      </div>

      {isLoading ? (
        <div className="h-44 w-full bg-slate-800/40 rounded-lg animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-500">
          No expense transactions recorded yet
        </div>
      ) : (
        <>
          {/* Donut Chart */}
          <div className="h-36 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0e1422" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
            {data.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-300 truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 font-medium tabular-nums">
                    ₹{cat.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[11px] text-slate-500 w-9 text-right tabular-nums">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer note */}
      <div className="mt-3 pt-3 border-t border-[#1e293b]/60 flex justify-between items-center text-xs text-slate-500">
        <span>Categories tracked</span>
        <span className="font-semibold text-slate-400">{data.length}</span>
      </div>
    </div>
  );
}
