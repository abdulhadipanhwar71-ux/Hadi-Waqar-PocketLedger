import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { AppLockScreen } from './components/common/AppLockScreen';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { AccountsView } from './components/accounts/AccountsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { RecurringView } from './components/recurring/RecurringView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickActionModal } from './components/dashboard/QuickActionModal';
import { Wallet } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isLocked, isLoading, activeTab, setActiveTab } = useApp();
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-navy-900 to-emerald-600 text-white shadow-lg animate-pulse">
            <Wallet className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold tracking-wide">Loading Local Ledger...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <AppLockScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'transactions':
        return <TransactionsView />;
      case 'accounts':
        return <AccountsView />;
      case 'budgets':
        return <BudgetsView />;
      case 'categories':
        return <CategoriesView />;
      case 'recurring':
        return <RecurringView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-navy-950 dark:text-slate-100 flex flex-col font-sans">
      <PWAInstallPrompt />
      <Navbar onQuickAction={() => setQuickAddOpen(true)} />

      <div className="flex flex-1">
        <Sidebar currentTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      <MobileNav currentTab={activeTab} onTabChange={setActiveTab} />
      <ToastContainer />

      <QuickActionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        defaultType="expense"
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
