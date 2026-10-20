import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * Builds a last-7-day or last-30-day time series from raw transactions.
 */
function buildTimeSeries(transactions, days = 7) {
  const series = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series[key] = { date: key, income: 0, expenses: 0 };
  }

  for (const tx of transactions) {
    if (!tx.date) continue;
    const key = tx.date.slice(0, 10);
    if (!series[key]) continue;
    if (tx.type === 'income') series[key].income += tx.amount;
    else series[key].expenses += tx.amount;
  }

  return Object.values(series).map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2.5 shadow-xl backdrop-blur-md text-xs">
      <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium tabular-nums">
          {p.name === 'income' ? '↑ Income' : '↓ Expenses'}: ${p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export default function TrendChart({ transactions = [], isLoading }) {
  const [range, setRange] = useState(7);
  const data = buildTimeSeries(transactions, range);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Cash Flow Trend</h3>
            <p className="text-[11px] text-slate-400">Income vs Expenses over time</p>
          </div>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
          {[7, 30].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                range === d
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-slate-800/60" />
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gIncome)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#gExpenses)"
              dot={false}
              activeDot={{ r: 4, fill: '#f43f5e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-full bg-emerald-500" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-full bg-rose-500" /> Expenses
        </span>
      </div>
    </div>
  );
}
