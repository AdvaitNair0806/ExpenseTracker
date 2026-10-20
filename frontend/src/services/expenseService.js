import { apiRequest } from './api';

export const expenseService = {
  // Fetch all expenses
  getExpenses: async () => {
    return apiRequest('/api/v1/expenses/');
  },

  // Create a new expense
  createExpense: async (expenseData) => {
    return apiRequest('/api/v1/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  // Delete an expense by ID
  deleteExpense: async (id) => {
    return apiRequest(`/api/v1/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};

export default expenseService;
