/**
 * AiAdvisorChat.jsx
 *
 * A full-featured AI financial advisor chat panel.
 * - Conversational message bubbles (user / assistant)
 * - Maintains history across turns (up to last 20 messages sent to backend)
 * - Quick-suggestion chips for common financial queries
 * - Typing indicator during Groq inference
 * - Markdown-lite rendering (bold, bullets, code spans)
 * - Auto-scroll to newest message
 * - Graceful error / offline state handling
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Bot, User, RefreshCw,
  TrendingUp, ShoppingBag, PieChart, AlertCircle,
  Cpu, ChevronDown, Lightbulb,
} from 'lucide-react';
import { chatApi } from '../../services/api';

// ─── Quick suggestion chips ───────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: PieChart,      label: 'Summarize my spending',            query: 'Give me a complete overview of my spending and financial health.' },
  { icon: TrendingUp,    label: "What's my net balance?",          query: 'What is my current net balance and savings rate?' },
  { icon: ShoppingBag,   label: 'Largest expense',                  query: 'What was my single largest expense and which category do I overspend on?' },
  { icon: Lightbulb,     label: 'Save more money',                  query: 'Based on my spending patterns, give me 3 actionable tips to save more money.' },
  { icon: AlertCircle,   label: 'Unusual spending',                  query: 'Are there any unusual or out-of-pattern transactions I should review?' },
  { icon: TrendingUp,    label: 'Monthly comparison',               query: 'How does my spending this month compare to previous months?' },
  { icon: PieChart,      label: 'Category breakdown',               query: 'Break down all my expenses by category with percentages.' },
  { icon: Lightbulb,     label: 'Budget recommendations',           query: 'Based on my income and spending, recommend monthly budgets for each category.' },
];

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text) {
  // Split into lines, process each
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line → spacer
    if (!line.trim()) { elements.push(<div key={i} className="h-1.5" />); i++; continue; }

    // Bullet line
    if (/^[-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineMarkdown(lines[i].replace(/^[-•*]\s/, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="ml-3 space-y-1 list-disc list-inside text-slate-200">{items}</ul>);
      continue;
    }

    // Heading (##)
    if (/^#{1,3}\s/.test(line)) {
      const txt = line.replace(/^#{1,3}\s/, '');
      elements.push(<p key={i} className="font-bold text-white mt-1">{inlineMarkdown(txt)}</p>);
      i++; continue;
    }

    // Normal paragraph
    elements.push(<p key={i} className="text-slate-200 leading-relaxed">{inlineMarkdown(line)}</p>);
    i++;
  }

  return <div className="space-y-1 text-sm">{elements}</div>;
}

function inlineMarkdown(text) {
  // **bold**, *italic*, `code`
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} className="font-bold text-white">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} className="italic text-slate-300">{m[3]}</em>);
    else if (m[4]) parts.push(<code key={m.index} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-emerald-300">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg ring-1 ring-violet-500/30">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-slate-800/80 px-4 py-3 shadow-sm ring-1 ring-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
            />
          ))}
          <span className="ml-1 text-[11px] text-slate-400">Groq is thinking…</span>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2.5">
        <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-gradient-to-br from-emerald-600 to-teal-700 px-4 py-2.5 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20">
          <p className="text-sm leading-relaxed text-white">{msg.content}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
          <User className="h-4 w-4 text-slate-300" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 ring-1 ring-rose-500/30">
          <AlertCircle className="h-4 w-4 text-rose-400" />
        </div>
        <div className="max-w-[82%] rounded-2xl rounded-bl-sm border border-rose-500/20 bg-rose-500/10 px-4 py-2.5">
          <p className="text-xs text-rose-300">{msg.content}</p>
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 shadow-md ring-1 ring-violet-500/30">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-slate-800/80 px-4 py-3 shadow-sm ring-1 ring-slate-700/60 backdrop-blur-sm">
        {renderMarkdown(msg.content)}
        {msg.model && (
          <p className="mt-2 text-[10px] text-slate-600">
            via {msg.model}
            {msg.tokens && ` · ${msg.tokens} tokens`}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-6 px-4 text-center">
      {/* Animated icon */}
      <div className="relative mb-5">
        <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/10" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-500/30">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-white">AI Financial Advisor</h3>
      <p className="mt-1.5 max-w-xs text-xs text-slate-400 leading-relaxed">
        Ask me anything about your finances. I have real-time access to your full transaction history.
      </p>

      {/* Suggestion chips grid */}
      <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-2">
        {SUGGESTIONS.slice(0, 6).map(({ icon: Icon, label, query }) => (
          <button
            key={label}
            onClick={() => onSuggestion(query)}
            className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left text-xs text-slate-300 transition-all hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-300 active:scale-[0.97]"
          >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────

export default function AiAdvisorChat() {
  const [messages, setMessages] = useState([]);       // {role, content, model?, tokens?}
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  // Show "scroll to bottom" button when far up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // Build conversation history for backend context
  const getHistory = () =>
    messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmed, id: Date.now() }]);
    setIsTyping(true);

    try {
      const history = getHistory();
      const res = await chatApi.sendMessage(trimmed, history);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          model: res.model,
          tokens: res.tokens_used,
          id: Date.now() + 1,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'error',
          content: err.message?.includes('502')
            ? 'Groq API is unavailable. Check your GROQ_API_KEY in backend/.env.'
            : `Error: ${err.message || 'Could not reach the backend.'}`,
          id: Date.now() + 1,
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isTyping, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setInput(''); };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-md ring-1 ring-violet-500/30">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Financial Advisor</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400">Groq Llama · Live data context</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isEmpty && (
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1">
            <Cpu className="h-3 w-3 text-violet-400" />
            <span className="text-[10px] font-semibold text-violet-300">llama-3.3-70b</span>
          </div>
        </div>
      </div>

      {/* ── Message list ────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-5 py-4 space-y-4"
      >
        {isEmpty ? (
          <WelcomeScreen onSuggestion={(q) => sendMessage(q)} />
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom floating button */}
      {showScroll && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-20 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 shadow-xl hover:text-white transition-all"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* ── Quick suggestions (after first message) ─────── */}
      {!isEmpty && !isTyping && (
        <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-none border-t border-slate-800/60">
          {SUGGESTIONS.slice(0, 4).map(({ label, query }) => (
            <button
              key={label}
              onClick={() => sendMessage(query)}
              className="shrink-0 rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────── */}
      <div className="border-t border-slate-800 px-4 py-3.5">
        <div className="flex items-end gap-2.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
          <textarea
            ref={inputRef}
            id="chat-input"
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-grow (1–4 rows)
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your finances…"
            disabled={isTyping}
            className="flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-50"
            style={{ lineHeight: '1.5', minHeight: '24px', maxHeight: '96px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-600">
          Press <kbd className="rounded bg-slate-800 px-1 py-px text-slate-400">Enter</kbd> to send · <kbd className="rounded bg-slate-800 px-1 py-px text-slate-400">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
