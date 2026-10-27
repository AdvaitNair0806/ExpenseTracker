import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function buildSeries(transactions, days) {
  const map = {};
  const count = days === 'all' ? 30 : days;

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    map[k] = { date: k, income: 0, expenses: 0 };
  }

  for (const tx of transactions) {
    if (!tx.date) continue;
    const k = tx.date.slice(0, 10);
    if (!map[k]) continue;
    if (tx.type === 'income') {
      map[k].income += tx.amount;
    } else {
      map[k].expenses += tx.amount;
    }
  }

  return Object.values(map).map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    }),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141c2e] border border-[#1e293b] p-3 rounded-lg shadow-xl min-w-[140px]">
      <p className="text-[11px] font-semibold text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 text-xs mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: p.stroke }}
            />
            {p.name === 'income' ? 'Income' : 'Expenses'}
          </span>
          <span className="font-semibold tabular-nums text-slate-100">
            ₹{p.value.toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ transactions = [], isLoading }) {
  const [range, setRange] = useState(7);
  const data = buildSeries(transactions, range);

  return (
    <div className="ui-card p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Cash Flow Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tracking credits and debits</p>
        </div>

        {/* Range Selector */}
        <div className="flex bg-[#090d16] border border-[#1e293b] rounded-lg p-0.5">
          {[
            { label: '7D', value: 7 },
            { label: '30D', value: 30 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRange(item.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                range === item.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {isLoading ? (
        <div className="h-48 w-full bg-slate-800/40 rounded-lg animate-pulse" />
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                name="income"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#f43f5e' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-[#1e293b]/60 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded bg-emerald-500" />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded bg-rose-500" />
          <span>Expenses</span>
        </div>
      </div>
    </div>
  );
}
