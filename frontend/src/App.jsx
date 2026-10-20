import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import AiInsights from './pages/AiInsights';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AddExpenseModal from './components/expenses/AddExpenseModal';
import ReceiptScannerModal from './components/ai/ReceiptScannerModal';
import { expenseService } from './services/expenseService';
import { apiRequest } from './services/api';

// Initial fallback mock data if backend server is not running yet
const INITIAL_DEMO_EXPENSES = [
  {
    id: "exp_01",
    title: "Grocery Run at Whole Foods",
    amount: 78.45,
    category: "Food & Dining",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: "Weekly groceries and organic produce",
    payment_method: "Credit Card",
    is_recurring: false,
  },
  {
    id: "exp_02",
    title: "Monthly Cloud Server",
    amount: 24.00,
    category: "Housing & Utilities",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: "VPS subscription",
    payment_method: "Debit Card",
    is_recurring: true,
  },
  {
    id: "exp_03",
    title: "Uber to Airport",
    amount: 34.20,
    category: "Transportation",
    date: new Date(Date.now() - 8 * 86400000).toISOString(),
    notes: "Terminal 2 ride",
    payment_method: "Credit Card",
    is_recurring: false,
  },
  {
    id: "exp_04",
    title: "Netflix Premium",
    amount: 19.99,
    category: "Entertainment",
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: "Family streaming subscription",
    payment_method: "Credit Card",
    is_recurring: true,
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState(INITIAL_DEMO_EXPENSES);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Check backend health & fetch expenses on load
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Ping backend health
        await apiRequest('/health');
        setIsBackendOnline(true);
        
        // Fetch real data from FastAPI
        const data = await expenseService.getExpenses();
        if (data && data.length > 0) {
          setExpenses(data);
        }
      } catch (err) {
        console.warn("FastAPI backend is offline or unreachable. Using simulated client state.", err.message);
        setIsBackendOnline(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle adding expense
  const handleAddExpense = async (newExpenseData) => {
    try {
      if (isBackendOnline) {
        const saved = await expenseService.createExpense(newExpenseData);
        setExpenses(prev => [saved, ...prev]);
      } else {
        // Optimistic local add
        const mockExpense = {
          id: `exp_${Date.now()}`,
          ...newExpenseData,
        };
        setExpenses(prev => [mockExpense, ...prev]);
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
      // Fallback local add
      const mockExpense = {
        id: `exp_${Date.now()}`,
        ...newExpenseData,
      };
      setExpenses(prev => [mockExpense, ...prev]);
    }
  };

  // Handle deleting expense
  const handleDeleteExpense = async (id) => {
    try {
      if (isBackendOnline) {
        await expenseService.deleteExpense(id);
      }
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          isBackendOnline={isBackendOnline}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              isLoading={isLoading}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {activeTab === 'expenses' && (
            <Expenses
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              isLoading={isLoading}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {activeTab === 'ai-insights' && (
            <AiInsights />
          )}

          {activeTab === 'analytics' && (
            <Analytics expenses={expenses} />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddExpense={handleAddExpense}
      />

      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
}
