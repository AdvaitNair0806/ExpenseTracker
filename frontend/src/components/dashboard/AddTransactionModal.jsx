/**
 * AddTransactionModal.jsx
 *
 * Three-tab modal for adding transactions:
 *  1. AI Quick Add  – type a casual note → Groq parses → editable preview → save
 *  2. Scan Receipt  – drag/drop or pick an image → Groq vision → editable preview → save
 *  3. Manual Entry  – classic form, always available as fallback
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Sparkles, Camera, Plus,
  Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, SendHorizonal, Upload, ImageIcon,
  Pencil, Cpu, Wand2,
} from 'lucide-react';
import { transactionApi } from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transportation', 'Housing & Utilities',
  'Entertainment', 'Healthcare', 'Shopping', 'Travel', 'Education',
  'Personal Care', 'Salary', 'Freelance', 'Investment', 'Miscellaneous',
];

const TABS = [
  { id: 'ai-text',    label: 'AI Quick Add',   icon: Wand2,   accent: 'violet' },
  { id: 'ai-receipt', label: 'Scan Receipt',   icon: Camera,  accent: 'cyan'   },
  { id: 'manual',     label: 'Manual Entry',   icon: Plus,    accent: 'emerald' },
];

const ACCENT = {
  violet:  { ring: 'ring-violet-500/30',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/30',  btn: 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/25',  tab: 'border-violet-500 text-violet-400'  },
  cyan:    { ring: 'ring-cyan-500/30',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    btn: 'bg-cyan-600   hover:bg-cyan-500   shadow-cyan-500/25',    tab: 'border-cyan-500   text-cyan-400'    },
  emerald: { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25', tab: 'border-emerald-500 text-emerald-400' },
};

// ─── Shared Primitives ────────────────────────────────────────────────────────

const inputCls = `
  w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5
  text-sm text-slate-100 placeholder-slate-600
  focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30
  transition-all duration-200
`;

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {required && <span className="text-rose-400 text-[10px]">*</span>}
      </span>
      {children}
      {hint && <p className="mt-1 text-[10px] text-slate-600">{hint}</p>}
    </label>
  );
}

function TypeToggle({ value, onChange }) {
  return (
    <div className="flex gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
      {['expense', 'income'].map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all ${
            value === t
              ? t === 'expense'
                ? 'bg-rose-600    text-white shadow ring-1 ring-rose-500/30'
                : 'bg-emerald-600 text-white shadow ring-1 ring-emerald-500/30'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          {t === 'expense' ? '↓ Expense' : '↑ Income'}
        </button>
      ))}
    </div>
  );
}

// ─── Editable Preview Form (shared between AI tabs) ──────────────────────────

function PreviewForm({ fields, onChange, accent = 'emerald', source = 'AI' }) {
  const a = ACCENT[accent];
  return (
    <div className={`rounded-xl border ${a.border} ${a.bg} p-4 space-y-3`}>
      {/* Badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${a.bg} ${a.text}`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${a.text}`}>
          {source} extracted — review &amp; correct
        </span>
        <span className={`ml-auto flex items-center gap-1 text-[10px] ${a.text} opacity-70`}>
          <Pencil className="h-2.5 w-2.5" /> editable
        </span>
      </div>

      <TypeToggle value={fields.type} onChange={v => onChange('type', v)} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ($)" required>
          <input
            type="number" step="0.01" min="0.01" required
            value={fields.amount}
            onChange={e => onChange('amount', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={fields.date}
            onChange={e => onChange('date', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Vendor / Merchant" required>
        <input
          type="text" required
          value={fields.vendor}
          onChange={e => onChange('vendor', e.target.value)}
          placeholder="e.g. McDonald's, Uber"
          className={inputCls}
        />
      </Field>

      <Field label="Category">
        <select
          value={fields.category}
          onChange={e => onChange('category', e.target.value)}
          className={inputCls}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Notes">
        <input
          type="text"
          value={fields.notes}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Optional description"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────

function AiLoadingOverlay({ label }) {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 animate-ping rounded-full bg-violet-500/10" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-500/30">
          <Cpu className="h-7 w-7 text-white animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{label}{'.'?.repeat(dot + 1) ?? ''}</p>
        <p className="mt-1 text-xs text-slate-400">Groq Llama is processing your request</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── TAB 1: AI Quick Add (Text) ───────────────────────────────────────────────

function AiTextTab({ onSave, onClose }) {
  const [phase, setPhase] = useState('input');   // 'input' | 'loading' | 'preview' | 'saving'
  const [note, setNote]   = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    amount: '', category: 'Food & Dining', vendor: '', date: new Date().toISOString().slice(0, 10),
    notes: '', type: 'expense',
  });

  const EXAMPLES = [
    'Spent 200 on metro ticket this morning',
    'Paid 1200 for Netflix and Spotify together',
    'Got salary of 45000 from Acme Corp today',
    'Bought groceries at D-Mart for 850 rupees',
  ];

  const updateField = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

  const handleParse = async () => {
    if (!note.trim()) { setError('Please describe the transaction.'); return; }
    setError('');
    setPhase('loading');
    try {
      const parsed = await transactionApi.addFromText(note.trim());
      // Backend saves & returns the full record — pre-fill but also let user edit
      setFields({
        amount:   String(parsed.amount ?? ''),
        category: parsed.category  ?? 'Food & Dining',
        vendor:   parsed.vendor    ?? '',
        date:     parsed.date      ?? new Date().toISOString().slice(0, 10),
        notes:    parsed.notes     ?? note,
        type:     parsed.type      ?? 'expense',
        _id:      parsed.id,          // carry saved id
      });
      setPhase('preview');
    } catch (err) {
      setError(err.message || 'AI parsing failed. Check your GROQ_API_KEY or try manual entry.');
      setPhase('input');
    }
  };

  const handleSave = async () => {
    // The backend already saved on parse; just close and refresh
    setPhase('saving');
    await new Promise(r => setTimeout(r, 400)); // brief UX beat
    onSave();
    onClose();
  };

  if (phase === 'loading') return <AiLoadingOverlay label="Parsing transaction" />;

  return (
    <div className="space-y-4">
      {phase === 'input' && (
        <>
          {/* Prompt textarea */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Describe your transaction
            </label>
            <div className="relative">
              <textarea
                id="ai-text-input"
                rows={3}
                value={note}
                onChange={e => { setNote(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse(); }}
                placeholder={`e.g. "${EXAMPLES[0]}"`}
                autoFocus
                className={`${inputCls} resize-none pr-12 text-sm leading-relaxed`}
              />
              {note.trim() && (
                <button
                  type="button"
                  onClick={handleParse}
                  title="Parse with AI (Ctrl+Enter)"
                  className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-colors"
                >
                  <SendHorizonal className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Press <kbd className="rounded bg-slate-800 px-1 py-px text-slate-300">Ctrl</kbd>+<kbd className="rounded bg-slate-800 px-1 py-px text-slate-300">↵</kbd> or click ↗ to parse
            </p>
          </div>

          {/* Example chips */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setNote(ex)}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[10px] text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              <span className="font-semibold text-violet-300">Groq Llama 3.3</span> extracts amount, vendor,
              category, date and type. You'll review everything before saving.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            type="button"
            onClick={handleParse}
            disabled={!note.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <Wand2 className="h-4 w-4" />
            Parse with AI
          </button>
        </>
      )}

      {phase === 'preview' && (
        <>
          <PreviewForm fields={fields} onChange={updateField} accent="violet" source="Groq AI" />

          {error && <ErrorBanner message={error} />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setPhase('input'); setError(''); }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Re-parse
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={phase === 'saving'}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 active:scale-[0.98] transition-all"
            >
              {phase === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm &amp; Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB 2: Scan Receipt ──────────────────────────────────────────────────────

function ReceiptTab({ onSave, onClose }) {
  const [phase, setPhase]     = useState('upload');  // 'upload' | 'loading' | 'preview'
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);      // object URL
  const [dragging, setDragging] = useState(false);
  const [error, setError]     = useState('');
  const [fields, setFields]   = useState({
    amount: '', category: 'Food & Dining', vendor: '', date: new Date().toISOString().slice(0, 10),
    notes: '', type: 'expense',
  });
  const inputRef = useRef(null);

  const updateField = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

  const acceptFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('Please upload a JPG, PNG or WebP image.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }, []);

  // Drag-and-drop
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // Paste from clipboard (Ctrl+V)
  useEffect(() => {
    const handler = (e) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      if (item) acceptFile(item.getAsFile());
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [acceptFile]);

  // Cleanup object URL
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleScan = async () => {
    setError('');
    setPhase('loading');
    try {
      const parsed = await transactionApi.addFromReceipt(file);
      setFields({
        amount:   String(parsed.amount ?? ''),
        category: parsed.category  ?? 'Food & Dining',
        vendor:   parsed.vendor    ?? '',
        date:     parsed.date      ?? new Date().toISOString().slice(0, 10),
        notes:    parsed.notes     ?? '',
        type:     parsed.type      ?? 'expense',
        _id:      parsed.id,
      });
      setPhase('preview');
    } catch (err) {
      setError(err.message || 'Vision parsing failed. Check GROQ_API_KEY or try manual entry.');
      setPhase('upload');
    }
  };

  const handleSave = async () => {
    onSave();
    onClose();
  };

  if (phase === 'loading') return <AiLoadingOverlay label="Reading receipt" />;

  return (
    <div className="space-y-4">
      {phase === 'upload' && (
        <>
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`
              relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl
              border-2 border-dashed p-8 text-center transition-all duration-200
              ${dragging
                ? 'border-cyan-400/70 bg-cyan-500/10 scale-[1.01]'
                : file
                  ? 'border-cyan-500/40 bg-cyan-500/5'
                  : 'border-slate-700 bg-slate-950/40 hover:border-cyan-500/40 hover:bg-cyan-500/5'
              }
            `}
          >
            {/* Image preview thumbnail */}
            {preview ? (
              <>
                <div className="relative">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="mx-auto max-h-40 rounded-xl object-contain shadow-xl shadow-black/40 ring-1 ring-slate-700"
                  />
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 shadow-lg ring-2 ring-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-cyan-300">{file.name}</p>
                <p className="text-[10px] text-slate-500">Click to replace · or drag another</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-slate-700">
                  <Upload className="h-7 w-7 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Drop your receipt here</p>
                  <p className="mt-0.5 text-xs text-slate-500">or click to browse · JPG, PNG, WebP</p>
                </div>
                <div className="flex gap-3 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Screenshot OK</span>
                  <span>·</span>
                  <span>Ctrl+V to paste</span>
                </div>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => acceptFile(e.target.files[0])}
          />

          {/* Info banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5">
            <Camera className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              <span className="font-semibold text-cyan-300">Groq Llama 3.2 Vision</span> reads the receipt and
              extracts total amount, merchant, date and category automatically.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            type="button"
            onClick={handleScan}
            disabled={!file}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
            Scan with AI Vision
          </button>
        </>
      )}

      {phase === 'preview' && (
        <>
          {/* Thumbnail strip */}
          {preview && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
              <img src={preview} alt="Receipt" className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{file?.name}</p>
                <p className="text-[10px] text-slate-500">Receipt scanned successfully</p>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
            </div>
          )}

          <PreviewForm fields={fields} onChange={updateField} accent="cyan" source="Vision AI" />

          {error && <ErrorBanner message={error} />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setPhase('upload'); setError(''); }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Re-scan
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm &amp; Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB 3: Manual Entry ──────────────────────────────────────────────────────

function ManualTab({ onSave, onClose }) {
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [vendor,   setVendor]   = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [notes,    setNotes]    = useState('');
  const [type,     setType]     = useState('expense');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !vendor) { setError('Amount and vendor are required.'); return; }
    setError('');
    setBusy(true);
    try {
      await transactionApi.addManual({
        amount: parseFloat(amount), category, vendor, date, notes, type,
      });
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TypeToggle value={type} onChange={setType} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ($)" required>
          <input
            type="number" step="0.01" min="0.01" placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value)} required
            className={inputCls}
          />
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Vendor / Merchant" required>
        <input
          type="text" placeholder="e.g. Amazon, Starbucks" required
          value={vendor} onChange={e => setVendor(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Category">
        <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Notes" hint="Optional – helps the AI categorize better next time">
        <input
          type="text" placeholder="Brief description"
          value={notes} onChange={e => setNotes(e.target.value)}
          className={inputCls}
        />
      </Field>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit" disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {busy ? 'Saving…' : 'Save Transaction'}
      </button>
    </form>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <p className="text-xs text-rose-300">{message}</p>
    </div>
  );
}

// ─── Root Modal ───────────────────────────────────────────────────────────────

export default function AddTransactionModal({ isOpen, onClose, onAdded }) {
  const [activeTab, setActiveTab] = useState('ai-text');

  if (!isOpen) return null;

  const handleAdded = () => {
    if (onAdded) onAdded();
  };

  const handleClose = () => {
    setActiveTab('ai-text');
    onClose();
  };

  const currentAccent = TABS.find(t => t.id === activeTab)?.accent ?? 'emerald';
  const a = ACCENT[currentAccent];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">

        {/* Subtle top gradient bar matching active tab */}
        <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${
          currentAccent === 'violet'  ? 'from-violet-600 to-indigo-600' :
          currentAccent === 'cyan'    ? 'from-cyan-500   to-blue-500'   :
                                        'from-emerald-500 to-teal-500'
        }`} />

        {/* ── Header ─── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-white">Add Transaction</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {activeTab === 'ai-text'    ? 'Describe it in plain English — AI does the rest'  :
               activeTab === 'ai-receipt' ? 'Upload any receipt or payment screenshot'           :
                                            'Enter details manually'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tab bar ─── */}
        <div className="flex gap-0 border-b border-slate-800 px-6">
          {TABS.map(({ id, label, icon: Icon, accent }) => {
            const ta = ACCENT[accent];
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-1.5 border-b-2 py-3 pr-4 text-xs font-semibold
                  transition-all duration-200
                  ${isActive
                    ? `${ta.tab} ${ta.text}`
                    : 'border-transparent text-slate-500 hover:text-slate-300'}
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ─── */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'ai-text'    && <AiTextTab    onSave={handleAdded} onClose={handleClose} />}
          {activeTab === 'ai-receipt' && <ReceiptTab   onSave={handleAdded} onClose={handleClose} />}
          {activeTab === 'manual'     && <ManualTab    onSave={handleAdded} onClose={handleClose} />}
        </div>

        {/* ── Footer ─── */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Cpu className="h-3 w-3" /> Powered by Groq Cloud
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-200 transition-colors"
          >
            Discard &amp; close
          </button>
        </div>
      </div>
    </div>
  );
}
