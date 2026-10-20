import { apiRequest } from './api';

export const aiService = {
  // Suggest a category using Groq AI
  suggestCategory: async (description) => {
    return apiRequest('/api/v1/ai/suggest-category', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  },

  // Parse receipt text or simulated OCR payload
  scanReceipt: async (rawText) => {
    return apiRequest('/api/v1/ai/scan-receipt', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText }),
    });
  },
};

export default aiService;
