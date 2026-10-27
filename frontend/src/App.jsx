import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import AiInsights from './pages/AiInsights';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ChatDrawer from './components/ai/ChatDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 font-sans selection:bg-blue-600/30 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard'   && <Dashboard />}
          {activeTab === 'expenses'    && <Expenses />}
          {activeTab === 'ai-insights' && <AiInsights />}
          {activeTab === 'analytics'   && <Analytics />}
          {activeTab === 'settings'    && <Settings />}
        </main>
      </div>

      {activeTab !== 'ai-insights' && <ChatDrawer />}
    </div>
  );
}
