const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const headers = isFormData
    ? { ...options.headers }
    : { 'Content-Type': 'application/json', ...options.headers };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// ── Transactions ──────────────────────────────────────────────────────────────

export const transactionApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/transactions${qs ? `?${qs}` : ''}`);
  },

  addManual: (payload) =>
    apiRequest('/api/transactions/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addFromText: (note) =>
    apiRequest('/api/transactions/ai-text', {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  addFromReceipt: (file) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest('/api/transactions/ai-receipt', { method: 'POST', body: form });
  },

  delete: (id) =>
    apiRequest(`/api/v1/transactions/${id}`, { method: 'DELETE' }),

  getSummary: () => apiRequest('/api/summary'),
};

// ── Chat ──────────────────────────────────────────────────────────────────────

export const chatApi = {
  /**
   * Send a message to the AI financial advisor.
   * @param {string} message  - Current user message
   * @param {Array}  history  - [{role:'user'|'assistant', content:string}, ...]
   * @returns {Promise<{reply:string, model:string, tokens_used:number}>}
   */
  sendMessage: (message, history = []) =>
    apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};

export default apiRequest;
