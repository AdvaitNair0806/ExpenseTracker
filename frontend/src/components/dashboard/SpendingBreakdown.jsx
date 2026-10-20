import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

// Curated palette — harmonious, not generic
const PALETTE = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
  '#84cc16', // lime
];

function CategoryRow({ category, amount, percentage, color, count }) {
  return (
    <div className="group flex items-center gap-3 py-2.5">
      {/* Color dot */}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: color }}
      />

      {/* Label + count */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between mb-1">
          <span className="truncate text-xs font-medium text-slate-200">
            {category}
          </span>
          <span className="ml-2 shrink-0 text-xs font-semibold text-slate-100 tabular-nums">
            ${amount.toFixed(2)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(percentage, 100)}%`, background: color }}
          />
        </div>

        <p className="mt-0.5 text-[10px] text-slate-500">
          {percentage.toFixed(1)}% · {count} txn{count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold text-slate-200">{name}</p>
      <p className="text-sm font-bold" style={{ color: inner?.fill }}>
        ${value.toFixed(2)}
      </p>
    </div>
  );
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="mx-auto h-44 w-44 rounded-full bg-slate-800/60" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-full rounded bg-slate-800" />
            <div className="h-1.5 w-3/4 rounded-full bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpendingBreakdown({ summary, isLoading }) {
  const data = useMemo(() => {
    if (!summary?.category_details?.length) return [];
    return summary.category_details.map((d, i) => ({
      name: d.category,
      value: d.amount,
      percentage: d.percentage,
      count: d.count,
      fill: PALETTE[i % PALETTE.length],
    }));
  }, [summary]);

  const hasData = data.length > 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
          <PieIcon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-white">Spending Breakdown</h3>
          <p className="text-[11px] text-slate-400">Expenses by category</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <PieIcon className="h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-400">No expense data yet.</p>
        </div>
      ) : (
        <>
          {/* Recharts Donut */}
          <div className="mx-auto h-52 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationBegin={100}
                  animationDuration={900}
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category list */}
          <div className="mt-4 divide-y divide-slate-800/60">
            {data.map((d) => (
              <CategoryRow
                key={d.name}
                category={d.name}
                amount={d.value}
                percentage={d.percentage}
                count={d.count}
                color={d.fill}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
