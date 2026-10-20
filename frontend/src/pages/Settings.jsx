import React from 'react';
import { Database, Key, Server, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        <h1 className="text-2xl font-extrabold text-white">System Settings & Connections</h1>
        <p className="text-xs text-slate-400 mt-1">Configure your AI providers, database drivers, and currency formats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-bold text-white">Groq AI API Key</h3>
          </div>
          <p className="text-xs text-slate-400">
            Configure your Groq Cloud credentials in <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">backend/.env</code>:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
            GROQ_API_KEY=gsk_your_key_here<br/>
            GROQ_MODEL=llama-3.3-70b-versatile
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Database Adapter</h3>
          </div>
          <p className="text-xs text-slate-400">
            Switch between MongoDB (Motor) and PostgreSQL (SQLAlchemy async) in <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">backend/.env</code>:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
            DATABASE_TYPE=mongodb # or postgresql<br/>
            MONGODB_URI=mongodb://localhost:27017
          </div>
        </div>
      </div>
    </div>
  );
}
