import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Account,
  Category,
  Transaction,
  Budget,
  RecurringTransaction,
  AppSettings,
} from '../types';
import { Repository } from '../db/repository';
import { initializeDatabaseSeeds, DEFAULT_SETTINGS } from '../db/database';
import { processDueRecurringTransactions } from '../services/recurringService';
import { verifyPin } from '../services/authService';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  settings: AppSettings;
  isOnline: boolean;
  isLocked: boolean;
  isLoading: boolean;
  activeTab: string;
  toasts: ToastMessage[];
  setActiveTab: (tab: string) => void;
  refreshData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  unlockApp: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [accs, cats, txs, bgts, recs, sets] = await Promise.all([
        Repository.getAllAccounts(),
        Repository.getAllCategories(),
        Repository.getAllTransactions(),
        Repository.getAllBudgets(),
        Repository.getAllRecurring(),
        Repository.getSettings(),
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setBudgets(bgts);
      setRecurring(recs);
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    }
  }, []);

  // Initialize DB and recurring jobs on startup
  useEffect(() => {
    let mounted = true;

    async function init() {
      setIsLoading(true);
      try {
        await initializeDatabaseSeeds();
        const sets = await Repository.getSettings();
        if (mounted) {
          setSettings(sets);
          if (sets.isAppLockEnabled && sets.appLockPinHash) {
            setIsLocked(true);
          }
        }

        // Process recurring transactions
        const recurringResult = await processDueRecurringTransactions();
        if (recurringResult.processedCount > 0 && mounted) {
          showToast(
            `Processed ${recurringResult.processedCount} recurring transaction(s) due today.`,
            'info'
          );
        }

        if (mounted) {
          await refreshData();
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshData, showToast]);

  // Apply theme class
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const unlockApp = async (pin: string): Promise<boolean> => {
    if (!settings.appLockPinHash || !settings.appLockSalt) {
      setIsLocked(false);
      return true;
    }
    const isValid = await verifyPin(pin, settings.appLockPinHash, settings.appLockSalt);
    if (isValid) {
      setIsLocked(false);
      showToast('Welcome back! App unlocked.', 'success');
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (settings.isAppLockEnabled && settings.appLockPinHash) {
      setIsLocked(true);
    }
  };

  const updateSettingsHandler = async (newSettings: Partial<AppSettings>) => {
    const updated = await Repository.updateSettings(newSettings);
    setSettings(updated);
    showToast('Settings saved successfully.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        budgets,
        recurring,
        settings,
        isOnline,
        isLocked,
        isLoading,
        activeTab,
        toasts,
        setActiveTab,
        refreshData,
        showToast,
        removeToast,
        unlockApp,
        lockApp,
        updateSettings: updateSettingsHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
