import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import AiAdvisorChat from './AiAdvisorChat';

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="chat-fab-btn"
        onClick={() => setOpen((o) => !o)}
        title="AI Financial Advisor"
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-blue-400/30 transition-all ${
          open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <MessageSquare size={18} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed bottom-0 right-0 z-50 w-full sm:w-[420px] sm:bottom-6 sm:right-6 flex flex-col rounded-t-xl sm:rounded-xl border border-[#1e293b] bg-[#0e1422] shadow-2xl transition-all duration-200 ${
          open
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
        style={{ height: 'min(620px, 85vh)' }}
      >
        {/* Drawer Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e293b]/70 bg-[#141c2e] rounded-t-xl">
          <span className="text-xs font-semibold text-slate-200">AI Assistant</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <AiAdvisorChat />
        </div>
      </div>
    </>
  );
}
