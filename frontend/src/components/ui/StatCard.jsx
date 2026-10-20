import React from 'react';

export default function StatCard({ title, amount, change, changeType = 'positive', icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    violet: 'from-violet-500/10 to-indigo-500/5 text-violet-400 border-violet-500/20',
    cyan: 'from-cyan-500/10 to-blue-500/5 text-cyan-400 border-cyan-500/20',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-400 border-amber-500/20',
  };

  const badgeColor = changeType === 'positive' 
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

  return (
    <div className={`rounded-xl border p-5 bg-gradient-to-br ${colorMap[color] || colorMap.emerald} backdrop-blur-sm transition-all hover:border-slate-700`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-white">{amount}</h3>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
