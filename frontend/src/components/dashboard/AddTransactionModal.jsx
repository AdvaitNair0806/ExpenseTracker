import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Sparkles, Camera, Plus,
  Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, SendHorizonal, Upload, ImageIcon,
  Pencil, Cpu, Wand2
} from 'lucide-react';
import { transactionApi } from '../../services/api';

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transportation', 'Housing & Utilities',
  'Entertainment', 'Healthcare', 'Shopping', 'Travel', 'Education',
  'Salary', 'Freelance', 'Miscellaneous'
];

const TABS = [
  { id: 'ai-text',    label: 'AI Quick Add', icon: Wand2 },
  { id: 'ai-receipt', label: 'Scan Receipt', icon: Camera },
  { id: 'manual',     label: 'Manual Entry', icon: Plus },
];

function Field({ label, required, hint, children }) {
  return (
    <label className="block mb-3 last:mb-0">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">
          {label} {required && <span className="text-rose-400">*</span>}
        </span>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function TypeToggle({ value, onChange }) {
  return (
    <div className="flex bg-[#060911] border border-[#1e293b] rounded-lg p-0.5 mb-3">
      {['expense', 'income'].map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === t
              ? t === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t === 'expense' ? 'Expense' : 'Income'}
        </button>
      ))}
    </div>
  );
}

function PreviewForm({ fields, onChange, source = 'AI' }) {
  return (
    <div className="p-4 rounded-lg bg-[#060911] border border-[#1e293b] space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
          <CheckCircle2 size={14} />
          <span>{source} Extracted — Review & Edit</span>
        </div>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Pencil size={11} /> editable
        </span>
      </div>

      <TypeToggle value={fields.type} onChange={(v) => onChange('type', v)} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={fields.amount}
            onChange={(e) => onChange('amount', e.target.value)}
            className="ui-input text-xs"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={fields.date}
            onChange={(e) => onChange('date', e.target.value)}
            className="ui-input text-xs"
          />
        </Field>
      </div>

      <Field label="Vendor / Merchant" required>
        <input
          type="text"
          required
          value={fields.vendor}
          onChange={(e) => onChange('vendor', e.target.value)}
          placeholder="e.g. Swiggy, Uber, D-Mart"
          className="ui-input text-xs"
        />
      </Field>

      <Field label="Category">
        <select
          value={fields.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="ui-input text-xs cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#0e1422] text-slate-200">
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes">
        <input
          type="text"
          value={fields.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Optional remarks"
          className="ui-input text-xs"
        />
      </Field>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300">
      <AlertCircle size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function AiLoadingOverlay({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <Loader2 size={24} className="animate-spin text-blue-500" />
      <div>
        <p className="text-sm font-semibold text-slate-200">{label}...</p>
        <p className="text-xs text-slate-500 mt-1">Groq Llama inference running</p>
      </div>
    </div>
  );
}

// ─── TAB 1: AI Quick Add ──────────────────────────────────────────────
function AiTextTab({ onSave, onClose }) {
  const [phase, setPhase] = useState('input');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    amount: '',
    category: 'Food & Dining',
    vendor: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    type: 'expense',
  });

  const EXAMPLES = [
    'Spent 250 on lunch at Cafe Coffee Day',
    'Paid 1499 for broadband bill',
    'Received salary of 65000 from company',
    'Bought groceries at BigBasket for 850 rupees',
  ];

  const updateField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }));

  const handleParse = async () => {
    if (!note.trim()) {
      setError('Please provide a short transaction description.');
      return;
    }
    setError('');
    setPhase('loading');
    try {
      const parsed = await transactionApi.addFromText(note.trim());
      setFields({
        amount: String(parsed.amount ?? ''),
        category: parsed.category ?? 'Food & Dining',
        vendor: parsed.vendor ?? '',
        date: parsed.date ?? new Date().toISOString().slice(0, 10),
        notes: parsed.notes ?? note,
        type: parsed.type ?? 'expense',
        _id: parsed.id,
      });
      setPhase('preview');
    } catch (err) {
      setError(err.message || 'AI parsing failed. Please check GROQ_API_KEY in backend/.env.');
      setPhase('input');
    }
  };

  const handleSave = async () => {
    setPhase('saving');
    await new Promise((r) => setTimeout(r, 200));
    onSave();
    onClose();
  };

  if (phase === 'loading') return <AiLoadingOverlay label="Parsing transaction" />;

  return (
    <div className="space-y-4">
      {phase === 'input' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Natural Language Prompt
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse();
              }}
              placeholder="e.g. Paid 450 for cinema ticket via UPI yesterday"
              className="ui-input resize-none text-xs"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Press <kbd className="px-1 rounded bg-[#1e293b] text-slate-300">Ctrl</kbd>+<kbd className="px-1 rounded bg-[#1e293b] text-slate-300">Enter</kbd> to parse
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-slate-500 mb-2">Prompt examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setNote(ex)}
                  className="px-2.5 py-1 rounded-md text-[11px] bg-[#060911] border border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            type="button"
            onClick={handleParse}
            disabled={!note.trim()}
            className="ui-btn-primary w-full h-9"
          >
            <Wand2 size={14} />
            <span>Parse with AI</span>
          </button>
        </>
      )}

      {phase === 'preview' && (
        <>
          <PreviewForm fields={fields} onChange={updateField} source="Groq AI" />
          {error && <ErrorBanner message={error} />}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPhase('input');
                setError('');
              }}
              className="ui-btn-secondary flex-1 h-9"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={phase === 'saving'}
              className="ui-btn-primary flex-1 h-9"
            >
              <CheckCircle2 size={14} />
              <span>Confirm & Save</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB 2: Scan Receipt ──────────────────────────────────────────────
