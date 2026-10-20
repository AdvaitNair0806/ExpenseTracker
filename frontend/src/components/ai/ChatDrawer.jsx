/**
 * ChatDrawer.jsx
 *
 * A slide-in chat drawer accessible from anywhere in the app via a FAB button.
 * Opens from the bottom-right corner. Independent of page routing.
 */
import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import AiAdvisorChat from './AiAdvisorChat';

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB button */}
      <button
        id="chat-fab-btn"
        onClick={() => setOpen(o => !o)}
        title="AI Financial Advisor"
        className={`
          fixed bottom-6 right-6 z-40
          flex h-13 w-13 items-center justify-center gap-2.5
          rounded-full shadow-2xl shadow-violet-500/30
          bg-gradient-to-br from-violet-600 to-indigo-700
          text-white ring-2 ring-violet-500/40
          transition-all duration-300 active:scale-90
          ${open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
        `}
        style={{ width: 52, height: 52 }}
      >
        <MessageCircle className="h-6 w-6" />
        {/* Pulse ring */}
        <span className="absolute h-full w-full animate-ping rounded-full bg-violet-500 opacity-15" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`
          fixed bottom-0 right-0 z-50
          w-full sm:w-[420px] sm:bottom-6 sm:right-6
          flex flex-col
          rounded-t-2xl sm:rounded-2xl
          border border-slate-700/60
          bg-slate-900 shadow-2xl shadow-black/60
          transition-all duration-300 ease-out
          ${open
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0 pointer-events-none'}
        `}
        style={{ height: 'min(600px, 80vh)' }}
      >
        {/* Drawer handle (mobile) */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-bold text-white">AI Advisor</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Close button (desktop, overlaid on chat header) */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 hidden sm:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Chat widget fills drawer */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-b-2xl">
          <AiAdvisorChat />
        </div>
      </div>
    </>
  );
}
