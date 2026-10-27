import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Bot, User, RefreshCw,
  TrendingUp, ShoppingBag, PieChart, AlertCircle,
  Cpu, ChevronDown, Lightbulb,
} from 'lucide-react';
import { chatApi } from '../../services/api';

const SUGGESTIONS = [
  { icon: PieChart,    label: 'Summarize my spending',     query: 'Give me a complete overview of my spending and financial health.' },
  { icon: TrendingUp,  label: "What's my net balance?",   query: 'What is my current net balance and savings rate?' },
  { icon: ShoppingBag, label: 'Largest expense',           query: 'What was my single largest expense and which category do I overspend on?' },
  { icon: Lightbulb,   label: 'Savings recommendations',   query: 'Based on my spending patterns, give me 3 actionable tips to save more money.' },
  { icon: AlertCircle, label: 'Unusual patterns',          query: 'Are there any unusual or out-of-pattern transactions I should review?' },
  { icon: PieChart,    label: 'Category breakdown',        query: 'Break down all my expenses by category with percentages.' },
];

function inlineMarkdown(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} className="font-semibold text-slate-100">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} className="italic text-slate-300">{m[3]}</em>);
    else if (m[4]) parts.push(<code key={m.index} className="rounded bg-[#090d16] border border-[#1e293b] px-1 py-0.5 font-mono text-[11px] text-blue-300">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    if (/^[-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineMarkdown(lines[i].replace(/^[-•*]\s/, ''))}</li>);
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="ml-4 space-y-1 list-disc list-outside text-slate-200">
          {items}
        </ul>
      );
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const txt = line.replace(/^#{1,3}\s/, '');
      elements.push(
        <p key={i} className="font-semibold text-slate-100 mt-2">
          {inlineMarkdown(txt)}
        </p>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="text-slate-200 leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1 text-xs">{elements}</div>;
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-[#141c2e] border border-[#1e293b] flex items-center justify-center text-blue-400 shrink-0">
        <Bot size={14} />
      </div>
      <div className="bg-[#141c2e] border border-[#1e293b] rounded-lg px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-100" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-200" />
          <span className="ml-1 text-[11px] text-slate-400">Analyzing transaction context...</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5">
        <div className="max-w-[80%] rounded-lg bg-blue-600 px-4 py-2 text-white">
          <p className="text-xs leading-relaxed">{msg.content}</p>
        </div>
        <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
          <User size={14} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
          <AlertCircle size={14} />
        </div>
        <div className="max-w-[85%] rounded-lg border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-[#141c2e] border border-[#1e293b] flex items-center justify-center text-blue-400 shrink-0">
        <Bot size={14} />
      </div>
      <div className="max-w-[85%] rounded-lg bg-[#141c2e] border border-[#1e293b] px-4 py-3 text-xs">
        {renderMarkdown(msg.content)}
        {msg.model && (
          <p className="mt-2 text-[10px] text-slate-500 pt-2 border-t border-[#1e293b]/60">
            {msg.model} {msg.tokens ? `· ${msg.tokens} tokens` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
        <Sparkles size={20} />
      </div>
      <h2 className="text-sm font-semibold text-slate-100">AI Financial Advisor</h2>
      <p className="mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">
        Ask financial queries, spending breakdowns, or budget tips. All responses are derived directly from your local ledger.
      </p>

      <div className="mt-6 w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {SUGGESTIONS.map(({ icon: Icon, label, query }) => (
          <button
            key={label}
            onClick={() => onSuggestion(query)}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-[#1e293b] bg-[#0e1422] hover:bg-[#141c2e] hover:border-slate-700 text-xs text-slate-300 transition-colors"
          >
            <Icon size={14} className="text-blue-400 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AiAdvisorChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const getHistory = () =>
    messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || isTyping) return;

      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: trimmed, id: Date.now() }]);
      setIsTyping(true);

      try {
        const history = getHistory();
        const res = await chatApi.sendMessage(trimmed, history);
        setMessages((prev) => [
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
        setMessages((prev) => [
          ...prev,
          {
            role: 'error',
            content: err.message?.includes('502')
              ? 'Groq API is currently unavailable. Verify GROQ_API_KEY in backend/.env.'
              : `Error: ${err.message || 'Unable to connect to backend server.'}`,
            id: Date.now() + 1,
          },
        ]);
      } finally {
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, isTyping, messages]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="ui-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e293b]/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Bot size={15} />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-100">Advisor Assistant</h2>
            <p className="text-[11px] text-slate-500">Groq Llama 3.3 · Context Synchronized</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEmpty && (
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-[#090d16] border border-[#1e293b] px-2 py-0.5 rounded">
            llama-3.3-70b
          </span>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isEmpty ? (
          <WelcomeScreen onSuggestion={(q) => sendMessage(q)} />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {!isEmpty && !isTyping && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-[#1e293b]/50">
          {SUGGESTIONS.slice(0, 3).map(({ label, query }) => (
            <button
              key={label}
              onClick={() => sendMessage(query)}
              className="shrink-0 px-2.5 py-1 rounded-md text-[11px] bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#1e293b]/70 bg-[#090d16]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your ledger..."
            disabled={isTyping}
            className="ui-input resize-none py-2 text-xs min-h-[36px] max-h-24"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="ui-btn-primary h-9 w-9 p-0 shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