function ReceiptTab({ onSave, onClose }) {
  const [phase, setPhase] = useState('upload');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    amount: '',
    category: 'Food & Dining',
    vendor: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    type: 'expense',
  });
  const inputRef = useRef(null);

  const updateField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }));

  const acceptFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('Please upload a valid image (JPG, PNG, or WebP).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  useEffect(() => {
    const handler = (e) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
      if (item) acceptFile(item.getAsFile());
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [acceptFile]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleScan = async () => {
    setError('');
    setPhase('loading');
    try {
      const parsed = await transactionApi.addFromReceipt(file);
      setFields({
        amount: String(parsed.amount ?? ''),
        category: parsed.category ?? 'Food & Dining',
        vendor: parsed.vendor ?? '',
        date: parsed.date ?? new Date().toISOString().slice(0, 10),
        notes: parsed.notes ?? '',
        type: parsed.type ?? 'expense',
        _id: parsed.id,
      });
      setPhase('preview');
    } catch (err) {
      setError(err.message || 'Vision scan failed. Please verify GROQ_API_KEY in backend/.env.');
      setPhase('upload');
    }
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  if (phase === 'loading') return <AiLoadingOverlay label="Analyzing receipt document" />;

  return (
    <div className="space-y-4">
      {phase === 'upload' && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            className={`p-6 rounded-lg border-2 border-dashed cursor-pointer text-center transition-all ${
              dragging
                ? 'border-blue-500 bg-blue-500/10'
                : preview
                ? 'border-[#1e293b] bg-[#060911]'
                : 'border-[#1e293b] bg-[#060911] hover:border-slate-700'
            }`}
          >
            {preview ? (
              <div className="space-y-2">
                <img
                  src={preview}
                  alt="Receipt Preview"
                  className="max-h-36 mx-auto rounded border border-[#1e293b] object-contain"
                />
                <p className="text-xs text-slate-300 font-medium">{file.name}</p>
                <p className="text-[11px] text-slate-500">Click or drop another file to replace</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <Upload size={24} className="mx-auto text-slate-500" />
                <div>
                  <p className="text-xs font-medium text-slate-200">
                    Drop receipt or bill screenshot here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WebP · Ctrl+V supported</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => acceptFile(e.target.files[0])}
          />

          {error && <ErrorBanner message={error} />}

          <button
            type="button"
            onClick={handleScan}
            disabled={!file}
            className="ui-btn-primary w-full h-9"
          >
            <Camera size={14} />
            <span>Scan with Vision AI</span>
          </button>
        </>
      )}

      {phase === 'preview' && (
        <>
          <PreviewForm fields={fields} onChange={updateField} source="Vision OCR" />
          {error && <ErrorBanner message={error} />}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPhase('upload');
                setError('');
              }}
              className="ui-btn-secondary flex-1 h-9"
            >
              <ArrowLeft size={14} />
              <span>Rescan</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="ui-btn-primary flex-1 h-9"
            >
              <CheckCircle2 size={14} />
              <span>Confirm & Save</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB 3: Manual Entry ──────────────────────────────────────────────
function ManualTab({ onSave, onClose }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please provide a valid numeric amount greater than zero.');
      return;
    }
    if (!vendor.trim()) {
      setError('Vendor name is required.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      await transactionApi.createTransaction({
        type,
        amount: parseFloat(amount),
        vendor: vendor.trim(),
        category,
        date: date || new Date().toISOString().slice(0, 10),
        notes: notes.trim(),
      });
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TypeToggle value={type} onChange={setType} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="ui-input text-xs"
          />
        </Field>
        <Field label="Date" required>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ui-input text-xs"
          />
        </Field>
      </div>

      <Field label="Vendor / Payee" required>
        <input
          type="text"
          required
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="e.g. Swiggy, Uber, Amazon"
          className="ui-input text-xs"
        />
      </Field>

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="ui-input text-xs cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#0e1422] text-slate-200">
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional remarks"
          className="ui-input text-xs"
        />
      </Field>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit"
        disabled={busy}
        className="ui-btn-primary w-full h-9 mt-4"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        <span>{busy ? 'Saving...' : 'Save Transaction'}</span>
      </button>
    </form>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────
export default function AddTransactionModal({ isOpen, onClose, onAdded }) {
  const [activeTab, setActiveTab] = useState('ai-text');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl border border-[#1e293b] bg-[#0e1422] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Add Transaction</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeTab === 'ai-text' && 'Natural language prompt parsing'}
              {activeTab === 'ai-receipt' && 'Document optical character recognition'}
              {activeTab === 'manual' && 'Standard manual entry'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1e293b] px-5 bg-[#090d16]">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'ai-text' && (
            <AiTextTab onSave={onAdded} onClose={onClose} />
          )}
          {activeTab === 'ai-receipt' && (
            <ReceiptTab onSave={onAdded} onClose={onClose} />
          )}
          {activeTab === 'manual' && (
            <ManualTab onSave={onAdded} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
